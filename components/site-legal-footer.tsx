function publicHref(path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim().replace(/\/$/, '');
  return base ? `${base}${path}` : path;
}

export function SiteLegalFooter() {
  return <nav aria-label="Legal, accessibility and support" style={{display:'flex',justifyContent:'center',gap:16,flexWrap:'wrap',padding:'24px 16px 88px',fontSize:14}}>
    <a href={publicHref('/privacy-policy')}>Privacy Policy</a>
    <a href={publicHref('/terms')}>Terms</a>
    <a href={publicHref('/privacy')}>Account &amp; data</a>
    <a href={publicHref('/accessibility')}>Accessibility</a>
    <a href={publicHref('/support')}>Support</a>
  </nav>;
}
