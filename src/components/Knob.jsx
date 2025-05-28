import React, { useRef, useState, useEffect } from 'react';
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
  valueFormatter = (val) => val.toFixed(2)
}) => {
  const knobRef = useRef();
  const displayTextRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ y: 0, value: 0 });
  const currentDragValue = useRef(value);
  const lastUpdateTime = useRef(0);
  const hasInitialized = useRef(false);
  const blockPropUpdates = useRef(false);

  const valueToAngle = (val) => {
    const normalized = (val - min) / (max - min);
    return normalized * Math.PI * 1.5 - Math.PI * 0.75;
  };

  useEffect(() => {
    if (!blockPropUpdates.current && knobRef.current) {
      currentDragValue.current = value;
      knobRef.current.rotation.y = valueToAngle(value);
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(value);
      }
      hasInitialized.current = true;
    }
  }, [value, min, max, valueFormatter, label]);

  useEffect(() => {
    if (displayTextRef.current && !hasInitialized.current) {
      displayTextRef.current.text = valueFormatter(value);
      if (knobRef.current) {
        knobRef.current.rotation.y = valueToAngle(value);
      }
      hasInitialized.current = true;
    }
  }, [value, valueFormatter, label]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    blockPropUpdates.current = true;
    dragStartRef.current = {
      y: e.nativeEvent?.clientY || e.clientY || 0,
      value: currentDragValue.current
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      if (e.type === 'touchmove' && e.cancelable !== false) {
        e.preventDefault();
      }
      const now = Date.now();
      if (now - lastUpdateTime.current < 16) return;
      lastUpdateTime.current = now;
      const clientY = e.touches?.[0]?.clientY || e.clientY || 0;
      const sensitivity = 0.005 * (max - min);
      const delta = (dragStartRef.current.y - clientY) * sensitivity;
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta,
        min,
        max
      );
      if (knobRef.current) {
        const newAngle = valueToAngle(newValue);
        knobRef.current.rotation.y = newAngle;
      }
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(newValue);
      }
      currentDragValue.current = newValue;
    };

    const handleUp = () => {
      onChange(currentDragValue.current);
      setTimeout(() => {
        if (isDragging) {
          blockPropUpdates.current = false;
        }
      }, 100);
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false, capture: true });
      window.addEventListener('mouseup', handleUp, { capture: true });
      window.addEventListener('mouseleave', handleUp, { capture: true });
      window.addEventListener('touchmove', handleMove, { passive: false, capture: true });
      window.addEventListener('touchend', handleUp, { passive: false, capture: true });
      window.addEventListener('touchcancel', handleUp, { capture: true });
    }

    return () => {
      if (isDragging) {
        window.removeEventListener('mousemove', handleMove, { passive: false, capture: true });
        window.removeEventListener('mouseup', handleUp, { capture: true });
        window.removeEventListener('mouseleave', handleUp, { capture: true });
        window.removeEventListener('touchmove', handleMove, { passive: false, capture: true });
        window.removeEventListener('touchend', handleUp, { passive: false, capture: true });
        window.removeEventListener('touchcancel', handleUp, { capture: true });
      }
    };
  }, [isDragging, min, max, onChange, label, valueFormatter]);

  return (
    <group>
      <mesh
        ref={knobRef}
        onPointerDown={handlePointerDown}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[size * 0.3, size * 0.25, size * 0.15, 32]} />
        <meshStandardMaterial
          color={isDragging ? new THREE.Color(color).addScalar(0.2) : color}
          roughness={0.7}
          metalness={0.3}
        />
        <mesh position={[0, size * 0.22, 0.08]}>
          <sphereGeometry args={[size * 0.05, 12, 12]} />
          <meshStandardMaterial
            color="white"
            emissive="white"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      </mesh>
      <Text
        position={[0, -size * 0.4, 0]}
        fontSize={0.06}
        color="white"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        ref={displayTextRef}
        position={[0, size * 0.4, 0]}
        fontSize={0.08}
        color="white"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      />
    </group>
  );
};

export default Knob;
