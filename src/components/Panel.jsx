import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Separate texture loader component to handle Suspense boundary
const TexturedMaterial = ({ color, width, height, textures }) => {
  useEffect(() => {
    if (textures) {
      const setupTexture = (texture) => {
        if (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(width * 0.4, height * 0.4);
        }
      };

      setupTexture(textures.map);
      setupTexture(textures.roughnessMap);
      setupTexture(textures.displacementMap);
    }
  }, [textures, width, height]);

  return (
    <meshStandardMaterial 
      map={textures.map}
      roughnessMap={textures.roughnessMap}
      displacementMap={textures.displacementMap}
      color={color}
      displacementScale={0.01}
      roughness={0.9}
      metalness={0.1}
    />
  );
};

const PanelContent = ({ 
  width, 
  height, 
  depth,
  title,
  color,
  children,
  position,
  rotation,
  border,
  borderColor,
  borderWidth,
  useMaterial 
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  
  // Always call useTexture, even if we don't use the textures
  const textures = useTexture({
    map: '/textures/leather/brown_leather_albedo_4k.jpg',
    roughnessMap: '/textures/leather/brown_leather_rough_4k.jpg',
    displacementMap: '/textures/leather/brown_leather_disp_4k.png'
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Panel base */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <boxGeometry args={[width, height, depth]} />
        {useMaterial ? (
          <TexturedMaterial 
            color={color}
            width={width}
            height={height}
            textures={textures}
          />
        ) : (
          <meshStandardMaterial 
            color={color} 
            roughness={0.7}
            metalness={0.2}
          />
        )}
      </mesh>
      
      {/* Border frame */}
      {border && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(width + borderWidth, height + borderWidth, depth + borderWidth)]} />
          <lineBasicMaterial color={borderColor} linewidth={2} />
        </lineSegments>
      )}
      
      {/* Panel title */}
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
      
      {/* Add a decorative divider line below the title */}
      {title && (
        <mesh position={[0, height/2 - 0.5, depth/2 + 0.01]}>
          <boxGeometry args={[width * 0.8, 0.02, 0.01]} />
          <meshStandardMaterial color={borderColor} emissive={borderColor} emissiveIntensity={0.2} />
        </mesh>
      )}
      
      {/* Child components */}
      <group position={[0, 0, depth/2 + 0.01]}>
        {children}
      </group>
    </group>
  );
};

const Panel = (props) => {
  return (
    <Suspense fallback={null}>
      <PanelContent {...props} />
    </Suspense>
  );
};

export default Panel;
