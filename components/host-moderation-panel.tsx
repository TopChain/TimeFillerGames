'use client';

import { useEffect, useState } from 'react';
import {
  designateRoomCoHost,
  fetchHostRecoveryState,
  fetchModerationEvents,
  heartbeatHostRoom,
  removeParticipant,
  renameParticipant,
  revokeRoomCoHost,
  setParticipantRole,
  unlockParticipantNickname,
  type HostRecoveryState,
  type LiveRoom,
  type ModerationEvent,
  type PublicParticipant,
} from '@/lib/client-room';

type Props = {
  accessToken: string;
  roomCode: string;
  roomStatus: LiveRoom['status'];
  participants: PublicParticipant[];
  onChanged: () => Promise<void> | void;
};

function eventSummary(event: ModerationEvent) {
  const details = event.details ?? {};
  if (event.action === 'role_changed') return `Role: ${String(details.from ?? '—')} → ${String(details.to ?? '—')}${details.reason ? ` · ${String(details.reason)}` : ''}`;
  if (event.action === 'participant_removed') return `Removed ${String(details.nickname ?? 'participant')}`;
  if (event.action === 'nickname_overridden') return `Nickname: ${String(details.from ?? '—')} → ${String(details.to ?? '—')}`;
  return `Unlocked nickname ${String(details.nickname ?? '')}`.trim();
}

