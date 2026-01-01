import { PlayerSchema, Vector3Schema, QuaternionSchema } from './schemas';

// Physics constants
const GRAVITY = 9.81;
const AIR_DENSITY = 1.225;

const AIRCRAFT = {
  MASS: 1000,
  WING_AREA: 16,
  THRUST_MAX: 15000,
  DRAG_COEFFICIENT: 0.027,
  LIFT_COEFFICIENT_BASE: 0.4,
  LIFT_COEFFICIENT_MAX: 1.5,
  PITCH_RATE: 1.2,
  ROLL_RATE: 2.0,
  YAW_RATE: 0.8,
};

const WORLD = {
  SIZE: 10000,
  MAX_ALTITUDE: 5000,
  GROUND_LEVEL: 0,
};

// Helper functions for validation
// Helper to check if a value is valid (not NaN or Infinity)
function isValidNumber(value: number): boolean {
  return !isNaN(value) && isFinite(value);
}

// Helper to clamp a value to valid range
function clampValue(value: number, min: number, max: number): number {
  if (!isValidNumber(value)) return 0;
  return Math.max(min, Math.min(max, value));
}

// Helper to validate and fix quaternion
function validateQuaternion(q: QuaternionSchema): void {
  if (!isValidNumber(q.x) || !isValidNumber(q.y) || !isValidNumber(q.z) || !isValidNumber(q.w)) {
    q.x = 0;
    q.y = 0;
    q.z = 0;
    q.w = 1;
  }
  // Normalize to ensure it's a valid quaternion
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
  if (len < 0.0001) {
    q.x = 0;
    q.y = 0;
    q.z = 0;
    q.w = 1;
  } else {
    q.x /= len;
    q.y /= len;
    q.z /= len;
    q.w /= len;
  }
}

// Helper to validate and fix vector
function validateVector(v: Vector3Schema): void {
  if (!isValidNumber(v.x)) v.x = 0;
  if (!isValidNumber(v.y)) v.y = 0;
  if (!isValidNumber(v.z)) v.z = 0;
}

// Quaternion helpers
function quaternionFromEuler(pitch: number, yaw: number, roll: number): { x: number; y: number; z: number; w: number } {
  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);
  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);
  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);

  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  };
}

// Create quaternion for rotation around a single axis
function quaternionFromAxisAngle(axis: { x: number; y: number; z: number }, angle: number): { x: number; y: number; z: number; w: number } {
  // Validate inputs
  if (!isValidNumber(angle)) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  
  // Normalize axis
  const axisLen = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
  if (axisLen < 0.0001) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  
  const normalizedAxis = {
    x: axis.x / axisLen,
    y: axis.y / axisLen,
    z: axis.z / axisLen,
  };
  
  const halfAngle = angle * 0.5;
  const s = Math.sin(halfAngle);
  const c = Math.cos(halfAngle);
  
  return {
    x: normalizedAxis.x * s,
    y: normalizedAxis.y * s,
    z: normalizedAxis.z * s,
    w: c,
  };
}

function quaternionToEuler(q: QuaternionSchema): { pitch: number; yaw: number; roll: number } {
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
  const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation)
  const sinp = 2 * (q.w * q.y - q.z * q.x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2;
  } else {
    pitch = Math.asin(sinp);
  }

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { pitch, yaw, roll };
}

function multiplyQuaternions(
  a: { x: number; y: number; z: number; w: number },
  b: { x: number; y: number; z: number; w: number }
): { x: number; y: number; z: number; w: number } {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

function normalizeQuaternion(q: { x: number; y: number; z: number; w: number }): { x: number; y: number; z: number; w: number } {
  // Validate inputs
  if (!isValidNumber(q.x) || !isValidNumber(q.y) || !isValidNumber(q.z) || !isValidNumber(q.w)) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
  if (len < 0.0001 || !isValidNumber(len)) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  
  const normalized = { 
    x: q.x / len, 
    y: q.y / len, 
    z: q.z / len, 
    w: q.w / len 
  };
  
  // Final validation
  if (!isValidNumber(normalized.x) || !isValidNumber(normalized.y) || 
      !isValidNumber(normalized.z) || !isValidNumber(normalized.w)) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }
  
  return normalized;
}

function rotateVectorByQuaternion(v: Vector3Schema, q: QuaternionSchema): { x: number; y: number; z: number } {
  const qv = { x: q.x, y: q.y, z: q.z };
  const uv = {
    x: qv.y * v.z - qv.z * v.y,
    y: qv.z * v.x - qv.x * v.z,
    z: qv.x * v.y - qv.y * v.x,
  };
  const uuv = {
    x: qv.y * uv.z - qv.z * uv.y,
    y: qv.z * uv.x - qv.x * uv.z,
    z: qv.x * uv.y - qv.y * uv.x,
  };
  
  return {
    x: v.x + 2 * (q.w * uv.x + uuv.x),
    y: v.y + 2 * (q.w * uv.y + uuv.y),
    z: v.z + 2 * (q.w * uv.z + uuv.z),
  };
}

