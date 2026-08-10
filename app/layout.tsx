import type { Metadata, Viewport } from 'next';
import { AppearanceControl } from '@/components/appearance-control';
import './globals.css';
import './quick-draw.css';
import './people-bingo.css';
import './room-qr.css';
import './host-moderation.css';
import './accessibility.css';
import './appearance.css';

export const metadata: Metadata = {
  title: 'TimeFillerGames — Make every spare moment playable',
  description: 'Host-led multiplayer mini-games for 3, 5, 8, or 10 minutes of spare group time.',
  applicationName: 'TimeFillerGames',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'TimeFillerGames', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#5B5DEE', colorScheme: 'light dark' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<AppearanceControl /></body></html>;
}
