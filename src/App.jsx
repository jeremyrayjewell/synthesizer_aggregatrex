import React, { useEffect, useState } from 'react';
import { SynthProvider, useSynth } from './hooks/useSynth';
import { useMIDI } from './hooks/useMIDI';
import useQwertyInput from './hooks/useQwertyInput';
import ThreeCanvas from './three/ThreeCanvas';

const SynthController = () => {
  const synth = useSynth();
  const [activeNotes, setActiveNotes] = useState(new Set());

  const handleNoteOn = (note, velocity) => {
    synth.noteOn(note, velocity);
    setActiveNotes(prev => new Set(prev).add(note));
  };

  const handleNoteOff = (note) => {
    synth.noteOff(note);
    setActiveNotes(prev => {
      const updated = new Set(prev);
      updated.delete(note);
      return updated;
    });
  };

  useMIDI(handleNoteOn, handleNoteOff);
  useQwertyInput(handleNoteOn, handleNoteOff); // ✅ Properly hooked

  useEffect(() => {
    const handleInteraction = () => {
      if (synth.audioContext.state !== 'running') {
        synth.audioContext.resume();
      }
    };
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [synth.audioContext]);

  return (
    <ThreeCanvas
      onNoteOn={handleNoteOn}
      onNoteOff={handleNoteOff}
      activeNotes={activeNotes}
    />
  );
};

const App = () => (
  <SynthProvider>
    <SynthController />
  </SynthProvider>
);

export default App;