export function HostModerationPanel({ accessToken, roomCode, roomStatus, participants, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [events, setEvents] = useState<ModerationEvent[]>([]);
  const [recovery, setRecovery] = useState<HostRecoveryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lobby = roomStatus === 'lobby';

  async function refreshEvents() {
    try {
      const result = await fetchModerationEvents(accessToken, roomCode);
      setEvents(result.events);
    } catch {
      // Room moderation remains usable even if the audit feed is temporarily unavailable.
    }
  }

  async function refreshRecovery() {
    try {
      setRecovery(await fetchHostRecoveryState(accessToken, roomCode));
    } catch {
      // Host controls remain usable if the recovery-status read is temporarily unavailable.
    }
  }

  useEffect(() => {
    void refreshEvents();
    void refreshRecovery();
    const beat = () => void heartbeatHostRoom(accessToken, roomCode).catch(() => undefined);
    beat();
    const heartbeatTimer = window.setInterval(beat, 10_000);
    const recoveryTimer = window.setInterval(() => void refreshRecovery(), 15_000);
    return () => {
      window.clearInterval(heartbeatTimer);
      window.clearInterval(recoveryTimer);
    };
  }, [accessToken, roomCode]);

  async function afterMutation() {
    await onChanged();
    await Promise.all([refreshEvents(), refreshRecovery()]);
  }

  async function changeRole(participant: PublicParticipant, role: 'participant' | 'spectator') {
    setBusyId(participant.id); setError(null);
    try {
      await setParticipantRole(accessToken, roomCode, participant.id, role);
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this participant.');
    } finally { setBusyId(null); }
  }

  async function makeCoHost(participant: PublicParticipant) {
    setBusyId(participant.id); setError(null);
    try {
      await designateRoomCoHost(accessToken, roomCode, participant.id);
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not designate this co-host.');
    } finally { setBusyId(null); }
  }

  async function revokeCoHost(participant: PublicParticipant) {
    setBusyId(participant.id); setError(null);
    try {
      await revokeRoomCoHost(accessToken, roomCode, participant.id);
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke this co-host.');
    } finally { setBusyId(null); }
  }

  async function saveNickname(participant: PublicParticipant) {
    setBusyId(participant.id); setError(null);
    try {
      await renameParticipant(accessToken, roomCode, participant.id, nicknameDraft);
      setEditingId(null);
      setNicknameDraft('');
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not override this nickname.');
    } finally { setBusyId(null); }
  }

  async function unlockNickname(participant: PublicParticipant) {
    setBusyId(participant.id); setError(null);
    try {
      await unlockParticipantNickname(accessToken, roomCode, participant.id);
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not unlock this nickname.');
    } finally { setBusyId(null); }
  }

  async function remove(participant: PublicParticipant) {
    setBusyId(participant.id); setError(null);
    try {
      await removeParticipant(accessToken, roomCode, participant.id);
      setConfirmRemoveId(null);
      await afterMutation();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove this participant.');
    } finally { setBusyId(null); }
  }

  return <details className="host-moderation">
    <summary><span>Room moderation & recovery</span><strong>{participants.length}</strong></summary>
    <div className="host-moderation-body">
      <p className="support">Role and co-host changes are lobby-only. The designated co-host is the only seat allowed to recover Host ownership after the Host heartbeat grace period. Nickname override and emergency removal remain available during a live game.</p>
      {recovery?.cohost
        ? <div className="notice success">Recovery co-host: <strong>{recovery.cohost.nickname}</strong>. Host heartbeat grace: {recovery.recoveryGraceSeconds}s.</div>
        : <div className="notice">No recovery co-host is designated. Choose one trusted active participant before starting when Host-loss recovery matters.</div>}
      {!lobby && <div className="notice warning">Participant/spectator/co-host role changes are locked until the room returns to the lobby so active game state stays consistent.</div>}
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="host-moderation-list">
        {participants.length === 0 && <div className="notice">No active room members to moderate.</div>}
        {participants.map((participant) => {
          const busy = busyId === participant.id;
          const confirming = confirmRemoveId === participant.id;
          const editing = editingId === participant.id;
          return <div className="host-moderation-row" key={participant.id}>
            <div className="host-moderation-identity">
              {editing ? <input aria-label={`New nickname for ${participant.nickname}`} maxLength={24} value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} /> : <strong>{participant.nickname}{participant.nickname_locked ? ' · 🔒' : ''}{participant.role === 'cohost' ? ' · 🛟' : ''}</strong>}
              <span>{participant.role} · {participant.online ? 'online' : 'reconnecting'}{participant.nickname_locked ? ' · Host-locked name' : ''}</span>
            </div>
            <div className="host-moderation-actions">
              {editing ? <>
                <button className="btn primary" disabled={busy || nicknameDraft.trim().length < 2} onClick={() => void saveNickname(participant)}>{busy ? 'Saving…' : 'Save & lock'}</button>
                <button className="btn secondary" disabled={busy} onClick={() => { setEditingId(null); setNicknameDraft(''); }}>Cancel</button>
              </> : <>
                <button className="btn secondary" disabled={busy} onClick={() => { setEditingId(participant.id); setNicknameDraft(participant.nickname); }}>Rename</button>
                {participant.nickname_locked && <button className="btn secondary" disabled={busy} onClick={() => void unlockNickname(participant)}>Unlock name</button>}
              </>}
              {participant.role === 'cohost'
                ? <button className="btn secondary" disabled={!lobby || busy} onClick={() => void revokeCoHost(participant)}>Revoke co-host</button>
                : participant.role === 'participant' && <button className="btn secondary" disabled={!lobby || busy} onClick={() => void makeCoHost(participant)}>Make co-host</button>}
              {participant.role === 'spectator'
                ? <button className="btn secondary" disabled={!lobby || busy} onClick={() => void changeRole(participant, 'participant')}>Restore player</button>
                : participant.role !== 'cohost' && <button className="btn secondary" disabled={!lobby || busy} onClick={() => void changeRole(participant, 'spectator')}>Make spectator</button>}
              {confirming ? <>
                <button className="btn danger" disabled={busy} onClick={() => void remove(participant)}>{busy ? 'Removing…' : 'Confirm remove'}</button>
                <button className="btn secondary" disabled={busy} onClick={() => setConfirmRemoveId(null)}>Cancel</button>
              </> : <button className="btn danger" disabled={busy} onClick={() => setConfirmRemoveId(participant.id)}>Remove</button>}
            </div>
          </div>;
        })}
      </div>

      <div className="moderation-audit">
        <div className="section-heading"><div><div className="eyebrow">Audit trail</div><h3>Recent moderation activity</h3></div><button className="btn secondary" onClick={() => void refreshEvents()}>Refresh</button></div>
        {events.length === 0 ? <div className="notice">No moderation actions recorded in this room yet.</div> : events.slice(0, 12).map((event) => <div className="control-row" key={event.id}><span>{eventSummary(event)}</span><strong>{new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>)}
      </div>
    </div>
  </details>;
}
