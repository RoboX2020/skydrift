import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AircraftProps {
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  color: string;
  isLocal?: boolean;
  name?: string;
}

export function Aircraft({ position, rotation, color, isLocal = false, name }: AircraftProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(...position));
  const targetQuaternion = useRef(new THREE.Quaternion(...rotation));
  
  // Initialize position immediately
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);
    }
  }, []); // Only on mount
  
  // Update targets only when props change (not every frame)
  useEffect(() => {
    targetPosition.current.set(...position);
    targetQuaternion.current.set(rotation[0], rotation[1], rotation[2], rotation[3]);
  }, [position[0], position[1], position[2], rotation[0], rotation[1], rotation[2], rotation[3]]);

  // Smooth interpolation for all players
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // Use frame-rate independent interpolation
    if (isLocal) {
      // Local player: very responsive but still smooth
      const lerpFactor = Math.min(1, delta * 20);
      groupRef.current.position.lerp(targetPosition.current, lerpFactor);
      groupRef.current.quaternion.slerp(targetQuaternion.current, lerpFactor);
    } else {
      // Other players: smoother interpolation to hide network lag
      const lerpFactor = Math.min(1, delta * 10);
      groupRef.current.position.lerp(targetPosition.current, lerpFactor);
      groupRef.current.quaternion.slerp(targetQuaternion.current, lerpFactor);
    }
  });

  const aircraftColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <group ref={groupRef} scale={3}>
      {/* Aircraft model - properly oriented: forward = +Z, up = +Y, right = +X */}
      {/* Fuselage - cylinder rotated to align with Z-axis (forward) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 6, 16]} />
        <meshStandardMaterial color={aircraftColor} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Cockpit */}
      <mesh position={[0, 0.4, 1.5]} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Main Wings - span along X-axis */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[10, 0.2, 2]} />
        <meshStandardMaterial color={aircraftColor} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Wing tips */}
      <mesh position={[5, 0.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 1.5]} />
        <meshStandardMaterial color={aircraftColor} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-5, 0.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 1.5]} />
        <meshStandardMaterial color={aircraftColor} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Tail Wing (Horizontal Stabilizer) */}
      <mesh position={[0, 0, -2.5]} castShadow>
        <boxGeometry args={[4, 0.12, 1]} />
        <meshStandardMaterial color={aircraftColor} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Vertical Stabilizer */}
      <mesh position={[0, 1, -2.5]} castShadow>
        <boxGeometry args={[0.12, 1.8, 1]} />
        <meshStandardMaterial color={aircraftColor} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Engine (nose) */}
      <mesh position={[0, 0, 3.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.6, 0.5, 0.9, 16]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Propeller hub */}
      <mesh position={[0, 0, 3.75]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Propeller blades */}
      <PropellerBlades position={[0, 0, 3.85]} />
      
      {/* Engine glow - positioned at the engine */}
      {isLocal && (
        <pointLight 
          position={[0, 0, 3.5]} 
          color="#ff6600" 
          intensity={1.2} 
          distance={12} 
        />
      )}
      
      {/* Name label for other players - positioned above aircraft */}
      {!isLocal && name && (
        <sprite position={[0, 2.5, 0]} scale={[4, 1, 1]}>
          <spriteMaterial color={color} opacity={0.8} transparent />
        </sprite>
      )}
    </group>
  );
}

function PropellerBlades({ position }: { position: [number, number, number] }) {
  const bladeRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (bladeRef.current) {
      // Rotate around Z-axis (forward direction)
      bladeRef.current.rotation.z += delta * 60; // Fast spin
    }
  });

  return (
    <group ref={bladeRef} position={position}>
      {[0, 120, 240].map((angle, i) => (
        <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
          <boxGeometry args={[0.2, 2.2, 0.03]} />
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
