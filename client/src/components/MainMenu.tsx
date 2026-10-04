import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
export function MainMenu() {
  const query = new URLSearchParams(location.search);
  const invitedRoom = query.get('room') || '';
  const [roomId, setRoomId] = useState(invitedRoom);
  const [server, setServer] = useState(query.get('server') || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? `ws://${location.hostname}:2567` : 'wss://skydrift-server-n20c.onrender.com'));
  const s = useGameStore();
  return <main className="launch">
    <div className="launch-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><span className="plane-mark">↗</span></div>
    <section className="launch-card">
      <span className="eyebrow">THE LIVING ROOM FLIGHT CLUB</span>
      <h1>Small world.<br/><span>Big air.</span></h1>
      <p className="intro">One shared sky. Four pilots. Follow your aircraft on your phone. Switch to cockpit view anytime.</p>
      <div className="chips"><span>3D arena</span><span>QR join</span><span>4 pilots</span></div>
      <label>Callsign<input value={s.playerName} maxLength={20} onChange={e => s.setPlayerName(e.target.value)} /></label>
      <label>Room ID<input value={roomId} onChange={e => setRoomId(e.target.value.trim())} placeholder="Scan the host QR or paste a room ID" /></label>
      {s.error && <p role="alert" className="error">{s.error}</p>}
      <button className="primary" disabled={s.connecting || !s.playerName.trim() || !roomId} onClick={() => s.connect(server, s.playerName, 'pilot', roomId)}>{s.connecting ? 'Connecting...' : 'Join as pilot →'}</button>
      {!invitedRoom && <button className="secondary" disabled={s.connecting} onClick={() => s.connect(server, 'Host', 'host')}>Open host screen</button>}
      <details><summary>Connection settings</summary><label>WebSocket server<input value={server} onChange={e => setServer(e.target.value)} /></label></details>
      <p className="footnote">Host on a laptop or TV. Scan with phones to join from anywhere. Free server startup can take about a minute.</p>
    </section>
  </main>;
}
