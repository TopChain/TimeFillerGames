import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support — TimeFillerGames',
  description: 'Help and troubleshooting for TimeFillerGames rooms, joining, QR codes, connectivity, privacy, and account management.',
};

export default function SupportPage() {
  return <main className="shell legal-page">
    <section className="card">
      <div className="kicker">TimeFillerGames Support</div>
      <h1>Help with a game session</h1>
      <p>TimeFillerGames is designed for short, host-led multiplayer sessions. If something goes wrong, use the guidance below before restarting the room.</p>

      <h2>Can’t join a room</h2>
      <p>Confirm that the six-character room code matches the Host screen, or scan the current room QR code again. If the room is locked, closed, or expired, ask the Host to reopen or create a new room.</p>

      <h2>Connection dropped</h2>
      <p>Keep the app open and reconnect to the internet. TimeFillerGames preserves the authenticated seat so brief interruptions can recover without creating a second player identity. The Host may pause the game when recovery is needed.</p>

      <h2>QR camera access</h2>
      <p>The native app requests camera access only when scanning a room QR code. You can always join by entering the room code instead.</p>

      <h2>Host access</h2>
      <p>Hosts sign in with a verified email magic link. If the link opens a browser instead of the installed app, return to TimeFillerGames and request a fresh link after checking that the app is installed and up to date.</p>

      <h2>Privacy and account management</h2>
      <p>Use the in-app Privacy control or the <a href="/privacy">Account &amp; data</a> page to manage or permanently remove a TimeFillerGames identity. Review the <a href="/privacy-policy">Privacy Policy</a> for the data categories used by Release 1.</p>

      <h2>Terms</h2>
      <p>Use of TimeFillerGames is governed by the <a href="/terms">Terms of Use</a>. The public launch versions of the Privacy Policy and Terms will receive final account-holder/legal review before store submission.</p>

      <p className="muted">For store review, this page is the first-party support URL. A dedicated support contact channel will be attached to the production domain before public release.</p>
    </section>
  </main>;
}