export function updatePlayerPhysics(player: PlayerSchema, deltaTime: number): void {
  // Validate deltaTime
  if (!isValidNumber(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
    return; // Skip this frame if deltaTime is invalid
  }
  
  const aircraft = player.aircraft;
  
  // Validate and fix all initial values
  validateVector(aircraft.position);
  validateVector(aircraft.velocity);
  validateQuaternion(aircraft.rotation);
  
  // Clamp input values
  player.inputPitch = clampValue(player.inputPitch, -1, 1);
  player.inputRoll = clampValue(player.inputRoll, -1, 1);
  player.inputYaw = clampValue(player.inputYaw, -1, 1);
  player.inputThrottle = clampValue(player.inputThrottle, 0, 1);
  
  // Get forward direction from rotation
  const forward = rotateVectorByQuaternion(
    { x: 0, y: 0, z: 1 } as Vector3Schema,
    aircraft.rotation
  );
  
  const up = rotateVectorByQuaternion(
    { x: 0, y: 1, z: 0 } as Vector3Schema,
    aircraft.rotation
  );
  
  // Validate rotated vectors
  validateVector(forward as Vector3Schema);
  validateVector(up as Vector3Schema);
  
  // Calculate speed
  const speed = Math.sqrt(
    aircraft.velocity.x ** 2 +
    aircraft.velocity.y ** 2 +
    aircraft.velocity.z ** 2
  );
  
  // Thrust
  const thrustMagnitude = player.inputThrottle * AIRCRAFT.THRUST_MAX;
  const boostMultiplier = player.inputBoost ? 1.5 : 1.0;
  const thrust = {
    x: forward.x * thrustMagnitude * boostMultiplier,
    y: forward.y * thrustMagnitude * boostMultiplier,
    z: forward.z * thrustMagnitude * boostMultiplier,
  };
  
  // Drag (proportional to velocity squared)
  const dragMagnitude = 0.5 * AIR_DENSITY * speed * speed * AIRCRAFT.DRAG_COEFFICIENT * AIRCRAFT.WING_AREA;
  const drag = speed > 0.1 ? {
    x: -aircraft.velocity.x / speed * dragMagnitude,
    y: -aircraft.velocity.y / speed * dragMagnitude,
    z: -aircraft.velocity.z / speed * dragMagnitude,
  } : { x: 0, y: 0, z: 0 };
  
  // Lift (perpendicular to velocity, in the up direction of the aircraft)
  const euler = quaternionToEuler(aircraft.rotation);
  const angleOfAttack = euler.pitch;
  const liftCoefficient = Math.min(
    AIRCRAFT.LIFT_COEFFICIENT_BASE + angleOfAttack * 2,
    AIRCRAFT.LIFT_COEFFICIENT_MAX
  );
  const liftMagnitude = 0.5 * AIR_DENSITY * speed * speed * liftCoefficient * AIRCRAFT.WING_AREA;
  const lift = {
    x: up.x * liftMagnitude,
    y: up.y * liftMagnitude,
    z: up.z * liftMagnitude,
  };
  
  // Gravity
  const gravity = { x: 0, y: -GRAVITY * AIRCRAFT.MASS, z: 0 };
  
  // Total force
  const totalForce = {
    x: thrust.x + drag.x + lift.x + gravity.x,
    y: thrust.y + drag.y + lift.y + gravity.y,
    z: thrust.z + drag.z + lift.z + gravity.z,
  };
  
  // Acceleration (F = ma)
  const acceleration = {
    x: totalForce.x / AIRCRAFT.MASS,
    y: totalForce.y / AIRCRAFT.MASS,
    z: totalForce.z / AIRCRAFT.MASS,
  };
  
  // Update velocity
  aircraft.velocity.x += acceleration.x * deltaTime;
  aircraft.velocity.y += acceleration.y * deltaTime;
  aircraft.velocity.z += acceleration.z * deltaTime;
  
  // Validate velocity after update
  validateVector(aircraft.velocity);
  
  // Apply brake
  if (player.inputBrake) {
    const brakeForce = 0.95;
    aircraft.velocity.x *= brakeForce;
    aircraft.velocity.y *= brakeForce;
    aircraft.velocity.z *= brakeForce;
  }
  
  // Update position
  aircraft.position.x += aircraft.velocity.x * deltaTime;
  aircraft.position.y += aircraft.velocity.y * deltaTime;
  aircraft.position.z += aircraft.velocity.z * deltaTime;
  
  // Validate position after update
  validateVector(aircraft.position);
  
  // Apply rotation from input (in local space)
  // For aircraft controls in local space:
  // - Pitch (nose up/down) = rotation around local X-axis
  // - Yaw (turn left/right) = rotation around local Y-axis  
  // - Roll (bank left/right) = rotation around local Z-axis
  const pitchDelta = player.inputPitch * AIRCRAFT.PITCH_RATE * deltaTime;
  const rollDelta = player.inputRoll * AIRCRAFT.ROLL_RATE * deltaTime;
  const yawDelta = player.inputYaw * AIRCRAFT.YAW_RATE * deltaTime;
  
  // Get current rotation
  const currentQuat = { 
    x: aircraft.rotation.x, 
    y: aircraft.rotation.y, 
    z: aircraft.rotation.z, 
    w: aircraft.rotation.w 
  };
  
  // Create rotation quaternions around standard axes (these are local rotations)
  // Pitch: rotation around X-axis
  const pitchQuat = quaternionFromAxisAngle({ x: 1, y: 0, z: 0 }, pitchDelta);
  // Yaw: rotation around Y-axis
  const yawQuat = quaternionFromAxisAngle({ x: 0, y: 1, z: 0 }, yawDelta);
  // Roll: rotation around Z-axis
  const rollQuat = quaternionFromAxisAngle({ x: 0, y: 0, z: 1 }, rollDelta);
  
  // Combine local rotations: roll -> pitch -> yaw (typical aircraft control order)
  const localDelta = normalizeQuaternion(
    multiplyQuaternions(
      multiplyQuaternions(rollQuat, pitchQuat),
      yawQuat
    )
  );
  
  // Apply local rotation to current rotation
  // For local space rotation: newRotation = currentRotation * localDelta
  const newRotation = normalizeQuaternion(
    multiplyQuaternions(currentQuat, localDelta)
  );
  
  // Validate new rotation before applying
  if (isValidNumber(newRotation.x) && isValidNumber(newRotation.y) && 
      isValidNumber(newRotation.z) && isValidNumber(newRotation.w)) {
    aircraft.rotation.x = newRotation.x;
    aircraft.rotation.y = newRotation.y;
    aircraft.rotation.z = newRotation.z;
    aircraft.rotation.w = newRotation.w;
  } else {
    // If rotation is invalid, reset to identity
    aircraft.rotation.x = 0;
    aircraft.rotation.y = 0;
    aircraft.rotation.z = 0;
    aircraft.rotation.w = 1;
  }
  
  // Final validation
  validateQuaternion(aircraft.rotation);
  
  // Ground collision
  if (aircraft.position.y < WORLD.GROUND_LEVEL) {
    aircraft.position.y = WORLD.GROUND_LEVEL;
    aircraft.velocity.y = 0;
    aircraft.isOnGround = true;
    
    // Crash if too fast
    if (speed > 30) {
      // Reset position (respawn)
      respawnPlayer(player);
    }
  } else {
    aircraft.isOnGround = false;
  }
  
  // World bounds wrap-around
  if (aircraft.position.x > WORLD.SIZE / 2) aircraft.position.x = -WORLD.SIZE / 2;
  if (aircraft.position.x < -WORLD.SIZE / 2) aircraft.position.x = WORLD.SIZE / 2;
  if (aircraft.position.z > WORLD.SIZE / 2) aircraft.position.z = -WORLD.SIZE / 2;
  if (aircraft.position.z < -WORLD.SIZE / 2) aircraft.position.z = WORLD.SIZE / 2;
  
  // Altitude ceiling
  if (aircraft.position.y > WORLD.MAX_ALTITUDE) {
    aircraft.position.y = WORLD.MAX_ALTITUDE;
    aircraft.velocity.y = Math.min(aircraft.velocity.y, 0);
  }
  
  // Update derived values with validation
  aircraft.speed = isValidNumber(speed) ? speed : 0;
  aircraft.altitude = isValidNumber(aircraft.position.y) ? aircraft.position.y : 0;
  aircraft.throttle = clampValue(player.inputThrottle, 0, 1);
  
  // Calculate heading (yaw in degrees)
  const headingRad = Math.atan2(forward.x, forward.z);
  if (isValidNumber(headingRad)) {
    aircraft.heading = ((headingRad * 180 / Math.PI) + 360) % 360;
  } else {
    aircraft.heading = 0;
  }
}

export function respawnPlayer(player: PlayerSchema): void {
  const spawnPoints = [
    { x: 0, y: 500, z: 0 },
    { x: 500, y: 500, z: 500 },
    { x: -500, y: 500, z: 500 },
    { x: 500, y: 500, z: -500 },
    { x: -500, y: 500, z: -500 },
  ];
  
  const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
  
  player.aircraft.position.x = spawn.x;
  player.aircraft.position.y = spawn.y;
  player.aircraft.position.z = spawn.z;
  
  player.aircraft.rotation.x = 0;
  player.aircraft.rotation.y = 0;
  player.aircraft.rotation.z = 0;
  player.aircraft.rotation.w = 1;
  
  player.aircraft.velocity.x = 0;
  player.aircraft.velocity.y = 0;
  player.aircraft.velocity.z = 50; // Initial forward velocity
  
  player.aircraft.angularVelocity.x = 0;
  player.aircraft.angularVelocity.y = 0;
  player.aircraft.angularVelocity.z = 0;
  
  player.inputThrottle = 0.5;
  player.aircraft.isOnGround = false;
}
