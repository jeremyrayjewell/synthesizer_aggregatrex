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
    '#33ccff', '#ff6633', '#cc33ff', '#66ff33',
    '#ff0080', '#80ff00', '#0080ff', '#ff8000',
    '#8000ff', '#00ff80', '#ff0088', '#88ff00'
  ];
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const masterVolume = synthParams?.master?.volume || 0;
    const baseIntensity = Math.max(1.0, masterVolume * 3.5);

    atmosphericLights.current.forEach((lightRef, index) => {
      if (!lightRef.current) return;

      const offset = index * Math.PI / 4;
      const radius = 35 + Math.sin(time * 0.4 + offset) * 15;
      const height = 18 + Math.cos(time * 0.5 + offset) * 12;
      
      // Enhanced color transitions with more vibrant cycling
      const colorIndex = Math.floor((time * 0.3 + index * 0.8) % colorPalette.length);
      const nextColorIndex = (colorIndex + 1) % colorPalette.length;
      const colorMix = ((time * 0.3 + index * 0.8) % 1);
      
      const currentColor = new THREE.Color(colorPalette[colorIndex])
        .lerp(new THREE.Color(colorPalette[nextColorIndex]), colorMix);
      
      lightRef.current.color = currentColor;
      lightRef.current.intensity = baseIntensity * (1.2 + Math.sin(time * 2.5 + offset) * 0.8);
      
      // Enhanced orbital movement with more dramatic patterns
      lightRef.current.position.set(
        Math.cos(time * 0.4 + offset) * radius,
        height,
        Math.sin(time * 0.4 + offset) * radius
      );
    });
  });

  return (
    <group>      {/* Enhanced atmospheric point lights with increased range */}
      {atmosphericLights.current.map((ref, index) => (
        <pointLight
          key={index}
          ref={ref}
          decay={0.8}
          distance={90}
          intensity={0}
        />
      ))}
        {/* Additional static atmospheric lights for enhanced base illumination - optimized */}
      <pointLight
        position={[0, 30, 0]}
        intensity={1.5} // Reduced intensity
        color="#ffffff"
        decay={1.2}
        distance={100}
      />
      
      <pointLight
        position={[-50, 25, -50]}
        intensity={2.0} // Reduced intensity
        color="#ff3399"
        decay={1.0}
        distance={80}
      />
      
      <pointLight
        position={[50, 25, 50]}
        intensity={2.0} // Reduced intensity
        color="#3399ff"
        decay={1.0}
        distance={80}
      />
      
      <pointLight
        position={[50, 20, -50]}
        intensity={1.8} // Reduced intensity
        color="#99ff33"
        decay={1.0}
        distance={75}
      />
      
      <pointLight
        position={[-50, 20, 50]}
        intensity={1.8} // Reduced intensity
        color="#ff9933"
        decay={1.0}
        distance={75}
      />

      {/* High-intensity color accent lights - reduced count for performance */}
      <pointLight
        position={[0, 40, 0]}
        intensity={2.5} // Reduced intensity
        color="#ff00aa"
        decay={1.1}
        distance={120}
      />
      
      <pointLight
        position={[-70, 30, 0]}
        intensity={1.5} // Reduced intensity
        color="#00aaff"
        decay={1.3}
        distance={70}
      />
      
      <pointLight
        position={[70, 30, 0]}
        intensity={1.5} // Reduced intensity
        color="#aaff00"
        decay={1.3}
        distance={70}
      />
    </group>
  );
};

export default AtmosphericLights;
