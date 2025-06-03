import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const ToggleSwitch = ({ 
  value = false, 
  onChange = () => {}, 
  size = 0.5,
  onColor = '#4caf50',
  offColor = '#666666',
  position = [0, 0, 0],
  label = 'TOGGLE'
}) => {
  const handleClick = (event) => {
    event.stopPropagation();
    onChange(!value);
  };

  return (
    <group position={position}>
      {/* Switch background */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[size * 1.2, size * 0.6, size * 0.15]} />
        <meshStandardMaterial 
          color={value ? onColor : offColor} 
          roughness={0.3}
          emissive={value ? onColor : offColor}
          emissiveIntensity={value ? 0.2 : 0.05}
        />
      </mesh>
      
      {/* Switch indicator */}
      <mesh position={[value ? size * 0.25 : -size * 0.25, 0, size * 0.08]}>
        <cylinderGeometry args={[size * 0.15, size * 0.15, size * 0.1, 16]} />
        <meshStandardMaterial 
          color="white" 
          roughness={0.2}
        />      </mesh>
    </group>
  );
};

export default ToggleSwitch;
