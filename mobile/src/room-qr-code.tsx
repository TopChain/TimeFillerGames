import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function RoomQrCode({ roomCode }: { roomCode: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const appUrl = String(import.meta.env.VITE_APP_URL ?? '').replace(/\/+$/, '');
  const joinUrl = `${appUrl}/?join=${encodeURIComponent(roomCode)}`;
  useEffect(() => { let cancelled=false; void QRCode.toDataURL(joinUrl,{errorCorrectionLevel:'M',margin:2,width:320,color:{dark:'#111827',light:'#FFFFFF'}}).then((url)=>{if(!cancelled)setDataUrl(url);}); return()=>{cancelled=true;}; },[joinUrl]);
  return <div className="room-qr-block"><div className="room-qr-image">{dataUrl?<img src={dataUrl} alt={`QR code to join room ${roomCode}`} width="180" height="180"/>:<span>Generating QR…</span>}</div><div className="room-qr-details"><strong>Direct join link</strong><code>{joinUrl}</code></div></div>;
}
