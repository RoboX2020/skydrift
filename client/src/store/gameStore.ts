import { create } from 'zustand';
import { Client, Room } from 'colyseus.js';
interface Player { id: string; name: string; color: string; score: number; aircraft: any }
interface Input { forward: number; strafe: number; vertical: number; pitch: number; roll: number; yaw: number; throttle: number; brake: boolean; boost: boolean }
interface State {
  cameraView: 'chase' | 'cockpit'; setCameraView:(view:'chase'|'cockpit')=>void;
  connected: boolean; connecting: boolean; error: string | null; room: Room | null;
  serverUrl: string; role: 'host' | 'pilot'; players: Map<string, Player>; playerId: string | null;
  timeOfDay: number; playerName: string; showChat: boolean; showControls: boolean;
  chatMessages: any[]; input: Input;
  connect: (url: string, name: string, role?: 'host' | 'pilot', roomId?: string) => Promise<void>;
  disconnect: () => void; updateInput: (input: Partial<Input>) => void;
  respawn: () => void; sendChat: (text: string) => void;
  setShowChat: (v: boolean) => void; setShowControls: (v: boolean) => void; setPlayerName: (v: string) => void;
}
const neutral: Input = { forward: 0, strafe: 0, vertical: 0, pitch: 0, roll: 0, yaw: 0, throttle: 0.5, brake: false, boost: false };
let timer: ReturnType<typeof setInterval> | undefined;
export const useGameStore = create<State>((set, get) => ({
  cameraView:'chase',setCameraView:(cameraView)=>set({cameraView}),
  connected: false, connecting: false, error: null, room: null, serverUrl: '', role: 'pilot',
  players: new Map(), playerId: null, timeOfDay: 12, playerName: 'Pilot',
  showChat: false, showControls: true, chatMessages: [], input: { ...neutral },
  connect: async (url, name, role = 'pilot', roomId) => {
    if (get().connecting || get().connected) return;
    set({ connecting: true, error: null });
    try {
      const client = new Client(url);
      const room = role === 'host'
        ? await client.create('skydrift', { role })
        : roomId ? await client.joinById(roomId, { name, role })
        : await client.joinOrCreate('skydrift', { name, role });
      set({ room, role, serverUrl: url, connected: true, connecting: false, playerId: room.sessionId, input: { ...neutral } });
      room.onStateChange((state: any) => {
        const players = new Map<string, Player>();
        state.players.forEach((p: any, id: string) => players.set(id, p.toJSON()));
        set({ players, timeOfDay: state.timeOfDay });
      });
      room.onMessage('chat', (message) => set({ chatMessages: [...get().chatMessages.slice(-49), message] }));
      room.onMessage('playerJoined', () => {});
      room.onMessage('playerLeft', () => {});
      room.onLeave(() => {
        clearInterval(timer);
        set({ connected: false, room: null, playerId: null, players: new Map(), input: { ...neutral } });
      });
      room.onError((_code, message) => set({ error: message || 'Connection interrupted' }));
      if (role === 'pilot') timer = setInterval(() => get().room?.send('input', get().input), 50);
    } catch (e) { set({ connecting: false, error: e instanceof Error ? e.message : 'Could not join room' }); }
  },
  disconnect: () => { clearInterval(timer); void get().room?.leave(); set({ connected: false, room: null, players: new Map(), input: { ...neutral } }); },
  updateInput: (input) => set({ input: { ...get().input, ...input } }),
  respawn: () => get().room?.send('respawn'),
  sendChat: (text) => { if (text.trim()) get().room?.send('chat', { text: text.trim() }); },
  setShowChat: (showChat) => set({ showChat }), setShowControls: (showControls) => set({ showControls }),
  setPlayerName: (playerName) => set({ playerName }),
}));
