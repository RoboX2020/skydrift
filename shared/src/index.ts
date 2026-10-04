// ============================================
// SkyDrift - Shared Types & Constants
// ============================================

// Physics constants
export const PHYSICS = {
  GRAVITY: 9.81,
  AIR_DENSITY: 1.225, // kg/m³ at sea level
  
  // Aircraft properties (simplified Cessna-like)
  AIRCRAFT: {
    MASS: 1000, // kg
    WING_AREA: 16, // m²
    THRUST_MAX: 15000, // N
    DRAG_COEFFICIENT: 0.027,
    LIFT_COEFFICIENT_BASE: 0.4,
    LIFT_COEFFICIENT_MAX: 1.5,
    
    // Control sensitivity
    PITCH_RATE: 1.2, // rad/s
    ROLL_RATE: 2.0,
    YAW_RATE: 0.8,
  },
  
  // World bounds
  WORLD: {
    SIZE: 600, // meters
    MAX_ALTITUDE: 240,
    GROUND_LEVEL: 0,
  },
  
  TICK_RATE: 60, // Hz
  NETWORK_TICK_RATE: 20, // Hz (state sync)
} as const;

// Vector3 for positions and velocities
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Quaternion for rotations
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Player input state
export interface PlayerInput {
  pitch: number;    // -1 to 1 (nose down to up)
  roll: number;     // -1 to 1 (left to right)
  yaw: number;      // -1 to 1 (left to right)
  throttle: number; // 0 to 1
  brake: boolean;
  boost: boolean;
}

// Aircraft state synced across network
export interface AircraftState {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  angularVelocity: Vector3;
  throttle: number;
  speed: number;      // m/s
  altitude: number;   // m
  heading: number;    // degrees
  isOnGround: boolean;
}

// Player in the game room
export interface Player {
  id: string;
  name: string;
  aircraft: AircraftState;
  input: PlayerInput;
  score: number;
  color: string;
  joinedAt: number;
  lastUpdate: number;
}

// Room state
export interface GameRoomState {
  players: Map<string, Player>;
  weather: WeatherState;
  timeOfDay: number; // 0-24 hours
  serverTick: number;
}

// Weather conditions
export interface WeatherState {
  windDirection: Vector3;
  windSpeed: number;
  turbulence: number; // 0-1
  visibility: number; // meters
  cloudCover: number; // 0-1
}

// Message types for client-server communication
export enum MessageType {
  // Client -> Server
  PLAYER_INPUT = 'player_input',
  PLAYER_SPAWN = 'player_spawn',
  PLAYER_RESPAWN = 'player_respawn',
  CHAT_MESSAGE = 'chat_message',
  
  // Server -> Client
  GAME_STATE = 'game_state',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  PLAYER_CRASHED = 'player_crashed',
}

// Spawn points
export const SPAWN_POINTS: Vector3[] = [
  { x: 0, y: 100, z: 0 },
  { x: 90, y: 100, z: 90 },
  { x: -90, y: 100, z: 90 },
  { x: 90, y: 100, z: -90 },
  { x: -90, y: 100, z: -90 },
];

// Color palette for players
export const PLAYER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

// Utility functions
export function createDefaultAircraftState(): AircraftState {
  const spawn = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
  return {
    position: { ...spawn },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    velocity: { x: 0, y: 0, z: 50 }, // Start with forward velocity
    angularVelocity: { x: 0, y: 0, z: 0 },
    throttle: 0.5,
    speed: 50,
    altitude: spawn.y,
    heading: 0,
    isOnGround: false,
  };
}

export function createDefaultInput(): PlayerInput {
  return {
    pitch: 0,
    roll: 0,
    yaw: 0,
    throttle: 0.5,
    brake: false,
    boost: false,
  };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

export function vector3Length(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function normalizeVector3(v: Vector3): Vector3 {
  const len = vector3Length(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}
