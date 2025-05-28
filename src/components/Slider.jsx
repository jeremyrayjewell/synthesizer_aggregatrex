import React, { useRef, useState, useEffect } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const Slider = ({
  value = 0.5,
  min = 0,
  max = 1,
  onChange = () => {},
  length = 2,
  label = 'Slider',
  color = '#61dafb',
  valueFormatter = (val) => val.toFixed(2),
  thickness = 0.1,
  orientation = 'horizontal',
  labelOffset = 0,
  valueOffset = 0
}) => {
  const handleRef = useRef();
  const displayTextRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ pos: 0, value: 0 });
  const currentDragValue = useRef(value);
  const hasInitialized = useRef(false);
  const blockPropUpdates = useRef(false);
  const lastUpdateTime = useRef(0);

  const calculatePosition = (val) => {
    const normalized = (val - min) / (max - min);
    return orientation === 'horizontal'
      ? [normalized * length - length / 2, 0, 0.1]
      : [0, normalized * length - length / 2, 0.1];
  };

  useEffect(() => {
    if (!blockPropUpdates.current && handleRef.current) {
      const targetPos = calculatePosition(value);
      handleRef.current.position.set(...targetPos);
      currentDragValue.current = value;
      if (displayTextRef.current) {
        displayTextRef.current.text = valueFormatter(value);
      }
      hasInitialized.current = true;
    }
  }, [value, min, max, orientation, length, valueFormatter, label]);

  useEffect(() => {
    if (displayTextRef.current && !hasInitialized.current) {
      displayTextRef.current.text = valueFormatter(value);
      if (handleRef.current) {
        const initialPos = calculatePosition(value);
        handleRef.current.position.set(...initialPos);
      }
      hasInitialized.current = true;
    }
  }, [value, valueFormatter, label, calculatePosition]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    blockPropUpdates.current = true;
    const clientX = e.nativeEvent?.clientX || e.clientX || 0;
    const clientY = e.nativeEvent?.clientY || e.clientY || 0;
    dragStartRef.current = {
      pos: orientation === 'horizontal' ? clientX : clientY,
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
      if (now - (lastUpdateTime.current || 0) < 16) return;
      lastUpdateTime.current = now;
      const clientX = e.touches?.[0]?.clientX || e.clientX || dragStartRef.current.pos;
      const clientY = e.touches?.[0]?.clientY || e.clientY || dragStartRef.current.pos;
      const currentPos = orientation === 'horizontal' ? clientX : clientY;
      const sensitivity = 0.005 * (max - min);
      const delta = (currentPos - dragStartRef.current.pos) * sensitivity;
      const multiplier = orientation === 'horizontal' ? 1 : -1;
      const newValue = THREE.MathUtils.clamp(
        dragStartRef.current.value + delta * multiplier,
        min,
        max
      );
      if (handleRef.current) {
        const newPos = calculatePosition(newValue);
        handleRef.current.position.set(...newPos);
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
  }, [isDragging, min, max, onChange, valueFormatter, orientation, label, length]);

  return (
    <group>
      <mesh>
        <boxGeometry
          args={orientation === 'horizontal'
            ? [length, thickness, thickness / 2]
            : [thickness, length, thickness / 2]
          }
        />
        <meshStandardMaterial
          color={new THREE.Color(color).multiplyScalar(0.5)}
          roughness={0.7}
        />
      </mesh>
      <mesh
        ref={handleRef}
        position={calculatePosition(value)}
        onPointerDown={handlePointerDown}
      >
        <boxGeometry
          args={orientation === 'horizontal'
            ? [thickness * 1.5, thickness * 2, thickness]
            : [thickness * 2, thickness * 1.5, thickness]
          }
        />
        <meshStandardMaterial
          color={isDragging ? new THREE.Color(color).addScalar(0.2) : color}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
      <Text
        ref={displayTextRef}
        position={orientation === 'horizontal'
          ? [-length / 2 + thickness * 2, -thickness * 1.8 + valueOffset, 0.1]
          : [thickness * 1.2 + valueOffset, -thickness * 2, 0.1]
        }
        fontSize={0.08}
        color="white"
        fontWeight="bold"
        rotation={orientation === 'horizontal'
          ? [0, 0, 0]
          : [0, 0, Math.PI / 2]
        }
        anchorX={orientation === 'horizontal' ? 'left' : 'center'}
        anchorY="middle"
      />
      <Text
        position={orientation === 'horizontal'
          ? [thickness * 6, -thickness * 1.8 + labelOffset, 0.1]
          : [thickness * 1.2 + labelOffset, -thickness * 8, 0.1]
        }
        fontSize={0.055}
        color="white"
        fontWeight="bold"
        rotation={orientation === 'horizontal'
          ? [0, 0, 0]
          : [0, 0, Math.PI / 2]
        }
        anchorX={orientation === 'horizontal' ? 'left' : 'center'}
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

export default Slider;
