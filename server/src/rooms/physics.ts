// ============================================================================
// physics.ts - how a plane moves, one small step at a time.
//
// This is deliberately arcade-style "RC plane" movement, NOT a real flight
// simulator: the joystick says a direction, the plane eases toward moving
// that way, and letting go makes it hover in place. Simple, forgiving, fun.
//
// updatePlayerPhysics() is called 60 times per second per plane by
// SkyDriftRoom.tick(). dt = how many seconds passed since the last step.
// ============================================================================
import { PlayerSchema } from './schemas';
// RC-style assisted flight: direct movement, hover on release, yaw steering.
// These are deliberately arcade controls, not aerodynamic simulation.
const SIZE=600, CEILING=240, SPEED=55;
export function updatePlayerPhysics(player: PlayerSchema, dt: number): void {
  // Guard against nonsense time steps (a paused server could pass a huge dt).
  if(!Number.isFinite(dt)||dt<=0||dt>1)return;
  const a=player.aircraft;
  const clamp=(v:number)=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;
  // Steering: the yaw joystick turns the plane's heading (compass degrees).
  const yaw=(a.heading*Math.PI/180)+clamp(player.inputYaw)*1.5*dt;
  a.heading=(yaw*180/Math.PI+360)%360;
  // Store the facing as a quaternion (the rotation format 3D graphics use).
  a.rotation.x=0;a.rotation.y=Math.sin(yaw/2);a.rotation.z=0;a.rotation.w=Math.cos(yaw/2);
  const f=clamp(player.inputForward), r=clamp(player.inputStrafe), u=clamp(player.inputVertical);
  // Normalize so diagonal movement is not faster than straight movement.
  const length=Math.max(1,Math.hypot(f,r,u));
  // The velocity the joystick is asking for, in world coordinates
  // (forward/strafe are relative to where the nose points).
  const target={x:(Math.sin(yaw)*f+Math.cos(yaw)*r)*SPEED/length,y:u*SPEED/length,z:(Math.cos(yaw)*f-Math.sin(yaw)*r)*SPEED/length};
  // Ease the actual velocity toward the target - this exponential blend is
  // what makes the plane feel smooth and weighty instead of teleporting.
  const blend=1-Math.exp(-12*dt);
  a.velocity.x+=(target.x-a.velocity.x)*blend;a.velocity.y+=(target.y-a.velocity.y)*blend;a.velocity.z+=(target.z-a.velocity.z)*blend;
  // Move, but never outside the arena walls, the floor, or the ceiling.
  a.position.x=Math.max(-SIZE/2,Math.min(SIZE/2,a.position.x+a.velocity.x*dt));
  a.position.z=Math.max(-SIZE/2,Math.min(SIZE/2,a.position.z+a.velocity.z*dt));
  a.position.y=Math.max(8,Math.min(CEILING,a.position.y+a.velocity.y*dt));
  // Publish the derived numbers the screens show (speed, altitude).
  a.speed=Math.hypot(a.velocity.x,a.velocity.y,a.velocity.z);a.altitude=a.position.y;a.isOnGround=false;
}
// Put a plane back at the start: a random spot along the runway line,
// stopped, facing forward, joystick zeroed.
export function respawnPlayer(player: PlayerSchema): void {
  const a=player.aircraft;const angle=Math.random()*Math.PI*2;
  a.position.x=Math.sin(angle)*55;a.position.z=-100;a.position.y=70;
  a.rotation.x=0;a.rotation.y=0;a.rotation.z=0;a.rotation.w=1;
  a.velocity.x=a.velocity.y=a.velocity.z=0;a.heading=0;a.speed=0;a.altitude=70;
  player.inputForward=player.inputStrafe=player.inputVertical=player.inputYaw=0;
}
