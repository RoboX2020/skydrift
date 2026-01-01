import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { Aircraft } from './Aircraft';
import { Terrain, Ocean, Runway, Skybox, WorldGrid } from './Environment';
import { HUD } from './HUD';

// Camera that follows the local player's aircraft
function FollowCamera() {
  const { camera } = useThree();
  const playerId = useGameStore((state) => state.playerId);
  const players = useGameStore((state) => state.players);
  
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  
  useFrame((_, delta) => {
    if (!playerId) return;
    
    const localPlayer = players.get(playerId);
    if (!localPlayer) return;
    
    const { position, rotation } = localPlayer.aircraft;
    
    // Create quaternion from player rotation
    const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    
    // Camera offset behind and above the aircraft
    const offset = new THREE.Vector3(0, 6, -18);
    offset.applyQuaternion(quat);
    
    // Target camera position
    targetPosition.current.set(
      position.x + offset.x,
      position.y + offset.y,
      position.z + offset.z
    );
    
    // Look at point (slightly ahead of aircraft)
    const lookAhead = new THREE.Vector3(0, 0, 25);
    lookAhead.applyQuaternion(quat);
    targetLookAt.current.set(
      position.x + lookAhead.x,
      position.y + lookAhead.y,
      position.z + lookAhead.z
    );
    
    // Smooth camera movement (frame-rate independent)
    const cameraLerp = Math.min(1, delta * 8);
    camera.position.lerp(targetPosition.current, cameraLerp);
    
    // Smooth look-at interpolation
    currentLookAt.current.lerp(targetLookAt.current, cameraLerp);
    camera.lookAt(currentLookAt.current);
  });
  
  return null;
}

// Render all players' aircraft
function Players() {
  const playerId = useGameStore((state) => state.playerId);
  const players = useGameStore((state) => state.players);
  
  return (
    <>
      {Array.from(players.values()).map((player) => (
        <Aircraft
          key={player.id}
          position={[
            player.aircraft.position.x,
            player.aircraft.position.y,
            player.aircraft.position.z,
          ]}
          rotation={[
            player.aircraft.rotation.x,
            player.aircraft.rotation.y,
            player.aircraft.rotation.z,
            player.aircraft.rotation.w,
          ]}
          color={player.color}
          isLocal={player.id === playerId}
          name={player.name}
        />
      ))}
    </>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="hotpink" wireframe />
    </mesh>
  );
}

// Main 3D scene
function Scene() {
  const timeOfDay = useGameStore((state) => state.timeOfDay);
  
  return (
    <>
      <Skybox timeOfDay={timeOfDay} />
      <Ocean />
      <Terrain />
      <Runway />
      <WorldGrid />
      <Players />
      <FollowCamera />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#87ceeb', 500, 8000]} />
    </>
  );
}

// Keyboard handling for game actions
function GameInputHandler() {
  useKeyboardInput();
  
  const respawn = useGameStore((state) => state.respawn);
  const setShowChat = useGameStore((state) => state.setShowChat);
  const showChat = useGameStore((state) => state.showChat);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && !showChat) {
        respawn();
      }
      if (e.code === 'KeyT' && !showChat) {
        e.preventDefault();
        setShowChat(true);
      }
      if (e.code === 'Escape' && showChat) {
        setShowChat(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [respawn, setShowChat, showChat]);
  
  return null;
}

// Main game component
export function Game() {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        camera={{ 
          fov: 75, 
          near: 0.1, 
          far: 20000,
          position: [0, 500, -20],
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
        </Suspense>
      </Canvas>
      
      <HUD />
      <GameInputHandler />
      <Chat />
    </div>
  );
}

// Chat component
function Chat() {
  const showChat = useGameStore((state) => state.showChat);
  const setShowChat = useGameStore((state) => state.setShowChat);
  const sendChat = useGameStore((state) => state.sendChat);
  const chatMessages = useGameStore((state) => state.chatMessages);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (showChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showChat]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current?.value) {
      sendChat(inputRef.current.value);
      inputRef.current.value = '';
      setShowChat(false);
    }
  };
  
  return (
    <div className={`fixed bottom-20 left-4 w-80 ${showChat ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Chat messages */}
      <div className="hud-panel rounded-lg p-2 mb-2 max-h-40 overflow-y-auto opacity-80">
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-xs">Press T to chat</div>
        ) : (
          chatMessages.slice(-10).map((msg, i) => (
            <div key={i} className="text-xs mb-1">
              <span className="text-hud-secondary">{msg.playerName}:</span>
              <span className="text-gray-300 ml-1">{msg.text}</span>
            </div>
          ))
        )}
      </div>
      
      {/* Chat input */}
      {showChat && (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type message..."
            maxLength={200}
            className="w-full bg-hud-bg border border-hud-primary/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-hud-primary"
          />
        </form>
      )}
    </div>
  );
}
