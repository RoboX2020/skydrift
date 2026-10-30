// ============================================================================
// SkyDriftRoom - the game server. One of these "rooms" hosts one game:
// up to 4 phones flying planes plus 1 big screen (the "host") watching.
//
// Built on Colyseus, a multiplayer framework: players connect over
// WebSockets, the server keeps the single source of truth for the world,
// and every client automatically receives state updates 20 times a second.
//
// WHAT THIS FILE DOES:
//   - runs the world clock: tick() advances every plane's physics 60x/sec
//   - listens for messages from phones: "input" (joystick moves),
//     "respawn" (reset my plane), "chat"
//   - manages who is in the game (join/leave) and what color plane they get
//
// THE MOVING PARTS:
//   SkyDriftRoom (this file) = the referee and game clock
//   physics.ts               = how a plane actually moves
//   schemas.ts               = the shape of the shared game state
//   ../index.ts              = starts the web server and opens rooms
// ============================================================================
import { Room, Client } from '@colyseus/core';
import { GameRoomSchema, PlayerSchema } from './schemas';
import { updatePlayerPhysics, respawnPlayer } from './physics';

// Each pilot gets one of these plane colors, in order.
const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

const TICK_RATE = 60; // Physics updates per second
const NETWORK_RATE = 20; // State syncs per second

// The joystick values a phone sends: each axis is -1 to 1 (or 0 to 1 for
// throttle), plus two on/off buttons.
interface PlayerInputMessage {
  forward: number;
  strafe: number;
  vertical: number;
  pitch: number;
  roll: number;
  yaw: number;
  throttle: number;
  brake: boolean;
  boost: boolean;
}

// What a client tells us when connecting: a display name, and whether it
// wants to be the big screen ("host") or a pilot.
interface JoinOptions {
  name?: string;
  role?: string;
}

export class SkyDriftRoom extends Room<GameRoomSchema> {
  private tickInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = 0;
  private colorIndex: number = 0;

  // Runs once when the room is created: set up the empty world, start
  // listening for phone messages, and start the game clock.
  onCreate(options: any) {
    console.log('SkyDrift room created!', options);
    
    this.setState(new GameRoomSchema());
    this.maxClients = 5; // One display and four pilots
    this.setPatchRate(1000 / NETWORK_RATE);
    
    // Initialize weather
    this.state.weather.windSpeed = 5;
    this.state.weather.windDirection.x = 1;
    this.state.weather.windDirection.z = 0;
    this.state.weather.turbulence = 0.1;
    this.state.weather.visibility = 10000;
    this.state.weather.cloudCover = 0.3;
    
    // Handle player input
    // A phone sends its joystick positions ~20x/sec. We sanity-check every
    // value (a broken client could send garbage) and clamp each axis to its
    // allowed range, so bad input can never make a plane fly weird.
    this.onMessage('input', (client: Client, message: PlayerInputMessage) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !message || typeof message !== 'object') return;
      
      const axis=(v: number)=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;
      player.inputForward=axis(message.forward);
      player.inputStrafe=axis(message.strafe);
      player.inputVertical=axis(message.vertical);
      // Clamp and apply input
      player.inputPitch = Math.max(-1, Math.min(1, Number.isFinite(message.pitch) ? message.pitch : 0));
      player.inputRoll = Math.max(-1, Math.min(1, Number.isFinite(message.roll) ? message.roll : 0));
      player.inputYaw = Math.max(-1, Math.min(1, Number.isFinite(message.yaw) ? message.yaw : 0));
      player.inputThrottle = Math.max(0, Math.min(1, Number.isFinite(message.throttle) ? message.throttle : 0.5));
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
    // Relay one player's chat text to everyone. Capped at 200 characters so
    // nobody can flood the screens.
    this.onMessage('chat', (client: Client, message: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !message || typeof message !== 'object') return;
      
      this.broadcast('chat', {
        playerId: client.sessionId,
        playerName: player.name,
        text: typeof message.text === 'string' ? message.text.substring(0, 200) : '',
        timestamp: Date.now(),
      });
    });
    
    // Start physics loop with more accurate timing
    this.lastTickTime = Date.now();
    const targetInterval = 1000 / TICK_RATE;
    
    // Use setInterval but with error correction
    // setInterval can drift or lag if the server gets busy; when a tick runs
    // late we skip the missed time instead of trying to replay it all at
    // once (which would make planes jump).
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

  // Decides whether a new connection may join: the big screen is allowed
  // only if nobody is connected yet, and pilots only while fewer than 4
  // planes are taken.
  onAuth(_client: Client, options: JoinOptions) {
    if (options.role === 'host') return this.clients.length === 0;
    return this.state.players.size < 4;
  }

  // A client got in. The big screen just watches (no plane). A pilot gets a
  // fresh plane, a display name (or a default like "Pilot_a1b2"), and the
  // next color; everyone else is told a new pilot arrived.
  onJoin(client: Client, options: JoinOptions) {
    console.log(`Player ${client.sessionId} joined!`);
    
    if (options.role === 'host') return; // Display observes without spawning a plane
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = (typeof options.name === 'string' ? options.name.trim().slice(0, 20) : '') || `Pilot_${client.sessionId.substring(0, 4)}`;
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

  // A client disconnected: remove their plane and tell the others.
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

  // The room is shutting down (everyone left): stop the game clock.
  onDispose() {
    console.log('Room disposed');
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }

  // The heartbeat, 60 times per second: move every plane one step forward,
  // and gently advance the in-game clock (1 real minute = 1 game hour).
  // If a phone has gone quiet for half a second, zero its joystick first so
  // its plane stops responding to stale input instead of drifting forever.
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
      if (now - player.lastUpdate > 500) {
        player.inputForward = player.inputStrafe = player.inputVertical = 0;
        player.inputPitch = player.inputRoll = player.inputYaw = 0;
        player.inputBoost = player.inputBrake = false;
      }
      updatePlayerPhysics(player, deltaTime);
    });
    
    // Increment server tick
    this.state.serverTick++;
    
    // Slowly change time of day (1 minute real time = 1 hour in game)
    this.state.timeOfDay = (this.state.timeOfDay + deltaTime / 60) % 24;
  }
}
