import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('store reviewer access contract', () => {
  const envExample = readFileSync('.env.example', 'utf8');
  const mobileEnvExample = readFileSync('mobile/.env.example', 'utf8');
  const mobileBuild = readFileSync('mobile/build.config.ts', 'utf8');
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const mobileMain = readFileSync('mobile/src/main.tsx', 'utf8');
  const source = readFileSync('components/reviewer-access.tsx', 'utf8');

  it('keeps reviewer access disabled by default on web and native', () => {
    expect(envExample).toContain('NEXT_PUBLIC_REVIEW_ACCESS_ENABLED=false');
    expect(mobileEnvExample).toContain('VITE_REVIEW_ACCESS_ENABLED=false');
    expect(source).toContain("process.env.NEXT_PUBLIC_REVIEW_ACCESS_ENABLED === 'true'");
    expect(source).toContain('if (!REVIEW_ACCESS_ENABLED) return null');
  });

  it('mounts and propagates the review-only access path in both web and native store builds', () => {
    expect(layout).toContain("import { ReviewerAccess } from '@/components/reviewer-access'");
    expect(layout).toContain('<ReviewerAccess />');
    expect(mobileMain).toContain("import {ReviewerAccess} from '../../components/reviewer-access'");
    expect(mobileMain).toContain('<ReviewerAccess/>');
    expect(mobileBuild).toContain("'process.env.NEXT_PUBLIC_REVIEW_ACCESS_ENABLED'");
    expect(mobileBuild).toContain("env.VITE_REVIEW_ACCESS_ENABLED || 'false'");
  });

  it('uses runtime credentials with the real Supabase Host session and stores no demo password', () => {
    expect(source).toContain('signInWithPassword');
    expect(source).toContain('email: email.trim()');
    expect(source).toContain('password,');
    expect(source).toContain('data.user.is_anonymous');
    expect(source).not.toMatch(/password\s*[:=]\s*['"][^'"]{8,}['"]/);
  });
});
