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
  orientation = 'horizontal' // 'horizontal' or 'vertical'
}) => {
  const trackRef = useRef();
  const handleRef = useRef();
  const [isDragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);
  const [initialValue, setInitialValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(valueFormatter(value));
  const [hovered, setHovered] = useState(false);

  // Normalize value to 0-1 range and calculate handle position
  const normalized = (value - min) / (max - min);
  
  // Position calculation depends on orientation
  const handlePos = orientation === 'horizontal' 
    ? [normalized * length - length / 2, 0, 0.1]
    : [0, normalized * length - length / 2, 0.1];
  
  const trackDimensions = orientation === 'horizontal'
    ? [length, thickness, thickness/2]
    : [thickness, length, thickness/2];
    
  const handleDimensions = orientation === 'horizontal'
    ? [thickness * 1.5, thickness * 2, thickness]
    : [thickness * 2, thickness * 1.5, thickness];

  // Update display value when value changes
  useEffect(() => {
    setDisplayValue(valueFormatter(value));
  }, [value, valueFormatter]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    setStartPos(orientation === 'horizontal' ? e.clientX : e.clientY);
    setInitialValue(value);
    // Capture pointer to receive events outside of the element
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    
    // Calculate delta based on mouse movement
    const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
    const movementMultiplier = orientation === 'horizontal' ? 1 : -1; // Invert for vertical
    const delta = (currentPos - startPos) / 200 * movementMultiplier; // adjust sensitivity
    
    const next = clamp(initialValue + delta * (max - min), min, max);
    onChange(next);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      e.target.releasePointerCapture(e.pointerId);
      setDragging(false);
    }
  };
  
  // Color calculations based on state
  const baseColor = new THREE.Color(color);
  const sliderColor = isDragging 
    ? baseColor.clone().addScalar(0.2) 
    : hovered 
      ? baseColor.clone().addScalar(0.1) 
      : baseColor;
  
  // Value label position
  const valueLabelPos = orientation === 'horizontal'
    ? [0, -thickness * 3, 0.1]
    : [thickness * 3, 0, 0.1];
    
  // Title label position
  const titleLabelPos = orientation === 'horizontal'
    ? [0, -thickness * 6, 0.1]
    : [thickness * 6, 0, 0.1];

  return (
    <group>
      {/* Track */}
      <mesh 
        ref={trackRef}
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={trackDimensions} />
        <meshStandardMaterial color="#444" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Filled track portion */}
      <mesh
        position={orientation === 'horizontal' 
          ? [(normalized * length - length) / 2, 0, 0.05] 
          : [0, (normalized * length - length) / 2, 0.05]}
        scale={orientation === 'horizontal' 
          ? [normalized, 1, 1] 
          : [1, normalized, 1]}
      >
        <boxGeometry args={trackDimensions} />
        <meshStandardMaterial color={sliderColor} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Handle */}
      <mesh 
        ref={handleRef} 
        position={handlePos}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
      >
        <boxGeometry args={handleDimensions} />
        <meshStandardMaterial 
          color={isDragging ? '#ffffff' : '#dddddd'} 
          roughness={0.5} 
          metalness={0.3}
        />
      </mesh>

      {/* Value display */}
      <Text
        position={valueLabelPos}
        fontSize={thickness * 1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {displayValue}
      </Text>

      {/* Label */}
      <Text
        position={titleLabelPos}
        fontSize={thickness * 1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default Slider;
