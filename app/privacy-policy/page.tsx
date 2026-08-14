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
    </ul>
    <h2>Uploaded photos</h2>
    <p>Uploaded participant photos are disabled in Release 1. Players use built-in avatars.</p>
    <h2>Advertising and tracking</h2>
    <p>Release 1 does not include an advertising SDK or cross-app tracking SDK, and TimeFillerGames does not sell personal data for advertising.</p>
    <h2>Service providers</h2>
    <p>TimeFillerGames uses infrastructure providers for authentication, database/realtime operation, hosting, and related service delivery. These providers process information on behalf of the service according to their applicable agreements and configurations.</p>
    <h2>Retention</h2>
    <p>Game rooms have an expiry time and are intended to be temporary. Operational and moderation records may be retained longer when needed for security, abuse prevention, dispute handling, legal obligations, or reliable service operation. Final production retention periods will be stated here before launch.</p>
    <h2>Account and data removal</h2>
    <p>Authenticated Hosts and temporary Players can use the in-app Privacy control to permanently remove their TimeFillerGames authentication identity and associated personal data. Hosts may first verify their account from the public <a href="/privacy">account and data management page</a>. Rooms owned by a removed Host are closed; participation in rooms owned by another person is anonymized before the authentication identity is removed.</p>
    <h2>Security</h2>
    <p>Production traffic is intended to use encrypted HTTPS/TLS connections. Multiplayer game authority and high-impact actions are validated by server-side services rather than trusting browser or mobile client state alone.</p>
    <h2>Children and classroom use</h2>
    <p>Release 1 supports classroom use but is not intended to be marketed as a child-directed service until the dedicated children/privacy review is complete. The final launch policy and age/target-audience disclosures will be published before store submission.</p>
    <h2>Your choices</h2>
    <p>You can leave a room, use built-in identity options, request account/data removal, and contact TimeFillerGames support when the final public support channel is published.</p>
    <h2>Changes</h2>
    <p>This pre-release policy may change before launch as legal review, deployment configuration, and store disclosures are finalized.</p>
    <p><a className="btn ghost" href="/">Return to TimeFillerGames</a></p>
  </article></main>;
}
