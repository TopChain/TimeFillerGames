import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: jsonHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server configuration unavailable" }), { status: 503, headers: jsonHeaders });
  }

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Authenticated identity could not be verified" }), { status: 401, headers: jsonHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date().toISOString();
  let requestId: string | null = null;

  try {
    const { data: existing, error: existingError } = await admin
      .from("privacy_requests")
      .select("id,status")
      .eq("auth_user_id", user.id)
      .eq("request_kind", "erase_account")
      .in("status", ["pending", "processing"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      requestId = existing.id;
      const { error } = await admin
        .from("privacy_requests")
        .update({ status: "processing", completed_at: null })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { data, error } = await admin.from("privacy_requests").insert({
        auth_user_id: user.id,
        request_kind: "erase_account",
        request_source: "app",
        status: "processing",
      }).select("id").single();
      if (error || !data) throw error ?? new Error("Could not create privacy request");
      requestId = data.id;
    }

    const { data: participantRows, error: participantLookupError } = await admin
      .from("participants")
      .select("id")
      .eq("auth_user_id", user.id);
    if (participantLookupError) throw participantLookupError;
    const participantIds = (participantRows ?? []).map((row) => row.id);

    const { error: hostedRoomsError } = await admin.from("rooms").delete().eq("host_user_id", user.id);
    if (hostedRoomsError) throw hostedRoomsError;

    if (participantIds.length) {
      const { error: targetAuditError } = await admin.from("moderation_events").delete().in("participant_id", participantIds);
      if (targetAuditError) throw targetAuditError;
    }
    const { error: actorAuditError } = await admin.from("moderation_events").delete().eq("actor_user_id", user.id);
    if (actorAuditError) throw actorAuditError;

    const { error: participantError } = await admin.from("participants").update({
      auth_user_id: null,
      nickname: "Deleted Player",
      nickname_locked: false,
      avatar_category: null,
      avatar_key: null,
      online: false,
      ready: false,
      left_at: now,
      disconnected_at: now,
      pending_majority_activation: false,
    }).eq("auth_user_id", user.id);
    if (participantError) throw participantError;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) throw deleteUserError;

    if (requestId) {
      const { error: completedError } = await admin
        .from("privacy_requests")
        .update({ status: "completed", completed_at: now })
        .eq("id", requestId);
      if (completedError) {
        console.error("Account erasure completed but audit finalization failed", completedError);
      }
    }

    return new Response(JSON.stringify({ ok: true, completedAt: now }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    console.error("Account erasure failed", error);
    if (requestId) {
      const { error: resetError } = await admin
        .from("privacy_requests")
        .update({ status: "pending", completed_at: null })
        .eq("id", requestId);
      if (resetError) console.error("Could not reset failed erasure request", resetError);
    }
    return new Response(JSON.stringify({ error: "Account erasure could not be completed" }), { status: 500, headers: jsonHeaders });
  }
});