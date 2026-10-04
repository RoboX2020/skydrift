import { PlayerSchema } from './schemas';
// RC-style assisted flight: direct movement, hover on release, yaw steering.
// These are deliberately arcade controls, not aerodynamic simulation.
const SIZE=600, CEILING=240, SPEED=55;
export function updatePlayerPhysics(player: PlayerSchema, dt: number): void {
  if(!Number.isFinite(dt)||dt<=0||dt>1)return;
  const a=player.aircraft;
  const clamp=(v:number)=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;
  const yaw=(a.heading*Math.PI/180)+clamp(player.inputYaw)*1.5*dt;
  a.heading=(yaw*180/Math.PI+360)%360;
  a.rotation.x=0;a.rotation.y=Math.sin(yaw/2);a.rotation.z=0;a.rotation.w=Math.cos(yaw/2);
  const f=clamp(player.inputForward), r=clamp(player.inputStrafe), u=clamp(player.inputVertical);
  const length=Math.max(1,Math.hypot(f,r,u));
  const target={x:(Math.sin(yaw)*f+Math.cos(yaw)*r)*SPEED/length,y:u*SPEED/length,z:(Math.cos(yaw)*f-Math.sin(yaw)*r)*SPEED/length};
  const blend=1-Math.exp(-12*dt);
  a.velocity.x+=(target.x-a.velocity.x)*blend;a.velocity.y+=(target.y-a.velocity.y)*blend;a.velocity.z+=(target.z-a.velocity.z)*blend;
  a.position.x=Math.max(-SIZE/2,Math.min(SIZE/2,a.position.x+a.velocity.x*dt));
  a.position.z=Math.max(-SIZE/2,Math.min(SIZE/2,a.position.z+a.velocity.z*dt));
  a.position.y=Math.max(8,Math.min(CEILING,a.position.y+a.velocity.y*dt));
  a.speed=Math.hypot(a.velocity.x,a.velocity.y,a.velocity.z);a.altitude=a.position.y;a.isOnGround=false;
}
export function respawnPlayer(player: PlayerSchema): void {
  const a=player.aircraft;const angle=Math.random()*Math.PI*2;
  a.position.x=Math.sin(angle)*55;a.position.z=-100;a.position.y=70;
  a.rotation.x=0;a.rotation.y=0;a.rotation.z=0;a.rotation.w=1;
  a.velocity.x=a.velocity.y=a.velocity.z=0;a.heading=0;a.speed=0;a.altitude=70;
  player.inputForward=player.inputStrafe=player.inputVertical=player.inputYaw=0;
}
