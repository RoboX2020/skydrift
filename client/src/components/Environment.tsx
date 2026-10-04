import { Sky } from '@react-three/drei';
export function Terrain() {
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1,0]} receiveShadow><circleGeometry args={[315,64]}/><meshStandardMaterial color="#daca8d"/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow><circleGeometry args={[290,64]}/><meshStandardMaterial color="#73a950" roughness={1}/></mesh>
    {Array.from({length:28},(_,i)=>{ const a=i*2.39996; const r=130+(i%5)*28;return <group key={i} position={[Math.cos(a)*r,0,Math.sin(a)*r]}>
      <mesh position={[0,5,0]}><cylinderGeometry args={[1,1.5,10,6]}/><meshStandardMaterial color="#735b3c"/></mesh>
      <mesh position={[0,14,0]}><coneGeometry args={[7,20,8]}/><meshStandardMaterial color={i%2?'#3d844d':'#347345'}/></mesh>
    </group>;})}
    {[[-150,-5,170],[160,-5,150],[-200,-5,-80]].map((p,i)=><mesh key={i} position={p as [number,number,number]} scale={[1.9,.8,1.5]}><sphereGeometry args={[48,16,12]}/><meshStandardMaterial color="#69a452" roughness={1}/></mesh>)}
  </group>;
}
export function Ocean() { return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2,0]}><planeGeometry args={[5000,5000]}/><meshStandardMaterial color="#38a6bc" roughness={.28} metalness={.2}/></mesh>; }
export function Runway() { return <group>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,.2,0]}><planeGeometry args={[20,160]}/><meshStandardMaterial color="#566165"/></mesh>
  {Array.from({length:6},(_,i)=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[0,.3,-65+i*25]}><planeGeometry args={[1,12]}/><meshBasicMaterial color="#fff4d8"/></mesh>)}
</group>; }
export function Skybox({timeOfDay: _}: {timeOfDay:number}) { return <>
  <Sky sunPosition={[500,400,-300]} turbidity={3} rayleigh={1.5}/><ambientLight intensity={1.2}/><directionalLight position={[200,400,-200]} intensity={2} color="#fff6d9"/><hemisphereLight args={['#d8efff','#7eaa5b',1]}/>
  {[-1,0,1].map((v)=><group key={v} position={[v*220,220,120]}>{[-1,0,1].map((j)=><mesh key={j} position={[j*22,Math.abs(j)*-4,0]} scale={[1.6,.65,1]}><sphereGeometry args={[22,12,8]}/><meshStandardMaterial color="#ffffff"/></mesh>)}</group>)}
</>; }
