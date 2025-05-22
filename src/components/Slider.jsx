import React, { useRef, useState } from 'react';
import { Text } from '@react-three/drei';

const Slider = ({
  value = 0.5,
  min = 0,
  max = 1,
  onChange = () => {},
  length = 2,
  label = 'Slider'
}) => {
  const handleRef = useRef();
  const [isDragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialValue, setInitialValue] = useState(value);

  const normalized = (value - min) / (max - min);
  const handlePos = normalized * length - length / 2;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setDragging(true);
    setStartX(e.clientX);
    setInitialValue(value);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    const delta = (e.clientX - startX) / 100; // adjust sensitivity
    const next = clamp(initialValue + delta * (max - min), min, max);
    onChange(next);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Track */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[length, 0.05, 0.1]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Handle */}
      <mesh ref={handleRef} position={[handlePos, 0, 0.1]}>
        <boxGeometry args={[0.1, 0.2, 0.2]} />
        <meshStandardMaterial color={isDragging ? '#aaaaff' : '#dddddd'} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, -0.3, 0.1]}
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

export default Slider;
