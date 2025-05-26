import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Knob = ({
  value = 0,
  min = 0,
  max = 1,
  onChange = () => {},
  size = 1,
  label = 'Knob',
  color = '#61dafb',
  valueFormatter = (val) => val.toFixed(2)
}) => {  const knobRef = useRef();
  const displayTextRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, value: 0 });
  const currentDragValue = useRef(value);
  const lastUpdateTime = useRef(0);
  const hasInitialized = useRef(false);
  const blockPropUpdates = useRef(false);
    // Calculate rotation angle from value with a more natural 270-degree rotation range
  const valueToAngle = (val) => {
    // Normalized value between 0 and 1
    const normalized = (val - min) / (max - min);
    // Convert to angle (270 degree rotation range from -135 to +135 degrees)
    return normalized * Math.PI * 1.5 - Math.PI * 0.75;
  };// Update display value and rotation only when not blocked
  useEffect(() => {
    // Only update display values when not actively dragging
    if (!blockPropUpdates.current && knobRef.current) {
      console.log(`${label}: Updating from prop value ${value}`);
      
      // Update stored drag value
      currentDragValue.current = value;
      
      // Update visual rotation
      knobRef.current.rotation.y = valueToAngle(value);
      
      // Update display text directly
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(value);
      }
      
      hasInitialized.current = true;
    } else if (blockPropUpdates.current) {
      console.log(`${label}: Blocked prop update during dragging`);
    }
  }, [value, min, max, valueFormatter, label]);
  
  // Initialize display text on first render
  useEffect(() => {
    if (displayTextRef.current && !hasInitialized.current) {
      // Initial setup
      displayTextRef.current.text = valueFormatter(value);
      
      if (knobRef.current) {
        knobRef.current.rotation.y = valueToAngle(value);
      }
      
      hasInitialized.current = true;
      console.log(`${label}: Initial setup complete`);
    }
  }, [value, valueFormatter, label]);const handlePointerDown = (e) => {
    console.log('Knob pointer down:', label);
    e.stopPropagation();
    // Three.js pointer events don't have preventDefault, so check first
    if (e.preventDefault) {
      e.preventDefault(); // Prevent text selection during drag
    }
    
    // Block prop updates IMMEDIATELY
    blockPropUpdates.current = true;
    
    // Store starting position and current value
    dragStartRef.current = {
      y: e.nativeEvent?.clientY || e.clientY || 0,
      value: currentDragValue.current
    };
    setIsDragging(true);
  };

  useEffect(() => {    const handleMove = (e) => {
      if (!isDragging) return;
      
      // Handle both mouse and touch events
      // Prevent default to stop scrolling during touch drag
      if (e.type === 'touchmove' && e.cancelable !== false) {
        e.preventDefault();
      }
      
      // Throttle updates to avoid overwhelming the system
      const now = Date.now();
      if (now - lastUpdateTime.current < 16) return; // ~60fps
      lastUpdateTime.current = now;
      
      // Safely access client coordinates, checking for touch events too
      const clientY = e.touches?.[0]?.clientY || e.clientY || 0;
      
      // Calculate sensitivity based on value range 
      // More precise control for wider ranges
      const sensitivity = 0.005 * (max - min);
      const delta = (dragStartRef.current.y - clientY) * sensitivity;
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta,
        min,
        max
      );

      // Update visual rotation immediately for smooth feedback
      if (knobRef.current) {
        const newAngle = valueToAngle(newValue);
        knobRef.current.rotation.y = newAngle;
      }
      
      // Update display text directly for smooth visual feedback
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(newValue);
      }
      
      // Store the current drag value
      currentDragValue.current = newValue;
    };
    
    const handleUp = (e) => {
      console.log('Knob pointer up:', label);
      
      // Call onChange with the latest dragged value
      onChange(currentDragValue.current);
      
      // Re-enable prop updates after a longer delay to ensure
      // the component has time to update its internal state
      setTimeout(() => {
        // Only re-enable if it's still the same drag session
        if (isDragging) {
          blockPropUpdates.current = false;
        }
      }, 100);
      
      setIsDragging(false);
    };    if (isDragging) {
      console.log('Adding knob listeners');
      // Using capture phase to ensure we get events before other handlers
      window.addEventListener('mousemove', handleMove, { passive: false, capture: true });
      window.addEventListener('mouseup', handleUp, { capture: true });
      window.addEventListener('mouseleave', handleUp, { capture: true });
      
      // Add touch events for mobile support
      // passive: false is crucial for preventing scrolling while dragging on touch devices
      window.addEventListener('touchmove', handleMove, { passive: false, capture: true });
      window.addEventListener('touchend', handleUp, { passive: false, capture: true });
      window.addEventListener('touchcancel', handleUp, { capture: true });
    }    return () => {
      if (isDragging) {
        console.log('Removing knob listeners');
        window.removeEventListener('mousemove', handleMove, { passive: false, capture: true });
        window.removeEventListener('mouseup', handleUp, { capture: true });
        window.removeEventListener('mouseleave', handleUp, { capture: true });
        
        // Clean up touch events with the same options as when they were added
        window.removeEventListener('touchmove', handleMove, { passive: false, capture: true });
        window.removeEventListener('touchend', handleUp, { passive: false, capture: true });
        window.removeEventListener('touchcancel', handleUp, { capture: true });
      }
    };
  }, [isDragging, min, max, onChange, label, valueFormatter]);
  return (
    <group>
      <mesh
        ref={knobRef}
        onPointerDown={handlePointerDown}
        rotation={[Math.PI / 2, 0, 0]} // Rotate 90 degrees to face viewer
      >        <cylinderGeometry args={[size * 0.3, size * 0.25, size * 0.15, 32]} />
        <meshStandardMaterial 
          color={isDragging ? new THREE.Color(color).addScalar(0.2) : color}
          roughness={0.7}
          metalness={0.3}
        />
          {/* Indicator dot - positioned on the front face */}
        <mesh position={[0, size * 0.22, 0.08]}>
          <sphereGeometry args={[size * 0.05, 12, 12]} />
          <meshStandardMaterial 
            color="white" 
            emissive="white"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      </mesh>      <Text
        position={[0, -size * 0.4, 0]} /* Ultra-minimal spacing */
        fontSize={0.06} /* Absolute font size */
        color="white"
        fontWeight="bold" /* Making it bold */
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text><Text
        ref={displayTextRef}
        position={[0, size * 0.4, 0]} /* Reduced spacing */
        fontSize={0.08} /* Absolute font size */
        color="white"
        fontWeight="bold" /* Making it bold */
        anchorX="center"
        anchorY="middle"
      >
        {/* Text content updated via ref */}
      </Text>
    </group>
  );
};

export default Knob;
