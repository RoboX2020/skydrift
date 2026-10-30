// ============================================================================
// Game.tsx - the 3D world, drawn with react-three-fiber (Three.js for React).
//
// Two ways to look at the same world:
//   pilot (a phone): a camera glued behind (or inside) YOUR plane
//   host  (big screen): an orbit camera you can drag around the whole arena
// Everything visual lives here or in Environment.tsx (ground/sea/sky) and
// Aircraft.tsx (the planes). Plane positions come from gameStore, which the
// server keeps updated (see store/gameStore.ts).
// ============================================================================
import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Aircraft } from './Aircraft';
import { Terrain, Ocean, Runway, Skybox } from './Environment';
import { HostPanel } from './HostPanel';
import { PhoneController } from './PhoneController';
// PilotCamera: the phone pilot's eye. Every drawn frame it places the camera
// relative to YOUR plane - either glued just above the nose (cockpit view) or
// floating behind and above it (chase view).
function PilotCamera() {
  const { camera } = useThree();
  const position=useRef(new THREE.Vector3()); const look=useRef(new THREE.Vector3());
  useFrame((_,delta)=>{
    // Read the store directly (not via hook subscription) so this runs once per
    // DRAWN frame without forcing React re-renders at network rate.
    const s=useGameStore.getState();const p=s.playerId && s.players.get(s.playerId); if(!p)return;
    const a=p.aircraft; const q=new THREE.Quaternion(a.rotation.x,a.rotation.y,a.rotation.z,a.rotation.w);
    // The plane's world-space nose direction: local +Z spun by its orientation.
    const forward=new THREE.Vector3(0,0,1).applyQuaternion(q);
    const chase=s.cameraView==='chase';
    // Cockpit: 3 units above the plane centre. Chase: 16 up and 48 back (-forward).
    position.current.set(a.position.x,a.position.y+(chase?16:3),a.position.z);
    if(chase) position.current.addScaledVector(forward,-48);
    // Glide the camera (rate 18/s, frame-rate independent) instead of snapping -
    // smooths out the plane's own network-driven movement.
    camera.position.lerp(position.current,Math.min(1,delta*18));
    // Always look 100 units ahead of the camera along the flight direction.
    look.current.copy(camera.position).addScaledVector(forward,100);camera.lookAt(look.current);
  });return null;
}
function Scene({pilot}:{pilot:boolean}) {
  const s=useGameStore();
  return <><Skybox timeOfDay={s.timeOfDay}/><Ocean/><Terrain/><Runway/>
    {/* Draw every player's plane - EXCEPT your own when you're a pilot in
        cockpit view (you're sitting inside it, so it would block the camera).
        In chase view your own plane IS drawn (you're looking at it). */}
    {Array.from(s.players.values()).filter(p=>!pilot || p.id!==s.playerId || s.cameraView==='chase').map(p=><Aircraft key={p.id} position={[p.aircraft.position.x,p.aircraft.position.y,p.aircraft.position.z]} rotation={[p.aircraft.rotation.x,p.aircraft.rotation.y,p.aircraft.rotation.z,p.aircraft.rotation.w]} color={p.color} isLocal={p.id===s.playerId} name={p.name}/>)}
    {pilot?<PilotCamera/>:<OrbitControls target={[0,20,0]} maxDistance={900} minDistance={200} maxPolarAngle={Math.PI/2.1}/>}
    <fog attach="fog" args={['#b5d9ea',1100,2400]}/>
  </>;
}
export function Game() {
  const pilot=useGameStore(s=>s.role==='pilot');
  return <div className="game-view"><Canvas dpr={[1,1.5]} gl={{antialias:true,alpha:false}} camera={{fov:pilot?80:65,near:.3,far:3500,position:pilot?[0,103,0]:[410,360,-410]}}>
    <Suspense fallback={null}><Scene pilot={pilot}/></Suspense>
  </Canvas>{pilot?<PhoneController/>:<HostPanel/>}</div>;
}
