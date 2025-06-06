import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NoteReactiveLights = React.memo(({ activeNotes = new Set() }) => {
  const lightRefs = useRef([]);
  const noteLightMap = useRef(new Map());
  
  // Performance optimization: track last update time
  const lastUpdateRef = useRef(0);
  const updateIntervalRef = useRef(16); // Update every ~16ms instead of every frame
  
  // Initialize light refs
  useEffect(() => {
    lightRefs.current = Array(12).fill(null).map(() => React.createRef());
  }, []);  // Map MIDI notes to colors based on chromatic scale with more vibrant colors
  const noteColors = useMemo(() => [
    new THREE.Color('#ff0066'), // C - Bright Red-Pink
    new THREE.Color('#ff3300'), // C# - Red-Orange
    new THREE.Color('#ffcc00'), // D - Bright Yellow
    new THREE.Color('#66ff00'), // D# - Yellow-Green
    new THREE.Color('#00ff33'), // E - Bright Green
    new THREE.Color('#00ff99'), // F - Green-Cyan
    new THREE.Color('#00ccff'), // F# - Bright Cyan
    new THREE.Color('#0066ff'), // G - Bright Blue
    new THREE.Color('#3300ff'), // G# - Blue-Purple
    new THREE.Color('#9900ff'), // A - Purple
    new THREE.Color('#ff00cc'), // A# - Purple-Pink
    new THREE.Color('#ff0099'), // B - Pink-Red
  ], []);

  const noteToColor = (note) => {
    const noteIndex = note % 12;
    return noteColors[noteIndex];
  };// Calculate position for note lights in a MASSIVE circle
  const getNotePosition = (noteIndex) => {
    const radius = 60; // Enormous radius for huge coverage
    const angle = (noteIndex / 12) * Math.PI * 2;
    return [
      Math.cos(angle) * radius,
      20 + Math.sin(angle * 2) * 8, // Very high and dramatic height variation
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
      const isActive = activeNotesArray.some(note => note % 12 === noteNumber);      if (isActive) {        // Note is active - smooth, stable lighting without aggressive pulsing
        lightRef.current.intensity = 3 + Math.sin(time * 2) * 0.5; // Much smoother pulsing
        lightRef.current.color = noteToColor(noteNumber);
        lightRef.current.visible = true;
        
        // Store activation time for decay
        if (!noteLightMap.current.has(noteNumber)) {
          noteLightMap.current.set(noteNumber, time);
        }
      } else {
        // Note is not active - check for recent activation
        const activationTime = noteLightMap.current.get(noteNumber);
        if (activationTime && (time - activationTime) < 2) {          // Recent note - very smooth fade out
          const fadeTime = time - activationTime;
          const fadeIntensity = Math.max(0, 1.5 - (fadeTime / 2));
          lightRef.current.intensity = fadeIntensity * (1 + Math.sin(time * 1) * 0.1); // Very gentle fade
          lightRef.current.visible = fadeIntensity > 0.01;
        } else {
          // No recent activity
          lightRef.current.intensity = 0;
          lightRef.current.visible = false;
          noteLightMap.current.delete(noteNumber);
        }
      }
      
      // Add subtle movement
      const [x, y, z] = getNotePosition(index);
      lightRef.current.position.set(
        x + Math.sin(time * 0.5 + index) * 0.5,
        y + Math.cos(time * 0.7 + index) * 0.3,
        z + Math.sin(time * 0.3 + index) * 0.5
      );
    });
  });

  return (
    <group>
      {/* Create 12 point lights for chromatic notes */}
      {lightRefs.current.map((ref, index) => (        <pointLight
          key={index}
          ref={ref}
          decay={0.5}
          distance={200}
          intensity={0}
          color="#ffffff"
        />
      ))}      {/* Additional flash light for chord strikes - reduced intensity for stability */}
      {activeNotes.size > 2 && (
        <pointLight
          position={[0, 25, 0]}
          intensity={activeNotes.size * 1.5 + 2} // Much more moderate intensity
          color="#ffffff"
          decay={0.8}
          distance={200}
        />
      )}        {/* Additional large ambient color lights for atmosphere - reduced intensity for stability */}
      {activeNotes.size > 0 && (
        <>
          <pointLight
            position={[-50, 20, 0]}
            intensity={2.5} // Reduced from 5.5
            color="#ff00ff"
            decay={0.8}
            distance={160}
          />
          <pointLight
            position={[50, 20, 0]}
            intensity={2.5} // Reduced from 5.5
            color="#00ffff"
            decay={0.8}
            distance={160}
          />
          <pointLight
            position={[0, 18, 50]}
            intensity={2.2} // Reduced from 5.2
            color="#ffff00"
            decay={0.8}
            distance={150}
          />
          <pointLight
            position={[0, 18, -50]}
            intensity={2.2} // Reduced from 5.2
            color="#ff8000"
            decay={0.8}
            distance={150}
          />
          <pointLight
            position={[-40, 25, -40]}
            intensity={2.0} // Reduced from 4.8
            color="#00ff00"
            decay={0.8}
            distance={150}
          />          <pointLight
            position={[40, 25, 40]}
            intensity={2.0} // Reduced from 4.8
            color="#8000ff"
            decay={0.9}
            distance={130}
          />
        </>
      )}    </group>
  );
});

export default NoteReactiveLights;
