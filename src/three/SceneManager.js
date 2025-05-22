import React from 'react';
import Keyboard3D from '../components/Keyboard3D';
import Panel from '../components/Panel';

const SceneManager = ({ activeNotes, onNoteOn, onNoteOff }) => {
  return (
    <>
      {/* Synth keyboard */}
      <Keyboard3D
        startNote={21} // A0
        endNote={108}  // C8
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
        activeNotes={activeNotes}
      />

      {/* All UI panels are centralized in one group */}
      <group position={[0, 3, 0]}>
        <Panel />
      </group>
    </>
  );
};

export default SceneManager;
