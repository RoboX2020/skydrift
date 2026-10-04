import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Aircraft } from './Aircraft';
import { Terrain, Ocean, Runway, Skybox } from './Environment';
import { HostPanel } from './HostPanel';
import { PhoneController } from './PhoneController';
function PilotCamera() {
  const { camera } = useThree();
  const position=useRef(new THREE.Vector3()); const look=useRef(new THREE.Vector3());
  useFrame((_,delta)=>{
    const s=useGameStore.getState();const p=s.playerId && s.players.get(s.playerId); if(!p)return;
    const a=p.aircraft; const q=new THREE.Quaternion(a.rotation.x,a.rotation.y,a.rotation.z,a.rotation.w);
    const forward=new THREE.Vector3(0,0,1).applyQuaternion(q);
    position.current.set(a.position.x,a.position.y+3,a.position.z);
    camera.position.lerp(position.current,Math.min(1,delta*18));
    look.current.copy(camera.position).addScaledVector(forward,100);camera.lookAt(look.current);
  });return null;
}
function Scene({pilot}:{pilot:boolean}) {
  const s=useGameStore();
  return <><Skybox timeOfDay={s.timeOfDay}/><Ocean/><Terrain/><Runway/>
    {Array.from(s.players.values()).filter(p=>!pilot || p.id!==s.playerId).map(p=><Aircraft key={p.id} position={[p.aircraft.position.x,p.aircraft.position.y,p.aircraft.position.z]} rotation={[p.aircraft.rotation.x,p.aircraft.rotation.y,p.aircraft.rotation.z,p.aircraft.rotation.w]} color={p.color} name={p.name}/>)}
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
