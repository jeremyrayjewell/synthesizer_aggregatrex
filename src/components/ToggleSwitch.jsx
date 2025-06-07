import React, { useMemo, useCallback } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COMMON_SPACING } from '../constants/spacing';

const ToggleSwitch = React.memo(({ 
  value = false, 
  onChange = () => {}, 
  size = COMMON_SPACING.MEDIUM_TOGGLE_SIZE,
  onColor = '#4caf50',
  offColor = '#666666',
  position = [0, 0, 0],
  label = 'TOGGLE'
}) => {
  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onChange(!value);
  }, [onChange, value]);

  const backgroundColor = useMemo(() => new THREE.Color(value ? onColor : offColor), [value, onColor, offColor]);
  const emissiveColor = useMemo(() => new THREE.Color(value ? onColor : offColor), [value, onColor, offColor]);

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
        <boxGeometry args={[size * 1.2, size * 0.6, size * 0.15]} />        <meshStandardMaterial 
          color={backgroundColor} 
          roughness={0.1}
          metalness={0.9}
          emissive={emissiveColor}
          emissiveIntensity={value ? 0.3 : 0.05}
          envMapIntensity={2.5}
        />
      </mesh>
      
      {/* Switch indicator */}
      <mesh position={[value ? size * 0.25 : -size * 0.25, 0, size * 0.08]}>
        <cylinderGeometry args={[size * 0.15, size * 0.15, size * 0.1, 16]} />        <meshStandardMaterial 
          color="white" 
          roughness={0.1}
          metalness={0.8}
          envMapIntensity={2.0}
        /></mesh>    </group>
  );
});

export default ToggleSwitch;
