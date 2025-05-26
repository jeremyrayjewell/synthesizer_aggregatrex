import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CameraAnimation component adds subtle circular movement to the camera
 * to enhance the 3D visualization effect
 * 
 * @param {Object} props - Component properties
 * @param {number} [props.radius=0.4] - Radius of the circular motion
 * @param {number} [props.speed=0.15] - Speed of the animation (lower is slower)
 * @param {number} [props.verticalFactor=0.6] - Factor for vertical movement (relative to horizontal)
 * @param {boolean} [props.enabled=true] - Whether the animation is enabled
 */
const CameraAnimation = ({
  radius = 0.4,
  speed = 0.15,
  verticalFactor = 0.6,
  enabled = true
}) => {
  const { camera } = useThree();
  
  // Store original camera position
  const originalPosition = useRef(new THREE.Vector3());
  const time = useRef(Math.random() * 100); // Random start phase
  
  // Save the original camera position on mount
  useEffect(() => {
    originalPosition.current.copy(camera.position);
    
    // Clean up function to reset camera position when unmounted
    return () => {
      if (enabled) {
        camera.position.copy(originalPosition.current);
        camera.updateProjectionMatrix();
      }
    };
  }, [camera, enabled]);
  
  useFrame((_, delta) => {
    if (!enabled) return;
    
    // Increment time reference for animation
    time.current += delta * speed;
    
    // Calculate circular path
    const x = Math.sin(time.current) * radius;
    const y = Math.sin(time.current * 0.8) * radius * verticalFactor; // Slightly different frequency for vertical
    
    // Update camera position relative to its original position
    camera.position.x = originalPosition.current.x + x;
    camera.position.y = originalPosition.current.y + y;
    
    // Ensure the camera is looking at the center of the scene
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  });
  
  // This component doesn't render anything visible
  return null;
};

export default CameraAnimation;
