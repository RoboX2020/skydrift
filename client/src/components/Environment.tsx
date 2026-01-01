import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Simple heightmap-based terrain
export function Terrain() {
  const geometry = useMemo(() => {
    const size = 10000;
    const segments = 128;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    
    // Generate heightmap
    const positions = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Multi-octave noise for terrain
      let height = 0;
      height += Math.sin(x * 0.001) * Math.cos(y * 0.001) * 100;
      height += Math.sin(x * 0.005) * Math.cos(y * 0.005) * 50;
      height += Math.sin(x * 0.02) * Math.cos(y * 0.02) * 20;
      height += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 10;
      
      // Clamp minimum height
      height = Math.max(0, height);
      
      positions[i + 2] = height;
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh 
      geometry={geometry} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
    >
      <meshStandardMaterial 
        color="#2d5016" 
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

// Ocean/water plane
export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      // Subtle color shift for water
      const t = clock.elapsedTime * 0.1;
      material.color.setHSL(0.55, 0.7, 0.35 + Math.sin(t) * 0.05);
    }
  });

  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -5, 0]}
      receiveShadow
    >
      <planeGeometry args={[20000, 20000]} />
      <meshStandardMaterial 
        color="#1a5276" 
        roughness={0.3}
        metalness={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Runway
export function Runway() {
  return (
    <group position={[0, 0.5, 0]}>
      {/* Main runway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 500]} />
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </mesh>
      
      {/* Center line markings */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[0, 0.1, -225 + i * 25]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.5, 15]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      
      {/* Edge lights */}
      {Array.from({ length: 25 }).map((_, i) => (
        <group key={i}>
          <pointLight 
            position={[16, 1, -240 + i * 20]} 
            color="#ffff00" 
            intensity={0.5} 
            distance={30}
          />
          <pointLight 
            position={[-16, 1, -240 + i * 20]} 
            color="#ffff00" 
            intensity={0.5} 
            distance={30}
          />
        </group>
      ))}
    </group>
  );
}

// Environment and lighting
interface SkyboxProps {
  timeOfDay: number;
}

export function Skybox({ timeOfDay }: SkyboxProps) {
  // Calculate sun position based on time of day
  const sunPosition = useMemo(() => {
    const angle = ((timeOfDay - 6) / 12) * Math.PI; // 6am to 6pm arc
    const x = Math.cos(angle) * 1000;
    const y = Math.sin(angle) * 1000;
    return [x, Math.max(y, -100), 0] as [number, number, number];
  }, [timeOfDay]);

  // Determine if it's night
  const isNight = timeOfDay < 6 || timeOfDay > 18;
  
  return (
    <>
      <Sky 
        distance={450000}
        sunPosition={sunPosition}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={isNight ? 0.1 : 2}
        turbidity={isNight ? 0 : 8}
      />
      
      {/* Sun/Moon light */}
      <directionalLight
        position={sunPosition}
        intensity={isNight ? 0.3 : 1.5}
        color={isNight ? '#aabbff' : '#fff5e0'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={5000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />
      
      {/* Ambient light */}
      <ambientLight intensity={isNight ? 0.2 : 0.4} color={isNight ? '#334466' : '#ffffff'} />
      
      {/* Hemisphere light for sky bounce */}
      <hemisphereLight
        args={[isNight ? '#001133' : '#87ceeb', '#2d5016', isNight ? 0.3 : 0.6]}
      />
      
      {/* Clouds */}
      <CloudLayer />
    </>
  );
}

function CloudLayer() {
  const clouds = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 8000,
        1500 + Math.random() * 1000,
        (Math.random() - 0.5) * 8000,
      ] as [number, number, number],
      scale: 50 + Math.random() * 100,
    }));
  }, []);

  return (
    <>
      {clouds.map((cloud, i) => (
        <Cloud
          key={i}
          position={cloud.position}
          speed={0.2}
          opacity={0.7}
          segments={20}
        />
      ))}
    </>
  );
}

// Grid helper for orientation
export function WorldGrid() {
  return (
    <gridHelper 
      args={[10000, 100, '#1a5276', '#1a5276']} 
      position={[0, 1, 0]}
    />
  );
}
