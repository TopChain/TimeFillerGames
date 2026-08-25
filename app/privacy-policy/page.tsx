export default function PrivacyPolicyPage() {
  return <main className="shell"><article className="panel" style={{maxWidth:900,margin:'48px auto'}}>
    <div className="eyebrow">TimeFillerGames · Release 1 draft</div>
    <h1>Privacy Policy</h1>
    <p className="support"><strong>Draft for pre-release review.</strong> This page reflects the current Release 1 implementation and must receive final legal/account-holder approval before public store launch.</p>
    <h2>What TimeFillerGames does</h2>
    <p>TimeFillerGames runs short host-led multiplayer games. A Host creates a room and Players join with a room code, QR code, or link.</p>
    <h2>Information used to operate the service</h2>
    <ul>
      <li>Host email address and authentication identifier for Host sign-in.</li>
      <li>Temporary authenticated identifiers for Players who join without a visible account.</li>
      <li>Display nickname, built-in avatar choice, interface language, room readiness/presence, and reconnect state.</li>
      <li>Room settings, game submissions, scores, rankings, guesses, and drawing strokes needed to operate multiplayer games.</li>
      <li>Host moderation events and rate-limit/security records used for safety, abuse prevention, and service integrity.</li>
      <li>Authentication and infrastructure security logs may include IP address, user-agent/browser or device information, request metadata, timestamps, and authentication events. These records are used for authentication, rate limiting, security, abuse prevention, troubleshooting, and reliable service operation—not advertising or cross-app tracking.</li>
    </ul>
    <h2>Uploaded photos</h2>
    <p>Uploaded participant photos are disabled in Release 1. Players use built-in avatars.</p>
    <h2>Advertising and tracking</h2>
    <p>Release 1 does not include an advertising SDK or cross-app tracking SDK, and TimeFillerGames does not sell personal data for advertising.</p>
    <h2>Service providers</h2>
    <p>TimeFillerGames uses Supabase for authentication, database and realtime infrastructure, and Vercel for HTTPS application hosting and server execution. Provider security and operational systems may process the information needed to deliver, secure, troubleshoot, and maintain the service under their applicable agreements and configurations.</p>
    <h2>Retention</h2>
    <p>Release 1 game rooms are temporary. The application default room lifetime is 120 minutes, with server configuration limited to 15–1440 minutes. Expired rooms are eligible for the daily retention cleanup, and deleting a room cascades through its associated gameplay and room data. Server rate-limit buckets older than 24 hours are also removed by the cleanup process. Authentication, infrastructure-security, and provider operational records may follow the applicable provider retention schedule or be retained when needed for security, abuse prevention, dispute handling, or legal obligations.</p>
    <h2>Account and data removal</h2>
    <p>Authenticated Hosts and temporary Players can use the in-app Privacy control to permanently remove their TimeFillerGames authentication identity and associated personal data. Hosts may first verify their account from the public <a href="/privacy">account and data management page</a>. Rooms owned by a removed Host are closed; participation in rooms owned by another person is anonymized before the authentication identity is removed. Infrastructure/security logs that must be retained for security, legal, or provider-operational reasons may follow the applicable provider retention schedule.</p>
    <h2>Security</h2>
    <p>The production service is hosted over HTTPS/TLS. Multiplayer game authority and high-impact actions are validated by server-side services rather than trusting browser or mobile client state alone.</p>
    <h2>Children and classroom use</h2>
    <p>Release 1 supports classroom use but is not marketed as a child-directed or Kids service. The dedicated Kids context and uploaded participant photos are disabled. Final store target-audience and age-rating answers will match the submitted Release 1 behavior.</p>
    <h2>Your choices</h2>
    <p>You can leave a room, use built-in identity options, and request permanent account/data removal. A public support contact will be added before store submission.</p>
    <h2>Changes</h2>
    <p>This pre-release policy may change before launch as final legal review and store disclosures are completed.</p>
    <p><a className="btn ghost" href="/">Return to TimeFillerGames</a></p>
  </article></main>;
}
