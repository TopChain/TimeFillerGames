import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(mobileDir, '..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, mobileDir, '');
  return {
    root: mobileDir,
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@/lib/supabase/browser', replacement: path.resolve(mobileDir, 'src/supabase-browser.ts') },
        { find: '@/components/room-qr-code', replacement: path.resolve(mobileDir, 'src/room-qr-code.tsx') },
        { find: '@', replacement: repoRoot },
      ],
    },
    define: {
      'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      'process.env.NEXT_PUBLIC_APP_URL': JSON.stringify(env.VITE_APP_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(''),
      'process.env.NEXT_PUBLIC_REVIEW_ACCESS_ENABLED': JSON.stringify(env.VITE_REVIEW_ACCESS_ENABLED || 'false'),
    },
    build: { outDir: path.resolve(mobileDir, 'dist'), emptyOutDir: true, sourcemap: true },
    server: { port: 4173 },
  };
});
