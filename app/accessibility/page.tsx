import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility — TimeFillerGames',
  description: 'Accessibility features and support information for TimeFillerGames.',
};

export default function AccessibilityPage() {
  return <main className="shell legal-page">
    <section className="card">
      <div className="kicker">Accessibility</div>
      <h1>Playing TimeFillerGames with different access needs</h1>
      <p>TimeFillerGames is built around short, high-contrast, touch-friendly multiplayer flows. Release 1 includes accessibility foundations across the web and bundled mobile clients.</p>

      <h2>Release 1 support</h2>
      <p>Primary interactive targets are designed for at least 44×44 CSS pixels. Keyboard focus is visibly indicated. Interface layouts are built to tolerate enlarged text without intentionally clipping core controls.</p>
      <p>Color is not the only signal for important game state. Bingo marking, readiness, warnings, live/paused state, and result status also use text, icons, shape, or position.</p>
      <p>TimeFillerGames respects reduced-motion preferences and provides increased-contrast and forced-colors foundations where supported by the operating system or browser.</p>

      <h2>Language and readability</h2>
      <p>Release 1 supports English, Traditional Chinese, Simplified Chinese, Spanish, Japanese, and Korean interface dictionaries. A player’s interface language is personal and remains separate from the Host-selected shared room/game content language.</p>

      <h2>Camera alternatives</h2>
      <p>The native app requests camera permission only for scanning a room QR code. Entering the room code manually remains available when camera access is unavailable or undesired.</p>

      <h2>Known validation gate</h2>
      <p>Before public release, the final staged/native builds must complete real-device keyboard, screen-reader, text-scale, contrast, and supported-device checks. Any material issue found during that validation is a release blocker.</p>

      <h2>Support</h2>
      <p>Accessibility feedback can be submitted through the production support contact listed on the <a href="/support">Support page</a>. A real support contact will be attached to the production domain before store submission.</p>
    </section>
  </main>;
}
