'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

export function RoomQrCode({ roomCode }: { roomCode: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);
  const joinUrl = useMemo(() => origin ? `${origin}/?join=${encodeURIComponent(roomCode)}` : `/?join=${encodeURIComponent(roomCode)}`, [origin, roomCode]);

  useEffect(() => {
    let cancelled = false;
    if (!origin) return;
    void QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: { dark: '#111827', light: '#FFFFFF' },
    }).then((url) => { if (!cancelled) setDataUrl(url); });
    return () => { cancelled = true; };
  }, [joinUrl, origin]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return <div className="room-qr-block">
    <div className="room-qr-image">
      {dataUrl ? <img src={dataUrl} alt={`QR code to join room ${roomCode}`} width="180" height="180" /> : <span aria-live="polite">Generating QR…</span>}
    </div>
    <div className="room-qr-details">
      <strong>Direct join link</strong>
      <code>{joinUrl}</code>
      <button className="btn secondary" type="button" onClick={() => void copyLink()}>{copied ? '✓ Link copied' : 'Copy link'}</button>
    </div>
  </div>;
}
