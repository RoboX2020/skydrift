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
    // The aircraft faces +Z, so camera-right is -X. Reverse horizontal yaw/strafe.
    setPoint([x,y]);update({[axes[0]]:-x,[axes[1]]:-y});
  };
  return <div className="rc-stick-wrap"><div className="rc-stick" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={move} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}><div className="rc-stick-knob" style={{transform:`translate(${point[0]*43}px,${point[1]*43}px)`}}/></div><span>{legend}</span></div>;
}
export function PhoneController() {
  const s=useGameStore();const [prompt,setPrompt]=useState(true);const [note,setNote]=useState('');
  const [fullscreen,setFullscreen]=useState(!!document.fullscreenElement);
  useEffect(()=>{const change=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change);},[]);
  useEffect(()=>{
    const reset=()=>s.updateInput({forward:0,strafe:0,vertical:0,yaw:0});
    window.addEventListener('blur',reset);document.addEventListener('visibilitychange',reset);
    return()=>{reset();window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);};
  },[s.updateInput]);
  const immersive=async()=>{
    const messages:string[]=[];
    const root=document.documentElement as HTMLElement & {webkitRequestFullscreen?:()=>Promise<void>|void};
    const request=root.requestFullscreen || root.webkitRequestFullscreen;
    // Call from the tap, before awaiting anything: fullscreen needs user activation.
    try {
      if(!document.fullscreenElement && request) await request.call(root);
      else if(!request && !window.matchMedia('(display-mode: standalone)').matches)
        messages.push('Fullscreen is not available here. On iPhone: Safari Share > Add to Home Screen, then open SkyDrift from that icon.');
    } catch { messages.push('The browser refused fullscreen. Try the Fullscreen button again, or open from your Home Screen.'); }
    // Orientation must be attempted separately, even when fullscreen fails.
    const orientation=screen.orientation as ScreenOrientation & {lock?:(orientation:string)=>Promise<void>};
    try {
      if(orientation?.lock) await orientation.lock('landscape');
      else if(window.innerHeight>window.innerWidth) messages.push('Turn your phone sideways. If it stays upright, turn off Portrait Orientation Lock.');
    } catch { if(window.innerHeight>window.innerWidth) messages.push('This browser cannot rotate automatically. Turn your phone sideways and turn off Portrait Orientation Lock.'); }
    setNote(messages.join(' '));setPrompt(false);
  };
  const toggleFullscreen=async()=>{
    if(document.fullscreenElement){try{await document.exitFullscreen();screen.orientation?.unlock?.();}catch{setNote('Use your browser fullscreen exit control.');}}
    else await immersive();
  };
  const p=s.playerId?s.players.get(s.playerId):undefined;
  return <div className="pilot-overlay">
    <header className="rc-top"><div><span className="eyebrow">SKYDRIFT / RC FLIGHT</span><strong>{s.playerName}</strong></div><div className="rc-top-actions"><span>{s.players.size}/4 pilots</span><button onClick={()=>s.setCameraView(s.cameraView==='chase'?'cockpit':'chase')}>{s.cameraView==='chase'?'Cockpit view':'Tail view'}</button><button onClick={toggleFullscreen}>{fullscreen?'Exit fullscreen':'⛶ Fullscreen'}</button><button onClick={s.disconnect}>Leave</button></div></header>
    <div className="flight-reticle">+</div><div className="rc-telemetry"><span>ALT {Math.round(p?.aircraft.altitude||0)} m</span><span>SPD {Math.round(p?.aircraft.speed||0)} m/s</span></div>
    <div className="rc-controls"><Stick label="Yaw and altitude joystick" axes={['yaw','vertical']} legend="YAW · UP / DOWN"/><button className="rc-respawn" onClick={s.respawn}>↻ Reset</button><Stick label="Move joystick" axes={['strafe','forward']} legend="LEFT / RIGHT · FORWARD / BACK"/></div>
    {s.cameraView==='cockpit' && <div className="cockpit-edge"/>}
    {note && <p className="orientation-note">{note}<button onClick={()=>setNote('')}>×</button></p>}
    {prompt && <div className="immersive-prompt"><section><span className="eyebrow">YOUR PHONE IS THE CONTROLLER</span><h2>Turn sideways. <br/>Take the controls.</h2><p>Tail view follows your aircraft. Left stick controls yaw and altitude; right stick moves forward, back, left and right. Fullscreen and auto-rotation depend on your browser.</p><button className="primary" onClick={immersive}>Start fullscreen & landscape</button><button className="text-button" onClick={()=>setPrompt(false)}>Play in this window</button></section></div>}
    <div className="rotate-hint">↻ Rotate your phone for landscape flight</div>
  </div>;
}
