import { Room, Client } from '@colyseus/core';
import { GameRoomSchema, PlayerSchema } from './schemas';
import { updatePlayerPhysics, respawnPlayer } from './physics';

const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

const TICK_RATE = 60; // Physics updates per second
const NETWORK_RATE = 20; // State syncs per second

interface PlayerInputMessage {
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
  brake: boolean;
  boost: boolean;
}

interface JoinOptions {
  name?: string;
}

export class SkyDriftRoom extends Room<GameRoomSchema> {
  private tickInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = 0;
  private colorIndex: number = 0;

  onCreate(options: any) {
    console.log('SkyDrift room created!', options);
    
    this.setState(new GameRoomSchema());
    this.maxClients = 16;
    
    // Initialize weather
    this.state.weather.windSpeed = 5;
    this.state.weather.windDirection.x = 1;
    this.state.weather.windDirection.z = 0;
    this.state.weather.turbulence = 0.1;
    this.state.weather.visibility = 10000;
    this.state.weather.cloudCover = 0.3;
    
    // Handle player input
    this.onMessage('input', (client: Client, message: PlayerInputMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      // Clamp and apply input
      player.inputPitch = Math.max(-1, Math.min(1, message.pitch || 0));
      player.inputRoll = Math.max(-1, Math.min(1, message.roll || 0));
      player.inputYaw = Math.max(-1, Math.min(1, message.yaw || 0));
      player.inputThrottle = Math.max(0, Math.min(1, message.throttle ?? 0.5));
      player.inputBrake = !!message.brake;
      player.inputBoost = !!message.boost;
      player.lastUpdate = Date.now();
    });
    
    // Handle respawn request
    this.onMessage('respawn', (client: Client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        respawnPlayer(player);
      }
    });
    
    // Handle chat
    this.onMessage('chat', (client: Client, message: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      this.broadcast('chat', {
        playerId: client.sessionId,
        playerName: player.name,
        text: message.text?.substring(0, 200) || '',
        timestamp: Date.now(),
      });
    });
    
    // Start physics loop with more accurate timing
    this.lastTickTime = Date.now();
    const targetInterval = 1000 / TICK_RATE;
    
    // Use setInterval but with error correction
    this.tickInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - this.lastTickTime;
      
      // If we're running behind, catch up (but limit to prevent spiral of death)
      if (elapsed > targetInterval * 2) {
        this.lastTickTime = now - targetInterval;
      }
      
      this.tick();
    }, targetInterval);
    
    console.log('Game loop started at', TICK_RATE, 'Hz');
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`Player ${client.sessionId} joined!`);
    
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.name || `Pilot_${client.sessionId.substring(0, 4)}`;
    player.color = PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length];
    player.joinedAt = Date.now();
    player.lastUpdate = Date.now();
    
    this.colorIndex++;
    
    // Initialize aircraft
    respawnPlayer(player);
    
    this.state.players.set(client.sessionId, player);
    
    // Notify others
    this.broadcast('playerJoined', {
      id: client.sessionId,
      name: player.name,
      color: player.color,
    }, { except: client });
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left (consented: ${consented})`);
    
    const player = this.state.players.get(client.sessionId);
    if (player) {
      // Notify others
      this.broadcast('playerLeft', {
        id: client.sessionId,
        name: player.name,
      });
      
      this.state.players.delete(client.sessionId);
    }
  }

  onDispose() {
    console.log('Room disposed');
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }

  private tick() {
    const now = Date.now();
    let deltaTime = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;
    
    // Clamp deltaTime to prevent large jumps (e.g., if server was paused)
    // Max 100ms (0.1s) per frame to prevent physics explosions
    if (deltaTime > 0.1) {
      deltaTime = 0.1;
    }
    // Skip if deltaTime is too small (prevents division issues)
    if (deltaTime < 0.001) {
      return;
    }
    
    // Update physics for all players
    this.state.players.forEach((player) => {
      updatePlayerPhysics(player, deltaTime);
    });
    
    // Increment server tick
    this.state.serverTick++;
    
    // Slowly change time of day (1 minute real time = 1 hour in game)
    this.state.timeOfDay = (this.state.timeOfDay + deltaTime / 60) % 24;
  }
}
