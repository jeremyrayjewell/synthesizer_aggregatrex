import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSynthContext } from '../hooks/useSynth';

const AtmosphericLights = () => {
  const { synthParams } = useSynthContext();
  const atmosphericLights = useRef([]);
  
  // Initialize refs for atmospheric lights
  React.useEffect(() => {
    atmosphericLights.current = Array(8).fill(null).map(() => React.createRef());
  }, []);

  const colorPalette = [
    '#ff3366', '#33ff66', '#6633ff', '#ffcc33',
    '#33ccff', '#ff6633', '#cc33ff', '#66ff33'
  ];

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const masterVolume = synthParams?.master?.volume || 0;
    const baseIntensity = Math.max(0.5, masterVolume * 2);

    atmosphericLights.current.forEach((lightRef, index) => {
      if (!lightRef.current) return;

      const offset = index * Math.PI / 4;
      const radius = 30 + Math.sin(time * 0.3 + offset) * 10;
      const height = 15 + Math.cos(time * 0.4 + offset) * 8;
      
      // Smooth color transitions
      const colorIndex = Math.floor((time * 0.2 + index * 0.5) % colorPalette.length);
      const nextColorIndex = (colorIndex + 1) % colorPalette.length;
      const colorMix = ((time * 0.2 + index * 0.5) % 1);
      
      const currentColor = new THREE.Color(colorPalette[colorIndex])
        .lerp(new THREE.Color(colorPalette[nextColorIndex]), colorMix);
      
      lightRef.current.color = currentColor;
      lightRef.current.intensity = baseIntensity * (0.8 + Math.sin(time * 2 + offset) * 0.4);
      
      // Orbital movement
      lightRef.current.position.set(
        Math.cos(time * 0.3 + offset) * radius,
        height,
        Math.sin(time * 0.3 + offset) * radius
      );
    });
  });

  return (
    <group>
      {/* Large atmospheric point lights */}
      {atmosphericLights.current.map((ref, index) => (
        <pointLight
          key={index}
          ref={ref}
          decay={1.1}
          distance={70}
          intensity={0}
        />
      ))}
      
      {/* Additional static atmospheric lights for base illumination */}
      <pointLight
        position={[0, 25, 0]}
        intensity={1}
        color="#ffffff"
        decay={1.5}
        distance={100}
      />
      
      <pointLight
        position={[-40, 20, -40]}
        intensity={1.5}
        color="#ff3399"
        decay={1.3}
        distance={80}
      />
      
      <pointLight
        position={[40, 20, 40]}
        intensity={1.5}
        color="#3399ff"
        decay={1.3}
        distance={80}
      />
      
      <pointLight
        position={[40, 15, -40]}
        intensity={1.2}
        color="#99ff33"
        decay={1.3}
        distance={75}
      />
      
      <pointLight
        position={[-40, 15, 40]}
        intensity={1.2}
        color="#ff9933"
        decay={1.3}
        distance={75}
      />
    </group>
  );
};

export default AtmosphericLights;
