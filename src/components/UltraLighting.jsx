// Ultra-high intensity accent lighting for maximum visual impact - Performance Optimized
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSynthContext } from '../hooks/useSynth';

const UltraLighting = React.memo(({ activeNotes = new Set() }) => {
  const { synthParams } = useSynthContext();
  const ultraLightsRef = useRef([]);
  const strobeRef = useRef();
  const pulseRef = useRef();
  
  // Performance optimization: track last update time and reduce light count
  const lastUpdateRef = useRef(0);
  const updateIntervalRef = useRef(50); // Update every ~50ms instead of every frame
  
  // Initialize ultra-high intensity light refs - reduced count for performance
  React.useEffect(() => {
    ultraLightsRef.current = Array(3).fill(null).map(() => React.createRef());
  }, []);

  // Ultra-bright color palette for maximum impact
  const ultraColors = useMemo(() => [
    new THREE.Color('#ff0040'), // Electric Crimson
    new THREE.Color('#40ff00'), // Electric Lime
    new THREE.Color('#0040ff'), // Electric Royal Blue
    new THREE.Color('#ff4000'), // Electric Orange
    new THREE.Color('#4000ff'), // Electric Indigo
    new THREE.Color('#00ff40'), // Electric Spring Green
  ], []);

  useFrame((state) => {
    const now = Date.now();
    // Performance optimization: skip update if not enough time has passed
    if (now - lastUpdateRef.current < updateIntervalRef.current) return;
    lastUpdateRef.current = now;
    
    const time = state.clock.elapsedTime;
    const masterVolume = synthParams?.master?.volume || 0;
    const hasDistortion = synthParams?.effects?.distortion?.enabled;
    const hasChorus = synthParams?.effects?.chorus?.enabled;
    const hasReverb = synthParams?.effects?.reverb?.enabled;
    
    // Reduced base intensity for better performance
    let baseIntensity = masterVolume * 4; // Reduced from 8
    if (hasDistortion) baseIntensity *= 1.4; // Reduced multipliers
    if (hasChorus) baseIntensity *= 1.2;
    if (hasReverb) baseIntensity *= 1.1;
    
    // Update ultra-high intensity accent lights with performance optimization
    ultraLightsRef.current.forEach((lightRef, index) => {
      if (!lightRef.current) return;
      
      const offset = index * Math.PI * 2 / 3; // Adjusted for 3 lights
      
      // Only activate ultra lights when there are active notes or high effects
      const shouldActivate = activeNotes.size > 0 || baseIntensity > 2;
      
      if (shouldActivate) {
        const colorIndex = Math.floor((time * 0.5 + index) % ultraColors.length);
        lightRef.current.color = ultraColors[colorIndex];
        lightRef.current.intensity = baseIntensity * (2 + Math.sin(time * 3 + offset) * 1); // Reduced intensity
        lightRef.current.visible = true;
        
        // Simplified movement pattern for better performance
        const radius = 25;
        lightRef.current.position.set(
          Math.cos(time * 0.6 + offset) * radius,
          15 + Math.sin(time * 0.8 + offset) * 8,
          Math.sin(time * 0.6 + offset) * radius
        );
      } else {
        lightRef.current.intensity = 0;
        lightRef.current.visible = false;
      }
    });
    
    // Optimized strobe effect for high-energy moments
    if (strobeRef.current) {
      const shouldStrobe = activeNotes.size > 3 && hasDistortion && masterVolume > 0.7;
      if (shouldStrobe) {
        const strobePattern = Math.sin(time * 10) > 0.7 ? 8 : 0; // Reduced intensity
        strobeRef.current.intensity = strobePattern;
        strobeRef.current.color = ultraColors[Math.floor(time * 2) % ultraColors.length];
        strobeRef.current.visible = true;
      } else {
        strobeRef.current.intensity = 0;
        strobeRef.current.visible = false;
      }
    }
    
    // Optimized pulse effect
    if (pulseRef.current) {
      if (activeNotes.size > 0) {
        const pulseIntensity = masterVolume * 6 * (1 + Math.sin(time * 4) * 0.5); // Reduced intensity
        pulseRef.current.intensity = Math.max(0, pulseIntensity);
        pulseRef.current.color = ultraColors[Math.floor(time * 1.5) % ultraColors.length];
        pulseRef.current.visible = true;
      } else {
        pulseRef.current.intensity = 0;
        pulseRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {/* Ultra-high intensity accent lights - reduced count for performance */}
      {ultraLightsRef.current.map((ref, index) => (
        <pointLight
          key={`ultra-${index}`}
          ref={ref}
          decay={0.4}
          distance={200}
          intensity={0}
          color="#ffffff"
        />
      ))}
      
      {/* Optimized strobe light for dramatic moments */}
      <pointLight
        ref={strobeRef}
        position={[0, 30, 0]}
        intensity={0}
        color="#ffffff"
        decay={0.3}
        distance={250}
      />
      
      {/* Optimized central pulse light */}
      <pointLight
        ref={pulseRef}
        position={[0, 25, 0]}
        intensity={0}
        color="#ffffff"
        decay={0.5}
        distance={180}
      />
      
      {/* Conditional wide coverage lights - only when there are many active notes */}
      {activeNotes.size > 2 && (
        <>
          <pointLight
            position={[-60, 40, 60]}
            intensity={8}
            color="#ff0080"
            decay={0.3}
            distance={300}
          />
          <pointLight
            position={[60, 40, -60]}
            intensity={8}
            color="#80ff00"
            decay={0.3}
            distance={300}
          />
        </>
      )}
    </group>
  );
});

export default UltraLighting;
