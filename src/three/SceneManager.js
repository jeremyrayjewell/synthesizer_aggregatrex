import React, { useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import Keyboard3D from '../components/Keyboard3D';
import Panel from '../components/Panel';
import Knob from '../components/Knob';
import SliderPanel from '../components/SliderPanel';

const SceneManager = ({ activeNotes, onNoteOn, onNoteOff }) => {
  const { camera } = useThree();
  const groupRef = useRef();
  
  // Handle scene initialization
  useEffect(() => {
    if (groupRef.current) {
      // Ensure scene is visible to camera
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  // Memoize note handlers to prevent unnecessary rerenders
  const handleNoteOn = useCallback((note, velocity) => {
    if (onNoteOn) {
      onNoteOn(note, velocity);
    }
  }, [onNoteOn]);

  const handleNoteOff = useCallback((note) => {
    if (onNoteOff) {
      onNoteOff(note);
    }
  }, [onNoteOff]);  return (
    <group ref={groupRef}>
      {/* Main panel with controls */}
      <group position={[0, 2, -2.5]}>
        <Panel
          width={12}
          height={6}
          depth={0.5}
          color="#1a1a1a"
          border={true}
          borderColor="#333333"
          title="SYNTH CONTROLS"
        >
          {/* Add knob and slider */}
          <group position={[-2, 0, 0.1]}>
            <Knob
              size={1.2}
              value={0.5}
              label="FILTER"
              color="#8bc34a"
            />
          </group>
          <group position={[2, 0, 0.1]}>
            <SliderPanel
              controls={[{
                id: 'volume',
                label: 'VOLUME',
                value: 0.8,
                min: 0,
                max: 1,
                color: '#ff5722'
              }]}
              width={2}
              height={4}
            />
          </group>
        </Panel>
      </group>

      {/* Keyboard below panel */}
      <group position={[0, -2, 0]}>
        <Keyboard3D
          startNote={36} // C2
          endNote={96}   // C7
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          activeNotes={activeNotes || new Set()}
        />
      </group>
    </group>
  );
};

export default SceneManager;
