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
  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(valueFormatter(value));
  const [currentValue, setCurrentValue] = useState(value);
  const dragStartRef = useRef({ y: 0, value: 0 });
  const latestValueRef = useRef(value);
  const lastUpdateTime = useRef(0);
  const shouldAcceptPropUpdates = useRef(true);
  
  // Calculate rotation angle from value
  const valueToAngle = (val) => (val - min) / (max - min) * Math.PI * 1.5 - Math.PI * 0.75;

  // Update display value and rotation only when we should accept prop updates
  useEffect(() => {
    if (shouldAcceptPropUpdates.current && knobRef.current) {
      setCurrentValue(value);
      setDisplayValue(valueFormatter(value));
      latestValueRef.current = value;
      knobRef.current.rotation.y = valueToAngle(value);
    }
  }, [value, min, max, valueFormatter]);  const handlePointerDown = (e) => {
    console.log('Knob pointer down:', label);
    e.stopPropagation();
    
    // Block prop updates during drag
    shouldAcceptPropUpdates.current = false;
    
    dragStartRef.current = {
      y: e.clientY,
      value: latestValueRef.current
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
      const delta = (dragStartRef.current.y - e.clientY) * 0.01;
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta,
        min,
        max
      );      console.log('Knob new value:', newValue);
        // Update visual rotation immediately for smooth feedback
      if (knobRef.current) {
        const newAngle = valueToAngle(newValue);
        knobRef.current.rotation.y = newAngle;
      }
        // Update current value and display immediately for smooth visual feedback
      setCurrentValue(newValue);
      setDisplayValue(valueFormatter(newValue));
      latestValueRef.current = newValue;
        // DO NOT call onChange during drag - only update visuals
      // onChange(newValue);
    };    const handleUp = (e) => {
      console.log('Knob pointer up:', label);
      setIsDragging(false);
      
      // Call onChange with the latest dragged value
      onChange(latestValueRef.current);
      
      // Re-enable prop updates after a brief delay to prevent race conditions
      setTimeout(() => {
        shouldAcceptPropUpdates.current = true;
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
    };  }, [isDragging, min, max, onChange, label, valueFormatter]);

  return (
    <group>
      <mesh
        ref={knobRef}
        onPointerDown={handlePointerDown}
      >
        <cylinderGeometry args={[size * 0.4, size * 0.35, size * 0.2, 32]} />
        <meshStandardMaterial 
          color={isDragging ? new THREE.Color(color).addScalar(0.2) : color}
          roughness={0.7}
          metalness={0.3}
        />
        
        {/* Indicator dot */}
        <mesh position={[0, 0.11, size * 0.3]}>
          <sphereGeometry args={[size * 0.05, 8, 8]} />
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
        position={[0, size * 0.4, 0]}
        fontSize={size * 0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {displayValue}
      </Text>
    </group>
  );
};

export default Knob;
