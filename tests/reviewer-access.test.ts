import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('store reviewer access contract', () => {
  const envExample = readFileSync('.env.example', 'utf8');
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const source = readFileSync('components/reviewer-access.tsx', 'utf8');

  it('keeps reviewer access disabled by default', () => {
    expect(envExample).toContain('NEXT_PUBLIC_REVIEW_ACCESS_ENABLED=false');
    expect(source).toContain("process.env.NEXT_PUBLIC_REVIEW_ACCESS_ENABLED === 'true'");
    expect(source).toContain('if (!REVIEW_ACCESS_ENABLED) return null');
  });

  it('mounts the review-only access path globally for store builds', () => {
    expect(layout).toContain("import { ReviewerAccess } from '@/components/reviewer-access'");
    expect(layout).toContain('<ReviewerAccess />');
  });

  it('uses runtime credentials with the real Supabase Host session and stores no demo password', () => {
    expect(source).toContain('signInWithPassword');
    expect(source).toContain('email: email.trim()');
    expect(source).toContain('password,');
    expect(source).toContain('data.user.is_anonymous');
    expect(source).not.toMatch(/password\s*[:=]\s*['"][^'"]{8,}['"]/);
  });
});
