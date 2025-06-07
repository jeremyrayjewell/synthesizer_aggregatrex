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
  const updateIntervalRef = useRef(40); // Update every ~40ms instead of every frame
    // Create massively expanded color palettes with much wider range and more vibrant colors
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
      new THREE.Color('#00bfff'), // Deep sky blue
      new THREE.Color('#1e90ff'), // Dodger blue
      new THREE.Color('#6a5acd'), // Slate blue
      new THREE.Color('#483d8b'), // Dark slate blue
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
      new THREE.Color('#ff6347'), // Tomato
      new THREE.Color('#ff7f50'), // Coral
      new THREE.Color('#ffb347'), // Peach
      new THREE.Color('#ff9500'), // Amber
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
      new THREE.Color('#00e6e6'), // Bright cyan
      new THREE.Color('#26d0ce'), // Medium turquoise
      new THREE.Color('#17a2b8'), // Teal
      new THREE.Color('#138496'), // Dark cyan
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
      new THREE.Color('#00ffff'), // Cyan
      new THREE.Color('#ffff00'), // Yellow
      new THREE.Color('#ff0080'), // Electric pink
      new THREE.Color('#80ff00'), // Electric lime
      new THREE.Color('#0080ff'), // Electric blue
      new THREE.Color('#ff8000'), // Electric orange
    ],
    psychedelic: [
      new THREE.Color('#ff0066'), // Electric pink
      new THREE.Color('#66ff00'), // Electric green  
      new THREE.Color('#0066ff'), // Electric blue
      new THREE.Color('#ff6600'), // Electric orange
      new THREE.Color('#6600ff'), // Electric purple
      new THREE.Color('#00ff66'), // Electric cyan-green
      new THREE.Color('#ff3300'), // Electric red
      new THREE.Color('#3300ff'), // Electric indigo
      new THREE.Color('#00ffcc'), // Electric turquoise
      new THREE.Color('#cc00ff'), // Electric magenta
      new THREE.Color('#ffcc00'), // Electric yellow
      new THREE.Color('#cc0066'), // Electric crimson
    ]
  }), []);
    // Determine current palette based on synth state with more dynamic switching
  const getCurrentPalette = useMemo(() => () => {
    const time = Date.now() * 0.001;
    const masterVolume = synthParams?.master?.volume || 0;
    
    // High energy situations trigger psychedelic mode
    if (masterVolume > 0.8 && (synthParams?.effects?.distortion?.enabled || synthParams?.effects?.chorus?.enabled)) {
      return colorPalettes.psychedelic;
    }
    if (synthParams?.effects?.distortion?.enabled && synthParams?.effects?.distortion?.drive > 10) {
      return colorPalettes.vibrant;
    }
    if (synthParams?.effects?.reverb?.enabled && synthParams?.effects?.reverb?.size > 0.7) {
      return colorPalettes.ambient;
    }
    if (synthParams?.oscillator1?.type === 'sine' || synthParams?.filter?.type === 'lowpass') {
      return colorPalettes.warm;
    }
    // Dynamic cycling through palettes when no specific effects
    const cycleIndex = Math.floor(time * 0.1) % 4;
    return [colorPalettes.cool, colorPalettes.warm, colorPalettes.ambient, colorPalettes.vibrant][cycleIndex];
  }, [synthParams?.effects?.distortion?.enabled, synthParams?.effects?.distortion?.drive, 
      synthParams?.effects?.reverb?.enabled, synthParams?.effects?.reverb?.size,
      synthParams?.oscillator1?.type, synthParams?.filter?.type, synthParams?.master?.volume,
      synthParams?.effects?.chorus?.enabled, colorPalettes]);

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
      // Calculate much more dynamic base intensity from synth parameters
    const baseIntensity = Math.max(0.4, masterVolume * 1.5 + 0.5);
    const frequencyModulation = Math.sin(filterFreq / 1000) * 0.5;
    const effectsModulation = (reverbMix + delayMix) * 0.8;
    const energyBoost = masterVolume > 0.7 ? 1.5 : 1.0;
    
    // Spotlight 1 - Main moving light with much brighter, more dynamic behavior
    if (spotLight1Ref.current) {
      const colorIndex = Math.floor((time * 0.4) % palette.length);
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorMix = (time * 0.4) % 1;
      
      const currentColor = palette[colorIndex].clone().lerp(palette[nextColorIndex], colorMix);
      spotLight1Ref.current.color = currentColor;
      spotLight1Ref.current.intensity = (baseIntensity * 5 + 3) * energyBoost * (1 + Math.sin(time * 1.2) * 0.4);
      
      // More dramatic orbit movement
      const radius = 12;
      spotLight1Ref.current.position.x = Math.cos(time * 0.7) * radius;
      spotLight1Ref.current.position.z = Math.sin(time * 0.7) * radius;
      spotLight1Ref.current.position.y = 8 + Math.sin(time * 1.1) * 4;
    }

    // Spotlight 2 - Counter-rotating light with enhanced dynamics
    if (spotLight2Ref.current) {
      const colorIndex = Math.floor((time * 0.3 + 0.5) % palette.length);
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorMix = ((time * 0.3 + 0.5) % 1);
      const currentColor = palette[colorIndex].clone().lerp(palette[nextColorIndex], colorMix);
      spotLight2Ref.current.color = currentColor;
      spotLight2Ref.current.intensity = (baseIntensity * 4 + 2.5) * energyBoost * (1 + Math.cos(time * 0.9) * 0.5);
      
      // Enhanced counter-orbit movement
      const radius = 10;
      spotLight2Ref.current.position.x = Math.cos(-time * 0.9) * radius;
      spotLight2Ref.current.position.z = Math.sin(-time * 0.9) * radius;
      spotLight2Ref.current.position.y = 10 + Math.cos(time * 1.5) * 3;
    }    // Spotlight 3 - Vertical sweeping light with enhanced movement
    if (spotLight3Ref.current) {
      const colorIndex = Math.floor((time * 0.5 + 0.25) % palette.length);
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorMix = ((time * 0.5 + 0.25) % 1);
      const currentColor = palette[colorIndex].clone().lerp(palette[nextColorIndex], colorMix);
      spotLight3Ref.current.color = currentColor;
      spotLight3Ref.current.intensity = (baseIntensity * 3.5 + 2) * energyBoost * (1 + Math.sin(time * 1.4) * 0.3);
      
      // Enhanced vertical sweeping with figure-8 pattern
      spotLight3Ref.current.position.x = Math.sin(time * 0.8) * 6;
      spotLight3Ref.current.position.y = 12 + Math.sin(time * 1.2) * 5;
      spotLight3Ref.current.position.z = Math.cos(time * 0.6) * 4;
    }
    
    // Point Light 1 - Dramatically enhanced pulsing accent light
    if (pointLight1Ref.current) {
      const colorIndex = Math.floor((time * 0.8) % palette.length);
      pointLight1Ref.current.color = palette[colorIndex];
      pointLight1Ref.current.intensity = (baseIntensity * 4 + 2) * energyBoost * (1 + Math.sin(time * 2.2 + frequencyModulation) * 0.5);
      
      // Enhanced floating movement with spiral pattern
      pointLight1Ref.current.position.x = -5 + Math.sin(time * 1.1) * 4;
      pointLight1Ref.current.position.y = 4 + Math.cos(time * 1.5) * 3;
      pointLight1Ref.current.position.z = 3 + Math.sin(time * 0.9) * 3;
    }
    
    // Point Light 2 - Enhanced effects-responsive light
    if (pointLight2Ref.current) {
      const colorIndex = Math.floor((time * 0.6 + effectsModulation * 3) % palette.length);
      pointLight2Ref.current.color = palette[colorIndex];
      pointLight2Ref.current.intensity = (baseIntensity * 3 + 1.5) * energyBoost * (1 + effectsModulation * 1.5 + Math.cos(time * 2.5) * 0.4);
      
      // Enhanced effects-influenced movement with chaos factor
      pointLight2Ref.current.position.x = 5 + Math.cos(time * 1.5 + effectsModulation * 2) * 3;
      pointLight2Ref.current.position.y = 3 + effectsModulation * 4 + Math.sin(time * 1.8) * 2;
      pointLight2Ref.current.position.z = -2 + Math.sin(time * 1.2) * 4;
    }
  });

  return (
    <group>      {/* Main ambient light - significantly increased for brighter overall illumination */}
      <ambientLight intensity={0.8} color="#555577" />
      
      {/* Main directional light - much brighter for enhanced material reflections */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={2.0} 
        color="#ffeedd"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
        {/* Enhanced dynamic spotlights with MASSIVE angles and distances for huge diffuse lighting */}
      <spotLight
        ref={spotLight1Ref}
        angle={Math.PI / 0.9}
        penumbra={0.99}
        decay={0.4}
        distance={200}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      <spotLight
        ref={spotLight2Ref}
        angle={Math.PI / 1.1}
        penumbra={0.97}
        decay={0.4}
        distance={180}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      <spotLight
        ref={spotLight3Ref}
        angle={Math.PI / 0.95}
        penumbra={0.98}
        decay={0.4}
        distance={170}
        target-position={[0, 0, 0]}
      />

      {/* Enhanced dynamic point lights with massive range */}
      <pointLight
        ref={pointLight1Ref}
        decay={0.5}
        distance={150}
      />
      
      <pointLight
        ref={pointLight2Ref}
        decay={0.5}
        distance={140}
      />
        {/* Additional massive atmospheric lights for ENORMOUS diffuse illumination */}
      <pointLight
        position={[-30, 18, -30]}
        intensity={6.0}
        color="#4a90e2"
        decay={0.6}
        distance={180}
      />
      
      <pointLight
        position={[30, 18, 30]}
        intensity={5.5}
        color="#ff6b35"
        decay={0.6}
        distance={175}
      />
      
      <pointLight
        position={[0, 30, -25]}
        intensity={7.0}
        color="#9370db"
        decay={0.5}
        distance={200}
      />
        {/* Enhanced perimeter lights for coverage - optimized for performance */}
      <pointLight
        position={[-45, 15, 0]}
        intensity={4.0} // Reduced intensity
        color="#00ffff"
        decay={0.7}
        distance={120}
      />
      
      <pointLight
        position={[45, 15, 0]}
        intensity={4.0} // Reduced intensity
        color="#ff1493"
        decay={0.7}
        distance={120}
      />
      
      <pointLight
        position={[0, 25, 45]}
        intensity={4.2} // Reduced intensity
        color="#00ff00"
        decay={0.6}
        distance={130}
      />
      
      {/* Corner lights for coverage - reduced count for performance */}
      <pointLight
        position={[-50, 22, -50]}
        intensity={3.8} // Reduced intensity
        color="#ffff00"
        decay={0.8}
        distance={110}
      />
      
      <pointLight
        position={[50, 22, 50]}
        intensity={3.8} // Reduced intensity
        color="#ff8000"
        decay={0.8}
        distance={110}
      />

      {/* Ultra-wide coverage lights for diffusion - reduced count */}
      <pointLight
        position={[0, 35, 0]}
        intensity={5.0} // Reduced intensity
        color="#ffffff"
        decay={0.7}
        distance={180}
      />
      
      <pointLight
        position={[-60, 25, 0]}
        intensity={3.5} // Reduced intensity
        color="#ff00ff"
        decay={0.9}
        distance={90}
      />
      
      <pointLight
        position={[60, 25, 0]}
        intensity={3.5} // Reduced intensity
        color="#00ff88"
        decay={0.9}
        distance={90}
      />
    </group>
  );
});

export default DynamicLighting;
