import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const WaveformSelector = ({ 
  value = 'sawtooth', 
  onChange = () => {}, 
  options = ['sine', 'square', 'sawtooth', 'triangle'],
  size = 0.5,
  color = '#61dafb',
  position = [0, 0, 0],
  label = 'WAVEFORM'
}) => {
  const currentIndex = options.indexOf(value);
  
  const handleClick = (event) => {
    event.stopPropagation();
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex];
    onChange(nextValue);
  };

  const getWaveformDisplay = (waveform) => {
    switch (waveform) {
      case 'sine': return 'SIN';
      case 'square': return 'SQR';
      case 'sawtooth': return 'SAW';
      case 'triangle': return 'TRI';
      default: return waveform.toUpperCase().substring(0, 3);
    }
  };

  return (
    <group position={position}>
      {/* Button background */}
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
        <boxGeometry args={[size * 1.5, size * 0.6, size * 0.2]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Waveform text */}
      <Text
        position={[0, 0, size * 0.11]}
        fontSize={size * 0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/textures/fonts/bold.ttf"
      >
        {getWaveformDisplay(value)}
      </Text>
      
      {/* Label */}
      <Text
        position={[0, -size * 0.8, 0]}
        fontSize={size * 0.15}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

export default WaveformSelector;
