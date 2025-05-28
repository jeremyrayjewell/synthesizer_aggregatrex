import React, { useEffect, useState, useCallback, useRef, startTransition } from 'react';
import { SynthProvider, useSynth } from './hooks/useSynth';
import { useMIDI } from './hooks/useMIDI';
import useQwertyInput from './hooks/useQwertyInput';
import ThreeCanvas from './three/ThreeCanvas';
import midiDebugger from './utils/midiDebugger';

const SynthController = () => {
  const synth = useSynth();
  const [activeNotes, setActiveNotes] = useState(new Set());
  const midiActivityRef = useRef({ count: 0, lastTime: Date.now() });

  const handleNoteOn = useCallback((note, velocity) => {
    try {
      const now = Date.now();
      const timeDiff = now - midiActivityRef.current.lastTime;
      midiActivityRef.current.count++;
      midiActivityRef.current.lastTime = now;

      if (timeDiff < 10 && midiActivityRef.current.count > 10) {
        console.log(`Rapid MIDI input detected: ${midiActivityRef.current.count} messages in ${timeDiff}ms`);
      }

      setTimeout(() => {
        if (Date.now() - midiActivityRef.current.lastTime >= 500) {
          midiActivityRef.current.count = 0;
        }
      }, 500);

      synth.noteOn(note, velocity);
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
      midiDebugger.noteOn(note, velocity);
    } catch (e) {
      console.error(`Error in handleNoteOn for note ${note}:`, e);
    }
  }, [synth]);

  const handleNoteOff = useCallback((note) => {
    try {
      synth.noteOff(note);
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
      midiDebugger.noteOff(note);
    } catch (e) {
      console.error(`Error in handleNoteOff for note ${note}:`, e);
    }
  }, [synth]);

  const clearAllNotes = useCallback(() => {
    console.log("Clear all notes triggered in App.jsx");
    try {
      if (synth && typeof synth.allNotesOff === 'function') {
        synth.allNotesOff();
      }
      setActiveNotes(new Set());
      midiDebugger.clearAll();
    } catch (e) {
      console.error("Error in clearAllNotes:", e);
    }
  }, [synth]);

  const { clearAllNotes: midiPanic } = useMIDI(handleNoteOn, handleNoteOff);
  useQwertyInput(handleNoteOn, handleNoteOff);

  useEffect(() => {
    const resumeAudioContext = () => {
      if (synth && synth.audioContext && synth.audioContext.state !== 'running') {
        console.log("Resuming audio context on user interaction");
        synth.audioContext.resume().catch(e => {
          console.error("Error resuming audio context:", e);
        });
      }
    };

    const setupSafetyChecks = () => {
      const safetyInterval = setInterval(() => {
        if (activeNotes.size > 0 && synth && 
            ((synth.voiceManager && synth.voiceManager.activeVoices.size === 0) ||
             (synth.activeVoices && synth.activeVoices.size === 0))) {
          console.warn("Safety check: Note count mismatch detected, clearing all notes");
          clearAllNotes();
        }
      }, 10000);

      window.addEventListener('synth-panic', () => {
        console.log("Panic event received from voice debugger");
        clearAllNotes();
      });

      return safetyInterval;
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        console.log("Escape key pressed - clearing all notes");
        clearAllNotes();
        if (midiPanic) midiPanic();
      }
    };

    const handleBlur = () => {
      console.log("Window blur - clearing all notes");
      clearAllNotes();
    };

    window.addEventListener('mousedown', resumeAudioContext);
    window.addEventListener('touchstart', resumeAudioContext);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    const safetyInterval = setupSafetyChecks();

    return () => {
      window.removeEventListener('mousedown', resumeAudioContext);
      window.removeEventListener('touchstart', resumeAudioContext);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      clearInterval(safetyInterval);
    };
  }, [synth, activeNotes, clearAllNotes, midiPanic]);

  return (
    <ThreeCanvas
      onNoteOn={handleNoteOn}
      onNoteOff={handleNoteOff}
      activeNotes={activeNotes}
    />
  );
};

const App = () => {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setAppReady(true);
    });
  }, []);

  if (!appReady) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000'
      }}>
        <h1 style={{ color: '#ffffff' }}>Loading Synthesizer...</h1>
      </div>
    );
  }
  return (
    <React.StrictMode>
      <SynthProvider>
        <SynthController />
      </SynthProvider>
    </React.StrictMode>
  );
};

export default App;
