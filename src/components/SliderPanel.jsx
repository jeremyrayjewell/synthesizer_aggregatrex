import React from 'react';
import { Text } from '@react-three/drei';
import Slider from './Slider';

const PanelBackground = ({ title, width = 4, height = 3, children }) => {
  return (
    <group>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#222" transparent opacity={0.6} />
      </mesh>

      {title && (
        <Text
          position={[0, height / 2 - 0.3, 0.01]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
      )}

      <group position={[0, 0, 0.05]}>
        {children}
      </group>
    </group>
  );
};

const SliderPanel = ({ controls = [], title = 'Sliders', spacing = 1.2 }) => {
  return (
    <group>
      <PanelBackground width={4} height={controls.length * spacing + 1} title={title}>
        {controls.map((ctrl, i) => {
          const y = -((i - (controls.length - 1) / 2) * spacing);
          return (
            <group key={ctrl.id} position={[0, y, 0.1]}>
              <Slider
                value={ctrl.value}
                min={ctrl.min}
                max={ctrl.max}
                onChange={ctrl.onChange}
                label={ctrl.label}
              />
            </group>
          );
        })}
      </PanelBackground>
    </group>
  );
};

export default SliderPanel;
