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
  
  // Calculate handle position directly from value
  const calculatePosition = (val) => {
    const normalized = (val - min) / (max - min);
    return orientation === 'horizontal' 
      ? [normalized * length - length / 2, 0, 0.1]
      : [0, normalized * length - length / 2, 0.1];
  };
  // Update handle position when value changes (but only when not blocked)
  useEffect(() => {
    if (!handleRef.current) return;
    if (!blockPropUpdates.current) {
      const targetPos = calculatePosition(value);
      handleRef.current.position.set(...targetPos);
      currentDragValue.current = value;
      // Update display text directly
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(value);
      }
      hasInitialized.current = true;
    }
  }, [value, min, max, orientation, length, valueFormatter]);
  
  // Initialize display text on first render
  useEffect(() => {
    if (displayTextRef.current && !hasInitialized.current) {
      displayTextRef.current.text = valueFormatter(value);
      hasInitialized.current = true;
    }
  }, [value, valueFormatter]);  const handlePointerDown = (e) => {
    console.log('Slider pointer down:', label);
    e.stopPropagation();
    
    // Block prop updates IMMEDIATELY
    blockPropUpdates.current = true;
    
    dragStartRef.current = {
      pos: orientation === 'horizontal' ? e.clientX : e.clientY,
      value: currentDragValue.current
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
        console.log('Slider moving:', label);
      const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
      const delta = (currentPos - dragStartRef.current.pos) * 0.005 * (max - min);
      const multiplier = orientation === 'horizontal' ? 1 : -1;
      
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta * multiplier,
        min,
        max
      );

      console.log('Slider new value:', newValue);
      
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
      
      // DO NOT call onChange during drag - only update visuals
      // onChange(newValue);
    };    const handleUp = () => {
      console.log('Slider pointer up:', label);
      setIsDragging(false);
      
      // Call onChange with the latest dragged value
      onChange(currentDragValue.current);
        // Re-enable prop updates after a brief delay to prevent race conditions
      setTimeout(() => {
        blockPropUpdates.current = false;
      }, 50);
    };

    if (isDragging) {
      console.log('Adding slider listeners');
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('mouseleave', handleUp);
    }

    return () => {
      if (isDragging) {
        console.log('Removing slider listeners');
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('mouseleave', handleUp);
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
          ? [0, -thickness * 3, 0.1]
          : [thickness * 3, 0, 0.1]
        }
        fontSize={thickness * 1.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {/* Text content updated via ref */}
      </Text>

      <Text
        position={orientation === 'horizontal'
          ? [0, -thickness * 6, 0.1]
          : [thickness * 6, 0, 0.1]
        }
        fontSize={thickness * 1.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

export default Slider;
