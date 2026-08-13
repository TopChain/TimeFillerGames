import { useEffect, useState, type ReactNode } from 'react';
import { App } from '@capacitor/app';
import { CapacitorBarcodeScanner, Html5QrcodeSupportedFormats } from '@capacitor/barcode-scanner';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { importNativeAuthUrl } from './mobile-auth';

function extractRoomCode(value: string) {
  const raw = value.trim();
  if (/^[A-Za-z0-9]{4,12}$/.test(raw)) return raw.toUpperCase();
  try {
    const url = new URL(raw);
    const queryCode = url.searchParams.get('join') ?? url.searchParams.get('room');
    if (queryCode) return queryCode.trim().toUpperCase();
    if (url.protocol === 'timefillergames:' && url.hostname === 'join') return url.pathname.replace(/^\/+/, '').trim().toUpperCase();
    const match = url.pathname.match(/\/join\/([A-Za-z0-9]{4,12})/i);
    return match?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

function routeRoom(code: string) {
  void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  window.location.assign(`/?join=${encodeURIComponent(code)}`);
}

async function handleNativeUrl(url: string) {
  if (url.startsWith('timefillergames://auth/')) {
    await importNativeAuthUrl(url);
    window.location.assign('/?nativeHost=1');
    return;
  }
  const roomCode = extractRoomCode(url);
  if (roomCode) routeRoom(roomCode);
}

export function NativeShell({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    let networkHandle: { remove: () => Promise<void> } | undefined;
    let urlHandle: { remove: () => Promise<void> } | undefined;
    void Network.getStatus().then((status) => setConnected(status.connected));
    void Network.addListener('networkStatusChange', (status) => setConnected(status.connected)).then((handle) => { networkHandle = handle; });
    void App.addListener('appUrlOpen', ({ url }) => { void handleNativeUrl(url).catch(() => undefined); }).then((handle) => { urlHandle = handle; });
    void App.getLaunchUrl().then((launch) => { if (launch?.url) void handleNativeUrl(launch.url).catch(() => undefined); });
    return () => { if (networkHandle) void networkHandle.remove(); if (urlHandle) void urlHandle.remove(); };
  }, []);

  async function scanRoom() {
    setScanError(null);
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: Html5QrcodeSupportedFormats.QR_CODE,
        scanInstructions: 'Scan a TimeFillerGames room QR code',
        scanButton: false,
        cancelButtonAccessibilityLabel: 'Cancel room QR scan',
        torchButtonOnAccessibilityLabel: 'Turn flashlight off',
        torchButtonOffAccessibilityLabel: 'Turn flashlight on',
      });
      const code = extractRoomCode(result.ScanResult);
      if (!code) throw new Error('This QR code is not a TimeFillerGames room link.');
      routeRoom(code);
    } catch (cause) {
      setScanError(cause instanceof Error ? cause.message : 'Could not scan this room QR code.');
      void Haptics.notification({ type: NotificationType.Error }).catch(() => undefined);
    }
  }

  async function shareCurrentRoom() {
    const query = new URLSearchParams(window.location.search);
    const code = (query.get('join') ?? query.get('room') ?? '').trim().toUpperCase();
    if (!code) return;
    const appUrl = String(import.meta.env.VITE_APP_URL ?? '').replace(/\/+$/, '');
    await Share.share({ title: `TimeFillerGames room ${code}`, text: `Join room ${code}`, url: `${appUrl}/?join=${encodeURIComponent(code)}`, dialogTitle: 'Share room' });
  }

  const query = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const currentRoom = query.get('join') ?? query.get('room');
  return <><div className="native-safe-top" aria-hidden="true" />{!connected && <div className="native-offline" role="status">Offline · your room will reconnect when the network returns.</div>}<div className="native-actions"><button className="btn player" onClick={() => void scanRoom()}>Scan room QR</button>{currentRoom && <button className="btn secondary" onClick={() => void shareCurrentRoom()}>Share room</button>}</div>{scanError && <div className="native-scan-error" role="alert">{scanError}</div>}{children}</>;
}
