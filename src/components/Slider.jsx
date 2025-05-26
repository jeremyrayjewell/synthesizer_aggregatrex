import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Slider = ({
  value = 0.5,
  min = 0,
  max = 1,
  onChange = () => {},
  length = 2,
  label = 'Slider',
  color = '#61dafb',
  valueFormatter = (val) => val.toFixed(2),
  thickness = 0.1,
  orientation = 'horizontal'
}) => {  const handleRef = useRef();
  const displayTextRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pos: 0, value: 0 });
  const currentDragValue = useRef(value);
  const hasInitialized = useRef(false);
  const blockPropUpdates = useRef(false);
  const lastUpdateTime = useRef(0);
  
  // Calculate handle position directly from value
  const calculatePosition = (val) => {
    const normalized = (val - min) / (max - min);
    return orientation === 'horizontal' 
      ? [normalized * length - length / 2, 0, 0.1]
      : [0, normalized * length - length / 2, 0.1];
  };  // Update handle position when value changes (but only when not blocked)
  useEffect(() => {
    // Only update display values when not actively dragging
    if (!blockPropUpdates.current && handleRef.current) {
      console.log(`${label}: Updating slider from prop value ${value}`);
      
      // Update handle position
      const targetPos = calculatePosition(value);
      handleRef.current.position.set(...targetPos);
      
      // Update stored drag value
      currentDragValue.current = value;
      
      // Update display text directly
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(value);
      }
      
      hasInitialized.current = true;
    } else if (blockPropUpdates.current) {
      console.log(`${label}: Blocked slider prop update during dragging`);
    }
  }, [value, min, max, orientation, length, valueFormatter, label]);
  
  // Initialize display text on first render
  useEffect(() => {
    if (displayTextRef.current && !hasInitialized.current) {
      // Initial setup
      displayTextRef.current.text = valueFormatter(value);
      
      if (handleRef.current) {
        const initialPos = calculatePosition(value);
        handleRef.current.position.set(...initialPos);
      }
      
      hasInitialized.current = true;
      console.log(`${label}: Initial slider setup complete`);
    }
  }, [value, valueFormatter, label, calculatePosition]);const handlePointerDown = (e) => {
    console.log('Slider pointer down:', label);
    e.stopPropagation();
    // Three.js pointer events don't have preventDefault, so check first
    if (e.preventDefault) {
      e.preventDefault(); // Prevent text selection during drag
    }
    
    // Block prop updates IMMEDIATELY
    blockPropUpdates.current = true;
    
    // Access client coordinates safely, checking for nativeEvent first
    const clientX = e.nativeEvent?.clientX || e.clientX || 0;
    const clientY = e.nativeEvent?.clientY || e.clientY || 0;
    
    // Store starting position based on orientation
    dragStartRef.current = {
      pos: orientation === 'horizontal' ? clientX : clientY,
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
      
      // Throttle updates for better performance
      const now = Date.now();
      if (now - (lastUpdateTime.current || 0) < 16) return; // ~60fps
      lastUpdateTime.current = now;
      
      // Safely access client coordinates
      const clientX = e.touches?.[0]?.clientX || e.clientX || dragStartRef.current.pos;
      const clientY = e.touches?.[0]?.clientY || e.clientY || dragStartRef.current.pos;
      
      // Get current pointer position based on orientation
      const currentPos = orientation === 'horizontal' ? clientX : clientY;
      
      // Calculate sensitivity based on value range for consistent feel
      const sensitivity = 0.005 * (max - min);
      const delta = (currentPos - dragStartRef.current.pos) * sensitivity;
      const multiplier = orientation === 'horizontal' ? 1 : -1;
      
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta * multiplier,
        min,
        max
      );
      
      // Update visual position immediately for smooth feedback
      if (handleRef.current) {
        const newPos = calculatePosition(newValue);
        handleRef.current.position.set(...newPos);
      }
      
      // Update display text directly for smooth visual feedback
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(newValue);
      }
      
      // Store the current drag value
      currentDragValue.current = newValue;
    };
    
    const handleUp = () => {
      console.log('Slider pointer up:', label);
      
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
      console.log('Adding slider listeners');
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
        console.log('Removing slider listeners');
        window.removeEventListener('mousemove', handleMove, { passive: false, capture: true });
        window.removeEventListener('mouseup', handleUp, { capture: true });
        window.removeEventListener('mouseleave', handleUp, { capture: true });
        
        // Clean up touch events with the same options as when they were added
        window.removeEventListener('touchmove', handleMove, { passive: false, capture: true });
        window.removeEventListener('touchend', handleUp, { passive: false, capture: true });
        window.removeEventListener('touchcancel', handleUp, { capture: true });
      }
    };
  }, [isDragging, min, max, onChange, valueFormatter, orientation, label, length]);

  return (
    <group>
      {/* Track */}
      <mesh>
        <boxGeometry 
          args={orientation === 'horizontal' 
            ? [length, thickness, thickness/2]
            : [thickness, length, thickness/2]
          }
        />
        <meshStandardMaterial 
          color={new THREE.Color(color).multiplyScalar(0.5)}
          roughness={0.7}
        />
      </mesh>

      {/* Handle */}
      <mesh
        ref={handleRef}
        position={calculatePosition(value)}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry 
          args={orientation === 'horizontal'
            ? [thickness * 1.5, thickness * 2, thickness]
            : [thickness * 2, thickness * 1.5, thickness]
          } 
        />
        <meshStandardMaterial 
          color={isDragging ? new THREE.Color(color).addScalar(0.2) : color}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>      <Text
        ref={displayTextRef}
        position={orientation === 'horizontal'
          ? [0, -thickness * 2.5, 0.1] /* Reduced spacing */
          : [thickness * 2.5, 0, 0.1] /* Reduced spacing */
        }
        fontSize={thickness * 1.1} /* Bigger font */
        color="white"
        fontWeight="bold" /* Making it bold */
        anchorX="center"
        anchorY="middle"
      >
        {/* Text content updated via ref */}
      </Text>

      <Text
        position={orientation === 'horizontal'
          ? [0, -thickness * 5, 0.1] /* Reduced spacing */
          : [thickness * 5, 0, 0.1] /* Reduced spacing */
        }
        fontSize={thickness * 1.1} /* Bigger font */
        color="white"
        fontWeight="bold" /* Making it bold */
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

export default Slider;
