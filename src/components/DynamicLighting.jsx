import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSynthContext } from '../hooks/useSynth';

const DynamicLighting = React.memo(() => {
  const { synthParams } = useSynthContext();
  const spotLight1Ref = useRef();
  const spotLight2Ref = useRef();
  const spotLight3Ref = useRef();
  const pointLight1Ref = useRef();
  const pointLight2Ref = useRef();
  
  // Performance optimization: track last update time
  const lastUpdateRef = useRef(0);
  const updateIntervalRef = useRef(32); // Update every ~32ms instead of every frame
  
  // Create expanded color palettes for different moods
  const colorPalettes = useMemo(() => ({
    ambient: [
      new THREE.Color('#4a90e2'), // Blue
      new THREE.Color('#7b68ee'), // Medium slate blue
      new THREE.Color('#9370db'), // Medium purple
      new THREE.Color('#ba55d3'), // Medium orchid
      new THREE.Color('#6495ed'), // Cornflower blue
      new THREE.Color('#8a2be2'), // Blue violet
      new THREE.Color('#9932cc'), // Dark orchid
      new THREE.Color('#4169e1'), // Royal blue
    ],
    warm: [
      new THREE.Color('#ff6b35'), // Orange red
      new THREE.Color('#f7931e'), // Orange
      new THREE.Color('#ffd700'), // Gold
      new THREE.Color('#ff8c00'), // Dark orange
      new THREE.Color('#ff4500'), // Orange red
      new THREE.Color('#dc143c'), // Crimson
      new THREE.Color('#ff69b4'), // Hot pink
      new THREE.Color('#ff1493'), // Deep pink
    ],
    cool: [
      new THREE.Color('#00ffff'), // Cyan
      new THREE.Color('#40e0d0'), // Turquoise
      new THREE.Color('#00ced1'), // Dark turquoise
      new THREE.Color('#5f9ea0'), // Cadet blue
      new THREE.Color('#20b2aa'), // Light sea green
      new THREE.Color('#00fa9a'), // Medium spring green
      new THREE.Color('#48d1cc'), // Medium turquoise
      new THREE.Color('#66cdaa'), // Medium aquamarine
    ],
    vibrant: [
      new THREE.Color('#ff1493'), // Deep pink
      new THREE.Color('#00ff00'), // Lime
      new THREE.Color('#ff4500'), // Orange red
      new THREE.Color('#9400d3'), // Violet
      new THREE.Color('#ff00ff'), // Magenta
      new THREE.Color('#00ff7f'), // Spring green
      new THREE.Color('#ff6347'), // Tomato
      new THREE.Color('#8b00ff'), // Electric violet
      new THREE.Color('#32cd32'), // Lime green
      new THREE.Color('#ff69b4'), // Hot pink
    ]
  }), []);
  
  // Determine current palette based on synth state
  const getCurrentPalette = useMemo(() => () => {
    if (synthParams?.effects?.distortion?.enabled && synthParams?.effects?.distortion?.drive > 10) {
      return colorPalettes.vibrant;
    }
    if (synthParams?.effects?.reverb?.enabled && synthParams?.effects?.reverb?.size > 0.7) {
      return colorPalettes.ambient;
    }
    if (synthParams?.oscillator1?.type === 'sine' || synthParams?.filter?.type === 'lowpass') {
      return colorPalettes.warm;
    }
    return colorPalettes.cool;
  }, [synthParams?.effects?.distortion?.enabled, synthParams?.effects?.distortion?.drive, 
      synthParams?.effects?.reverb?.enabled, synthParams?.effects?.reverb?.size,
      synthParams?.oscillator1?.type, synthParams?.filter?.type, colorPalettes]);

  useFrame((state) => {
    const now = Date.now();
    // Performance optimization: skip update if not enough time has passed
    if (now - lastUpdateRef.current < updateIntervalRef.current) return;
    lastUpdateRef.current = now;
    
    const time = state.clock.elapsedTime;
    const palette = getCurrentPalette();
    
    // Get current effects activity for intensity modulation
    const masterVolume = synthParams?.master?.volume || 0;
    const filterFreq = synthParams?.filter?.frequency || 1000;
    const reverbMix = synthParams?.effects?.reverb?.mix || 0;
    const delayMix = synthParams?.effects?.delay?.mix || 0;
    
    // Calculate base intensity from synth parameters
    const baseIntensity = Math.max(0.2, masterVolume * 0.8 + 0.2);
    const frequencyModulation = Math.sin(filterFreq / 1000) * 0.3;
    const effectsModulation = (reverbMix + delayMix) * 0.5;
    
    // Spotlight 1 - Main moving light
    if (spotLight1Ref.current) {
      const colorIndex = Math.floor((time * 0.3) % palette.length);
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorMix = (time * 0.3) % 1;
      
      const currentColor = palette[colorIndex].clone().lerp(palette[nextColorIndex], colorMix);
      spotLight1Ref.current.color = currentColor;
      spotLight1Ref.current.intensity = (baseIntensity * 3 + 2) * (1 + Math.sin(time * 0.8) * 0.2);
      
      // Orbit movement
      const radius = 8;
      spotLight1Ref.current.position.x = Math.cos(time * 0.5) * radius;
      spotLight1Ref.current.position.z = Math.sin(time * 0.5) * radius;
      spotLight1Ref.current.position.y = 5 + Math.sin(time * 0.8) * 2;
    }

    // Spotlight 2 - Counter-rotating light
    if (spotLight2Ref.current) {
      const colorIndex = Math.floor((time * 0.2 + 0.5) % palette.length);
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorMix = ((time * 0.2 + 0.5) % 1);
      const currentColor = palette[colorIndex].clone().lerp(palette[nextColorIndex], colorMix);
      spotLight2Ref.current.color = currentColor;
      spotLight2Ref.current.intensity = (baseIntensity * 2.5 + 1.5) * (1 + Math.cos(time * 0.7) * 0.3);
      
      // Counter-orbit movement
      const radius = 6;
      spotLight2Ref.current.position.x = Math.cos(-time * 0.7) * radius;
      spotLight2Ref.current.position.z = Math.sin(-time * 0.7) * radius;
      spotLight2Ref.current.position.y = 6 + Math.cos(time * 1.2) * 1.5;
    }

    // Spotlight 3 - Vertical sweeping light
    if (spotLight3Ref.current) {
      const colorIndex = Math.floor((time * 0.4 + 0.25) % palette.length);
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorMix = ((time * 0.4 + 0.25) % 1);
      const currentColor = palette[colorIndex].clone().lerp(palette[nextColorIndex], colorMix);
      spotLight3Ref.current.color = currentColor;
      spotLight3Ref.current.intensity = (baseIntensity * 2 + 1) * (1 + Math.sin(time * 1.2) * 0.2);
      
      // Vertical sweeping
      spotLight3Ref.current.position.x = Math.sin(time * 0.6) * 4;
      spotLight3Ref.current.position.y = 8 + Math.sin(time * 0.9) * 3;
      spotLight3Ref.current.position.z = 3;
    }
    
    // Point Light 1 - Pulsing accent light
    if (pointLight1Ref.current) {
      const colorIndex = Math.floor((time * 0.6) % palette.length);
      pointLight1Ref.current.color = palette[colorIndex];
      pointLight1Ref.current.intensity = (baseIntensity * 2 + 1) * (1 + Math.sin(time * 1.5 + frequencyModulation) * 0.3);
      
      // Floating movement
      pointLight1Ref.current.position.x = -3 + Math.sin(time * 0.8) * 2;
      pointLight1Ref.current.position.y = 2 + Math.cos(time * 1.1) * 1;
      pointLight1Ref.current.position.z = 2 + Math.sin(time * 0.7) * 1.5;
    }
    
    // Point Light 2 - Effects-responsive light
    if (pointLight2Ref.current) {
      const colorIndex = Math.floor((time * 0.5 + effectsModulation * 2) % palette.length);
      pointLight2Ref.current.color = palette[colorIndex];
      pointLight2Ref.current.intensity = (baseIntensity * 1.5 + 0.8) * (1 + effectsModulation * 1 + Math.cos(time * 2) * 0.2);
      
      // Effects-influenced movement
      pointLight2Ref.current.position.x = 3 + Math.cos(time * 1.2 + effectsModulation) * 1.5;
      pointLight2Ref.current.position.y = 1.5 + effectsModulation * 2;
      pointLight2Ref.current.position.z = -1 + Math.sin(time * 0.9) * 2;
    }
  });

  return (
    <group>
      {/* Main ambient light - increased for better overall illumination */}
      <ambientLight intensity={0.5} color="#444466" />
      
      {/* Main directional light - very bright for better material reflections */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={1.2} 
        color="#ffeedd"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Dynamic spotlights with MASSIVE angles and distances for huge diffuse lighting */}
      <spotLight
        ref={spotLight1Ref}
        angle={Math.PI / 1.1}
        penumbra={0.98}
        decay={0.5}
        distance={150}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      <spotLight
        ref={spotLight2Ref}
        angle={Math.PI / 1.3}
        penumbra={0.95}
        decay={0.5}
        distance={140}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      <spotLight
        ref={spotLight3Ref}
        angle={Math.PI / 1.05}
        penumbra={0.99}
        decay={0.5}
        distance={130}
        target-position={[0, 0, 0]}
      />
      
      {/* Dynamic point lights with massive range */}
      <pointLight
        ref={pointLight1Ref}
        decay={0.6}
        distance={120}
      />
      
      <pointLight
        ref={pointLight2Ref}
        decay={0.6}
        distance={110}
      />
      
      {/* Additional massive atmospheric lights for ENORMOUS diffuse illumination */}
      <pointLight
        position={[-25, 15, -25]}
        intensity={4.5}
        color="#4a90e2"
        decay={0.7}
        distance={140}
      />
      
      <pointLight
        position={[25, 15, 25]}
        intensity={4.2}
        color="#ff6b35"
        decay={0.7}
        distance={135}
      />
      
      <pointLight
        position={[0, 25, -20]}
        intensity={5.0}
        color="#9370db"
        decay={0.6}
        distance={160}
      />
      
      {/* Additional perimeter lights for MASSIVE coverage */}
      <pointLight
        position={[-35, 12, 0]}
        intensity={3.8}
        color="#00ffff"
        decay={0.8}
        distance={110}
      />
      
      <pointLight
        position={[35, 12, 0]}
        intensity={3.8}
        color="#ff1493"
        decay={0.8}
        distance={110}
      />
      
      <pointLight
        position={[0, 20, 35]}
        intensity={4.0}
        color="#00ff00"
        decay={0.7}
        distance={120}
      />
      
      {/* Even more massive corner lights for total coverage */}
      <pointLight
        position={[-40, 18, -40]}
        intensity={3.5}
        color="#ffff00"
        decay={0.9}
        distance={100}
      />
      
      <pointLight
        position={[40, 18, 40]}
        intensity={3.5}
        color="#ff8000"
        decay={0.9}
        distance={100}
      />
      
      <pointLight
        position={[-40, 18, 40]}
        intensity={3.2}
        color="#8000ff"
        decay={0.9}
        distance={95}
      />
      
      <pointLight
        position={[40, 18, -40]}
        intensity={3.2}
        color="#ff0080"
        decay={0.9}
        distance={95}
      />
    </group>
  );
});

export default DynamicLighting;
