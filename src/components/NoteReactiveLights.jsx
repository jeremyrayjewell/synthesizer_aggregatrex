import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NoteReactiveLights = React.memo(({ activeNotes = new Set() }) => {
  const lightRefs = useRef([]);
  const noteLightMap = useRef(new Map());
    // Performance optimization: track last update time
  const lastUpdateRef = useRef(0);
  const updateIntervalRef = useRef(30); // Update every ~30ms instead of every frame
  
  // Initialize light refs
  useEffect(() => {
    lightRefs.current = Array(12).fill(null).map(() => React.createRef());
  }, []);  // Map MIDI notes to colors based on chromatic scale with ultra-vibrant, electric colors
  const noteColors = useMemo(() => [
    new THREE.Color('#ff0066'), // C - Electric Red-Pink
    new THREE.Color('#ff3300'), // C# - Electric Red-Orange  
    new THREE.Color('#ffcc00'), // D - Electric Yellow
    new THREE.Color('#66ff00'), // D# - Electric Yellow-Green
    new THREE.Color('#00ff33'), // E - Electric Green
    new THREE.Color('#00ff99'), // F - Electric Green-Cyan
    new THREE.Color('#00ccff'), // F# - Electric Cyan
    new THREE.Color('#0066ff'), // G - Electric Blue
    new THREE.Color('#3300ff'), // G# - Electric Blue-Purple
    new THREE.Color('#9900ff'), // A - Electric Purple
    new THREE.Color('#ff00cc'), // A# - Electric Purple-Pink
    new THREE.Color('#ff0099'), // B - Electric Pink-Red
  ], []);

  const noteToColor = (note) => {
    const noteIndex = note % 12;
    return noteColors[noteIndex];
  };  // Calculate position for note lights in a MASSIVE circle with enhanced spread
  const getNotePosition = (noteIndex) => {
    const radius = 80; // Even more enormous radius for maximum coverage
    const angle = (noteIndex / 12) * Math.PI * 2;
    return [
      Math.cos(angle) * radius,
      25 + Math.sin(angle * 3) * 12, // Higher and more dramatic height variation
      Math.sin(angle) * radius
    ];
  };
  useFrame((state) => {
    const now = Date.now();
    // Performance optimization: skip update if not enough time has passed
    if (now - lastUpdateRef.current < updateIntervalRef.current) return;
    lastUpdateRef.current = now;
    
    const time = state.clock.elapsedTime;
    
    // Convert activeNotes Set to array once for performance
    const activeNotesArray = Array.from(activeNotes);
    
    // Update each note light
    lightRefs.current.forEach((lightRef, index) => {
      if (!lightRef.current) return;
      
      const noteNumber = index;
      const isActive = activeNotesArray.some(note => note % 12 === noteNumber);      if (isActive) {        // Note is active - bright, dynamic lighting with enhanced pulsing
        lightRef.current.intensity = 6 + Math.sin(time * 3) * 2 + Math.cos(time * 1.5) * 1; // Much brighter and more dynamic
        lightRef.current.color = noteToColor(noteNumber);
        lightRef.current.visible = true;
        
        // Store activation time for decay
        if (!noteLightMap.current.has(noteNumber)) {
          noteLightMap.current.set(noteNumber, time);
        }
      } else {
        // Note is not active - check for recent activation
        const activationTime = noteLightMap.current.get(noteNumber);        if (activationTime && (time - activationTime) < 3) {          // Recent note - enhanced fade out with more intensity
          const fadeTime = time - activationTime;
          const fadeIntensity = Math.max(0, 4 - (fadeTime / 1.5)); // Brighter fade, longer duration
          lightRef.current.intensity = fadeIntensity * (1 + Math.sin(time * 2) * 0.3); // More dynamic fade
          lightRef.current.visible = fadeIntensity > 0.01;
        } else {
          // No recent activity
          lightRef.current.intensity = 0;
          lightRef.current.visible = false;
          noteLightMap.current.delete(noteNumber);
        }
      }
        // Add enhanced movement patterns
      const [x, y, z] = getNotePosition(index);
      lightRef.current.position.set(
        x + Math.sin(time * 0.8 + index) * 2 + Math.cos(time * 0.3 + index) * 1,
        y + Math.cos(time * 1.2 + index) * 1.5 + Math.sin(time * 0.5 + index) * 0.8,
        z + Math.sin(time * 0.6 + index) * 2 + Math.cos(time * 0.9 + index) * 1
      );
    });
  });

  return (
    <group>
      {/* Create 12 point lights for chromatic notes */}
      {lightRefs.current.map((ref, index) => (        <pointLight
          key={index}
          ref={ref}
          decay={0.3}
          distance={300}
          intensity={0}
          color="#ffffff"
        />
      ))}      {/* Enhanced flash light for chord strikes with much higher intensity */}
      {activeNotes.size > 2 && (
        <pointLight
          position={[0, 30, 0]}
          intensity={activeNotes.size * 3 + 5} // Much higher intensity for dramatic effect
          color="#ffffff"
          decay={0.6}
          distance={300}
        />
      )}      {/* Enhanced large ambient color lights for atmosphere - reduced count for performance */}
      {activeNotes.size > 0 && (
        <>
          <pointLight
            position={[-60, 25, 0]}
            intensity={5.5} // Reduced intensity
            color="#ff00ff"
            decay={0.5}
            distance={200}
          />
          <pointLight
            position={[60, 25, 0]}
            intensity={5.5} // Reduced intensity
            color="#00ffff"
            decay={0.5}
            distance={200}
          />
          <pointLight
            position={[0, 22, 60]}
            intensity={5.0} // Reduced intensity
            color="#ffff00"
            decay={0.5}
            distance={190}
          />
          <pointLight
            position={[0, 22, -60]}
            intensity={5.0} // Reduced intensity
            color="#ff8000"
            decay={0.5}
            distance={190}
          />
        </>
      )}</group>
  );
});

export default NoteReactiveLights;
