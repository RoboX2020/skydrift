import { create } from 'zustand';
import * as Colyseus from 'colyseus.js';

// Types matching server schema
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Aircraft {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  speed: number;
  altitude: number;
  heading: number;
  throttle: number;
  isOnGround: boolean;
}

interface Player {
  id: string;
  name: string;
  aircraft: Aircraft;
  score: number;
  color: string;
}

interface Weather {
  windDirection: Vector3;
  windSpeed: number;
  turbulence: number;
  visibility: number;
  cloudCover: number;
}

interface PlayerInput {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
  brake: boolean;
  boost: boolean;
}

interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

interface GameState {
  // Connection state
  connected: boolean;
  connecting: boolean;
  error: string | null;
  room: Colyseus.Room | null;
  
  // Game state
  playerId: string | null;
  players: Map<string, Player>;
  weather: Weather;
  timeOfDay: number;
  serverTick: number;
  
  // Local input
  input: PlayerInput;
  
  // Chat
  chatMessages: ChatMessage[];
  
  // UI state
  showChat: boolean;
  showControls: boolean;
  playerName: string;
  
  // Actions
  connect: (serverUrl: string, playerName: string) => Promise<void>;
  disconnect: () => void;
  updateInput: (input: Partial<PlayerInput>) => void;
  sendChat: (text: string) => void;
  respawn: () => void;
  setShowChat: (show: boolean) => void;
  setShowControls: (show: boolean) => void;
  setPlayerName: (name: string) => void;
}

const DEFAULT_INPUT: PlayerInput = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  throttle: 0.5,
  brake: false,
  boost: false,
};

const DEFAULT_WEATHER: Weather = {
  windDirection: { x: 1, y: 0, z: 0 },
  windSpeed: 5,
  turbulence: 0.1,
  visibility: 10000,
  cloudCover: 0.3,
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  connected: false,
  connecting: false,
  error: null,
  room: null,
  playerId: null,
  players: new Map(),
  weather: DEFAULT_WEATHER,
  timeOfDay: 12,
  serverTick: 0,
  input: { ...DEFAULT_INPUT },
  chatMessages: [],
  showChat: false,
  showControls: true,
  playerName: `Pilot_${Math.random().toString(36).substring(2, 6)}`,

  connect: async (serverUrl: string, playerName: string) => {
    set({ connecting: true, error: null });
    
    try {
      const client = new Colyseus.Client(serverUrl);
      const room = await client.joinOrCreate('skydrift', { name: playerName });
      
      set({
        room,
        connected: true,
        connecting: false,
        playerId: room.sessionId,
        playerName,
      });
      
      // Listen for state changes
      room.state.players.onAdd((player: any, key: string) => {
        const players = new Map(get().players);
        players.set(key, {
          id: player.id,
          name: player.name,
          color: player.color,
          score: player.score,
          aircraft: {
            position: { x: player.aircraft.position.x, y: player.aircraft.position.y, z: player.aircraft.position.z },
            rotation: { x: player.aircraft.rotation.x, y: player.aircraft.rotation.y, z: player.aircraft.rotation.z, w: player.aircraft.rotation.w },
            velocity: { x: player.aircraft.velocity.x, y: player.aircraft.velocity.y, z: player.aircraft.velocity.z },
            speed: player.aircraft.speed,
            altitude: player.aircraft.altitude,
            heading: player.aircraft.heading,
            throttle: player.aircraft.throttle,
            isOnGround: player.aircraft.isOnGround,
          },
        });
        set({ players });
        
        // Listen for changes to this player's aircraft
        player.aircraft.onChange(() => {
          const players = new Map(get().players);
          const existing = players.get(key);
          if (existing) {
            existing.aircraft = {
              position: { x: player.aircraft.position.x, y: player.aircraft.position.y, z: player.aircraft.position.z },
              rotation: { x: player.aircraft.rotation.x, y: player.aircraft.rotation.y, z: player.aircraft.rotation.z, w: player.aircraft.rotation.w },
              velocity: { x: player.aircraft.velocity.x, y: player.aircraft.velocity.y, z: player.aircraft.velocity.z },
              speed: player.aircraft.speed,
              altitude: player.aircraft.altitude,
              heading: player.aircraft.heading,
              throttle: player.aircraft.throttle,
              isOnGround: player.aircraft.isOnGround,
            };
            players.set(key, { ...existing });
            set({ players });
          }
        });
      });
      
      room.state.players.onRemove((_player: any, key: string) => {
        const players = new Map(get().players);
        players.delete(key);
        set({ players });
      });
      
      // Listen for weather changes
      room.state.weather.onChange(() => {
        set({
          weather: {
            windDirection: { 
              x: room.state.weather.windDirection.x,
              y: room.state.weather.windDirection.y,
              z: room.state.weather.windDirection.z,
            },
            windSpeed: room.state.weather.windSpeed,
            turbulence: room.state.weather.turbulence,
            visibility: room.state.weather.visibility,
            cloudCover: room.state.weather.cloudCover,
          },
        });
      });
      
      // Listen for time changes
      room.state.onChange(() => {
        set({
          timeOfDay: room.state.timeOfDay,
          serverTick: room.state.serverTick,
        });
      });
      
      // Listen for chat messages
      room.onMessage('chat', (message: ChatMessage) => {
        set({ chatMessages: [...get().chatMessages.slice(-49), message] });
      });
      
      // Handle disconnect
      room.onLeave(() => {
        set({
          connected: false,
          room: null,
          playerId: null,
          players: new Map(),
        });
      });
      
      // Start input sync loop
      const inputInterval = setInterval(() => {
        const { room, input } = get();
        if (room) {
          room.send('input', input);
        }
      }, 50); // 20Hz input rate
      
      // Store interval for cleanup
      (room as any)._inputInterval = inputInterval;
      
    } catch (error: any) {
      set({
        connecting: false,
        error: error.message || 'Failed to connect',
      });
    }
  },

  disconnect: () => {
    const { room } = get();
    if (room) {
      if ((room as any)._inputInterval) {
        clearInterval((room as any)._inputInterval);
      }
      room.leave();
    }
    set({
      connected: false,
      room: null,
      playerId: null,
      players: new Map(),
    });
  },

  updateInput: (newInput: Partial<PlayerInput>) => {
    set({ input: { ...get().input, ...newInput } });
  },

  sendChat: (text: string) => {
    const { room } = get();
    if (room && text.trim()) {
      room.send('chat', { text: text.trim() });
    }
  },

  respawn: () => {
    const { room } = get();
    if (room) {
      room.send('respawn');
    }
  },

  setShowChat: (show: boolean) => set({ showChat: show }),
  setShowControls: (show: boolean) => set({ showControls: show }),
  setPlayerName: (name: string) => set({ playerName: name }),
}));
