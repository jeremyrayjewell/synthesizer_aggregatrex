import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const Panel = ({ 
  width = 5, 
  height = 3, 
  depth = 0.2,
  title = '',
  color = '#222222',
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  border = true,
  borderColor = '#444444',
  borderWidth = 0.05,
  useMaterial = true
}) => {  const [hovered, setHovered] = useState(false);
  
  // Always load textures but only use them if useMaterial is true
  const textures = useTexture({
    map: '/textures/leather/brown_leather_albedo_4k.jpg',
    roughnessMap: '/textures/leather/brown_leather_rough_4k.jpg',
    displacementMap: '/textures/leather/brown_leather_disp_4k.png'
  });
  
  // Configure texture settings
  if (useMaterial && textures) {
    textures.map.wrapS = textures.map.wrapT = THREE.RepeatWrapping;
    textures.roughnessMap.wrapS = textures.roughnessMap.wrapT = THREE.RepeatWrapping;
    textures.displacementMap.wrapS = textures.displacementMap.wrapT = THREE.RepeatWrapping;
    
    // Scale textures based on panel size
    const repeatX = width * 0.4;
    const repeatY = height * 0.4;
    textures.map.repeat.set(repeatX, repeatY);
    textures.roughnessMap.repeat.set(repeatX, repeatY);
    textures.displacementMap.repeat.set(repeatX, repeatY);
  }
  
  return (
    <group position={position} rotation={rotation}>
      {/* Panel base */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[width, height, depth]} />        {useMaterial ? (
          <meshStandardMaterial 
            map={textures.map}
            roughnessMap={textures.roughnessMap}
            displacementMap={textures.displacementMap}
            color={color}
            displacementScale={0.01}
            roughness={0.9}
          />
        ) : (
          <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.2}
          />
        )}
      </mesh>
      
      {/* Border frame if enabled */}
      {border && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width + borderWidth, height + borderWidth, depth + borderWidth)]} />
          <lineBasicMaterial color={borderColor} linewidth={2} />
        </lineSegments>
      )}
      
      {/* Panel title if provided */}
      {title && (
        <Text
          position={[0, height/2 - 0.3, depth/2 + 0.01]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          renderOrder={2}
        >
          {title}
        </Text>
      )}
      
      {/* Children components (knobs, sliders, etc.) */}
      <group position={[0, 0, depth/2 + 0.01]}>
        {children}
      </group>
    </group>
  );
};

export default Panel;
