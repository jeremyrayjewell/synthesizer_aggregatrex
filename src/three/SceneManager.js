import React from 'react';
import Keyboard3D from '../components/Keyboard3D';
import SynthPanel3D from '../components/SynthPanel3D';

const SceneManager = ({ activeNotes, onNoteOn, onNoteOff }) => {
  return (
    <>
      {/* Synth keyboard */}
      <Keyboard3D
        startNote={36} // C2
        endNote={96}   // C7
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
        activeNotes={activeNotes}
      />

      {/* Main synth panel with all controls */}
      <group position={[0, 4, 0]}>
        <SynthPanel3D />
      </group>
    </>
  );
};

export default SceneManager;
