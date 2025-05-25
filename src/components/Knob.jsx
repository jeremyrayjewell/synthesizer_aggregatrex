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
  
  // Calculate rotation angle from value
  const valueToAngle = (val) => (val - min) / (max - min) * Math.PI * 1.5 - Math.PI * 0.75;  // Update display value and rotation only when not blocked
  useEffect(() => {
    if (!blockPropUpdates.current && knobRef.current) {
      currentDragValue.current = value;
      knobRef.current.rotation.y = valueToAngle(value);
      // Update display text directly
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(value);
      }
      hasInitialized.current = true;
    }
  }, [value, min, max, valueFormatter]);
  
  // Initialize display text on first render
  useEffect(() => {
    if (displayTextRef.current && !hasInitialized.current) {
      displayTextRef.current.text = valueFormatter(value);
      hasInitialized.current = true;
    }
  }, [value, valueFormatter]);
  const handlePointerDown = (e) => {
    console.log('Knob pointer down:', label);
    e.stopPropagation();
    
    // Block prop updates IMMEDIATELY
    blockPropUpdates.current = true;
    
    dragStartRef.current = {
      y: e.clientY,
      value: currentDragValue.current
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      
      // Throttle updates to avoid overwhelming the system
      const now = Date.now();
      if (now - lastUpdateTime.current < 16) return; // ~60fps
      lastUpdateTime.current = now;
      
      console.log('Knob moving:', label);
      const delta = (dragStartRef.current.y - e.clientY) * 0.005 * (max - min);
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta,
        min,
        max
      );

      console.log('Knob new value:', newValue);        // Update visual rotation immediately for smooth feedback
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
    };    const handleUp = (e) => {
      console.log('Knob pointer up:', label);
      setIsDragging(false);
      
      // Call onChange with the latest dragged value
      onChange(currentDragValue.current);
      
      // Re-enable prop updates after a brief delay to prevent race conditions
      setTimeout(() => {
        blockPropUpdates.current = false;
      }, 50);
    };

    if (isDragging) {
      console.log('Adding knob listeners');
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('mouseleave', handleUp);
    }

    return () => {
      if (isDragging) {
        console.log('Removing knob listeners');
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('mouseleave', handleUp);
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
          <sphereGeometry args={[size * 0.04, 8, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </mesh>

      <Text
        position={[0, -size * 0.4, 0]}
        fontSize={size * 0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>      <Text
        ref={displayTextRef}
        position={[0, size * 0.4, 0]}
        fontSize={size * 0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {/* Text content updated via ref */}
      </Text>
    </group>
  );
};

export default Knob;
