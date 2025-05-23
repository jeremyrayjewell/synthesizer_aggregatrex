import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
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
  valueFormatter = (val) => val.toFixed(2),
  sensitivity = 0.01
}) => {
  const knobRef = useRef();
  const indicatorRef = useRef();
  const [isDragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [initialValue, setInitialValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(valueFormatter(value));
  const [hovered, setHovered] = useState(false);

  // Normalize value to 0-1 range and calculate rotation angle
  const normalized = (value - min) / (max - min);
  const angle = normalized * Math.PI * 1.5 - Math.PI * 0.75;

  // Handle pointer down
  const handlePointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    setStartY(e.clientY);
    setInitialValue(value);
    // Capture pointer to receive events outside of the element
    e.target.setPointerCapture(e.pointerId);
  };

  // Handle pointer move for dragging
  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    // Calculate delta based on vertical mouse movement
    // Adjust sensitivity to make knobs feel more precise
    const delta = (startY - e.clientY) * sensitivity;
    const newValue = clamp(initialValue + delta * (max - min), min, max);
    onChange(newValue);
  };

  // Handle pointer up to end dragging
  const handlePointerUp = (e) => {
    if (isDragging) {
      e.target.releasePointerCapture(e.pointerId);
      setDragging(false);
    }
  };

  // Update knob rotation with smooth animation
  useFrame(() => {
    if (knobRef.current) {
      // Smoothly animate to target angle
      knobRef.current.rotation.y = THREE.MathUtils.lerp(
        knobRef.current.rotation.y,
        angle,
        0.2
      );
    }
    
    // Update indicator position
    if (indicatorRef.current) {
      indicatorRef.current.position.x = Math.sin(angle) * (size * 0.3);
      indicatorRef.current.position.z = Math.cos(angle) * (size * 0.3);
    }
  });

  // Update display value when value changes
  useEffect(() => {
    setDisplayValue(valueFormatter(value));
  }, [value, valueFormatter]);
  
  // Color calculations based on state
  const baseColor = new THREE.Color(color);
  const knobColor = isDragging 
    ? baseColor.clone().addScalar(0.2) 
    : hovered 
      ? baseColor.clone().addScalar(0.1) 
      : baseColor;
  
  return (
    <group position={[0, 0, 0]}>
      {/* Knob base */}
      <mesh 
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[size * 0.4, size * 0.35, size * 0.2, 32]} />
        <meshStandardMaterial 
          color={knobColor} 
          roughness={0.7} 
          metalness={0.3}
        />
        
        {/* Indicator dot */}
        <mesh ref={indicatorRef} position={[0, size * 0.11, size * 0.3]}>
          <sphereGeometry args={[size * 0.05, 8, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </mesh>
      
      {/* Knob label */}
      <Text
        position={[0, -size * 0.4, 0]}
        fontSize={size * 0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      
      {/* Display value */}
      <Text
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default Knob;
