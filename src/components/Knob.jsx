import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const Knob = ({
  value = 0,
  min = 0,
  max = 1,
  onChange = () => {},
  size = 1,
  label = 'Knob'
}) => {
  const knobRef = useRef();
  const [isDragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [initialValue, setInitialValue] = useState(value);

  const normalized = (value - min) / (max - min);
  const angle = normalized * Math.PI * 1.5 - Math.PI * 0.75;

  useFrame(() => {
    if (knobRef.current) {
      knobRef.current.rotation.y = angle;
    }
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    setStartY(e.clientY);
    setInitialValue(value);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    const delta = (startY - e.clientY) * 0.01;
    const next = clamp(initialValue + delta * (max - min), min, max);
    onChange(next);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <group
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <mesh ref={knobRef}>
        <cylinderGeometry args={[size * 0.4, size * 0.4, size * 0.2, 32]} />
        <meshStandardMaterial color={isDragging ? '#aaaaff' : '#dddddd'} />
      </mesh>
      <Text
        position={[0, -0.5, 0.6]}
        fontSize={0.15}
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

export default Knob;
