import React from 'react';
import Panel from './Panel';
import Knob from './Knob';
import { Text } from '@react-three/drei';

/**
 * A simplified test version of SynthPanel3D without context dependencies
 */
const SimpleSynthPanel = () => {
  console.log('SimpleSynthPanel rendering');

  return (
    <group>
      {/* Main panel background */}
      <Panel 
        width={16} 
        height={10} 
        depth={0.5}
        title="TEST SYNTHESIZER"
        color="#111111"
        borderColor="#333333"
      >
        <group>
          {/* Simple test knob */}
          <group position={[0, 2, 0.1]}>
            <Knob
              value={0.5}
              min={0}
              max={1}
              onChange={(value) => {
                console.log('Test knob changed:', value);
              }}
              label="TEST"
              color="#8bc34a"
              size={1}
            />
          </group>
          
          {/* Test cube */}
          <mesh position={[3, 0, 0.1]}>
            <boxGeometry args={[1, 1, 0.5]} />
            <meshStandardMaterial color="blue" />
          </mesh>
          
          {/* Test text */}
          <Text
            position={[0, -2, 0.1]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            SIMPLE TEST PANEL
          </Text>
        </group>
      </Panel>
    </group>
  );
};

export default SimpleSynthPanel;
