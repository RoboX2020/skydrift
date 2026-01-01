import { Schema, type, MapSchema } from '@colyseus/schema';

// Vector3 Schema
export class Vector3Schema extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
}

// Quaternion Schema
export class QuaternionSchema extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') w: number = 1;
}

// Aircraft State Schema
export class AircraftSchema extends Schema {
  @type(Vector3Schema) position = new Vector3Schema();
  @type(QuaternionSchema) rotation = new QuaternionSchema();
  @type(Vector3Schema) velocity = new Vector3Schema();
  @type(Vector3Schema) angularVelocity = new Vector3Schema();
  @type('number') throttle: number = 0.5;
  @type('number') speed: number = 0;
  @type('number') altitude: number = 0;
  @type('number') heading: number = 0;
  @type('boolean') isOnGround: boolean = false;
}

// Player Schema
export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type(AircraftSchema) aircraft = new AircraftSchema();
  @type('number') score: number = 0;
  @type('string') color: string = '#FFFFFF';
  @type('number') joinedAt: number = 0;
  @type('number') lastUpdate: number = 0;
  
  // Input state (not synced to other clients for security)
  inputPitch: number = 0;
  inputRoll: number = 0;
  inputYaw: number = 0;
  inputThrottle: number = 0.5;
  inputBrake: boolean = false;
  inputBoost: boolean = false;
}

// Weather Schema
export class WeatherSchema extends Schema {
  @type(Vector3Schema) windDirection = new Vector3Schema();
  @type('number') windSpeed: number = 0;
  @type('number') turbulence: number = 0;
  @type('number') visibility: number = 10000;
  @type('number') cloudCover: number = 0.3;
}

// Main Game Room State
export class GameRoomSchema extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type(WeatherSchema) weather = new WeatherSchema();
  @type('number') timeOfDay: number = 12; // Noon
  @type('number') serverTick: number = 0;
}
