import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const CameraAnimation = ({
  radius = 0.4,
  speed = 0.15,
  verticalFactor = 0.6,
  enabled = true
}) => {
  const { camera } = useThree();
  const originalPosition = useRef(new THREE.Vector3());
  const time = useRef(Math.random() * 100);

  useEffect(() => {
    originalPosition.current.copy(camera.position);
    return () => {
      if (enabled) {
        camera.position.copy(originalPosition.current);
        camera.updateProjectionMatrix();
      }
    };
  }, [camera, enabled]);

  useFrame((_, delta) => {
    if (!enabled) return;
    time.current += delta * speed;
    const x = Math.sin(time.current) * radius;
    const y = Math.sin(time.current * 0.8) * radius * verticalFactor;
    camera.position.x = originalPosition.current.x + x;
    camera.position.y = originalPosition.current.y + y;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });

  return null;
};

export default CameraAnimation;
