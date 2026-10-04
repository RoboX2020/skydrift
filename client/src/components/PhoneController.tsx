import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
type Axis = 'forward' | 'strafe' | 'vertical' | 'yaw';
function Stick({label,axes,legend}:{label:string;axes:[Axis,Axis];legend:string}) {
  const [point,setPoint]=useState([0,0]);const update=useGameStore(s=>s.updateInput);
  const reset=()=>{setPoint([0,0]);update({[axes[0]]:0,[axes[1]]:0});};
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{
    if(!e.currentTarget.hasPointerCapture(e.pointerId))return;
    const b=e.currentTarget.getBoundingClientRect();const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
    const x=clamp((e.clientX-b.left-b.width/2)/(b.width/2));const y=clamp((e.clientY-b.top-b.height/2)/(b.height/2));
    setPoint([x,y]);update({[axes[0]]:x,[axes[1]]:-y});
  };
  return <div className="rc-stick-wrap"><div className="rc-stick" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={move} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}><div className="rc-stick-knob" style={{transform:`translate(${point[0]*43}px,${point[1]*43}px)`}}/></div><span>{legend}</span></div>;
}
export function PhoneController() {
  const s=useGameStore();const [prompt,setPrompt]=useState(true);const [note,setNote]=useState('');
  useEffect(()=>{
    const reset=()=>s.updateInput({forward:0,strafe:0,vertical:0,yaw:0});
    window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    return()=>{reset();window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);};
  },[s.updateInput]);
  const immersive=async()=>{
    try {
      if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
      else setNote('Rotate your phone to landscape. Fullscreen is not available in this browser.');
      const orientation=screen.orientation as ScreenOrientation & {lock?:(orientation:string)=>Promise<void>};
      if(orientation?.lock)await orientation.lock('landscape');
    }catch{setNote('Rotate your phone to landscape. You can still play without fullscreen.');}
    setPrompt(false);
  };
  const p=s.playerId?s.players.get(s.playerId):undefined;
  return <div className="pilot-overlay">
    <header className="rc-top"><div><span className="eyebrow">SKYDRIFT / RC FLIGHT</span><strong>{s.playerName}</strong></div><div className="rc-top-actions"><span>{s.players.size}/4 pilots</span><button onClick={immersive}>⛶ Fullscreen</button><button onClick={s.disconnect}>Leave</button></div></header>
    <div className="flight-reticle">+</div><div className="rc-telemetry"><span>ALT {Math.round(p?.aircraft.altitude||0)} m</span><span>SPD {Math.round(p?.aircraft.speed||0)} m/s</span></div>
    <div className="rc-controls"><Stick label="Move joystick" axes={['strafe','forward']} legend="LEFT / RIGHT · FORWARD / BACK"/><button className="rc-respawn" onClick={s.respawn}>↻ Reset</button><Stick label="Look and altitude joystick" axes={['yaw','vertical']} legend="TURN · UP / DOWN"/></div>
    <div className="cockpit-edge"/>
    {note && <p className="orientation-note">{note}<button onClick={()=>setNote('')}>×</button></p>}
    {prompt && <div className="immersive-prompt"><section><span className="eyebrow">YOUR PHONE IS THE COCKPIT</span><h2>Turn sideways. <br/>Take the controls.</h2><p>Landscape gives you the full first-person view. Left stick moves; right stick turns and changes altitude.</p><button className="primary" onClick={immersive}>Enter fullscreen & landscape</button><button className="text-button" onClick={()=>setPrompt(false)}>Play in this window</button></section></div>}
    <div className="rotate-hint">↻ Rotate your phone for landscape flight</div>
  </div>;
}
