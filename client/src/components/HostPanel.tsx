// ============================================================================
// HostPanel - what the big screen (laptop/TV) shows next to the 3D world:
// a QR code and room ID so friends' phones can join instantly, the list of
// pilots currently flying, and a copyable join link. The QR encodes a URL
// with the room + server baked in, so scanning it lands phones pre-filled
// on the MainMenu.
// ============================================================================
import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../store/gameStore';
export function HostPanel() {
  const s = useGameStore();
  const join = new URL(location.href); join.search = '';
  join.searchParams.set('room', s.room?.roomId || '');
  const server = s.serverUrl;
  join.searchParams.set('server', server);
  return <><header className="host-heading"><div><span className="eyebrow">SKYDRIFT / FLIGHT CLUB</span><h1>The shared sky</h1></div><button className="secondary" onClick={s.disconnect}>Leave screen</button></header>
    <aside className="host-panel"><span className="eyebrow">SCAN. JOIN. FLY.</span><div className="qr"><QRCodeSVG value={join.href} size={148}/></div><strong>{s.room?.roomId}</strong><p>{s.players.size}/4 pilots in the arena</p>
    {Array.from(s.players.values()).map(p => <div className="pilot-row" key={p.id}><i style={{ background: p.color }}/>{p.name}</div>)}
    {!s.players.size && <p className="footnote">Waiting for the first pilot...</p>}
    <button className="text-button" onClick={() => navigator.clipboard?.writeText(join.href).catch(() => {})}>Copy join link</button>
    <p className="footnote">On iPhone, turn sideways with rotation lock off. For an app-style screen: Safari Share → Add to Home Screen. Open the app and enter this room ID.</p></aside></>;
}
