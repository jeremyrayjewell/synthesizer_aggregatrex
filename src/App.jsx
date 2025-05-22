import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SynthProvider, useSynth } from './hooks/useSynth';
import { useMIDI } from './hooks/useMIDI';
import useQwertyInput from './hooks/useQwertyInput';
import ThreeCanvas from './three/ThreeCanvas';
import midiDebugger from './utils/midiDebugger';
import VoiceDebugger from './components/VoiceDebugger';

const SynthController = () => {
  const synth = useSynth();
  const [activeNotes, setActiveNotes] = useState(new Set());
  const midiActivityRef = useRef({ count: 0, lastTime: Date.now() });
  
  // Handle note on messages
  const handleNoteOn = useCallback((note, velocity) => {
    try {
      // Track MIDI activity rate
      const now = Date.now();
      const timeDiff = now - midiActivityRef.current.lastTime;
      midiActivityRef.current.count++;
      midiActivityRef.current.lastTime = now;
      
      // If we're getting a burst of MIDI activity, log it
      if (timeDiff < 10 && midiActivityRef.current.count > 10) {
        console.log(`Rapid MIDI input detected: ${midiActivityRef.current.count} messages in ${timeDiff}ms`);
      }
      
      // Reset count after 500ms of inactivity
      setTimeout(() => {
        if (Date.now() - midiActivityRef.current.lastTime >= 500) {
          midiActivityRef.current.count = 0;
        }
      }, 500);
      
      // Play the note
      synth.noteOn(note, velocity);
      
      // Update active notes state
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
      
      // Log to MIDI debugger
      midiDebugger.noteOn(note, velocity);
    } catch (e) {
      console.error(`Error in handleNoteOn for note ${note}:`, e);
    }
  }, [synth]);
  
  // Handle note off messages
  const handleNoteOff = useCallback((note) => {
    try {
      // Stop the note
      synth.noteOff(note);
      
      // Update active notes state
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
      
      // Log to MIDI debugger
      midiDebugger.noteOff(note);
    } catch (e) {
      console.error(`Error in handleNoteOff for note ${note}:`, e);
    }
  }, [synth]);
  
  // Clear all notes function
  const clearAllNotes = useCallback(() => {
    console.log("Clear all notes triggered in App.jsx");
    
    try {
      // Call allNotesOff on the synth
      if (synth && typeof synth.allNotesOff === 'function') {
        synth.allNotesOff();
      }
      
      // Clear the active notes state
      setActiveNotes(new Set());
      
      // Clear the MIDI debugger
      midiDebugger.clearAll();
    } catch (e) {
      console.error("Error in clearAllNotes:", e);
    }
  }, [synth]);
  
  // Use the MIDI hook
  const { clearAllNotes: midiPanic } = useMIDI(handleNoteOn, handleNoteOff);
  
  // Use the QWERTY keyboard input hook
  useQwertyInput(handleNoteOn, handleNoteOff);
  
  // Set up audio context and safety checks
  useEffect(() => {
    // Auto-resume audio context on user interaction
    const resumeAudioContext = () => {
      if (synth && synth.audioContext && synth.audioContext.state !== 'running') {
        console.log("Resuming audio context on user interaction");
        synth.audioContext.resume().catch(e => {
          console.error("Error resuming audio context:", e);
        });
      }
    };
    
    // Set up extra safety for stuck notes
    const setupSafetyChecks = () => {
      // Periodic check for active notes
      const safetyInterval = setInterval(() => {
        // If we have active notes in the UI but the synth doesn't have any,
        // there might be a mismatch - clear all notes
        if (activeNotes.size > 0 && synth && 
            ((synth.voiceManager && synth.voiceManager.activeVoices.size === 0) ||
             (synth.activeVoices && synth.activeVoices.size === 0))) {
          console.warn("Safety check: Note count mismatch detected, clearing all notes");
          clearAllNotes();
        }
      }, 10000); // Check every 10 seconds
      
      // Listen for panic events from voice debugger
      window.addEventListener('synth-panic', () => {
        console.log("Panic event received from voice debugger");
        clearAllNotes();
      });
      
      return safetyInterval;
    };
    
    // Escape key for panic
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        console.log("Escape key pressed - clearing all notes");
        clearAllNotes();
        
        // Also trigger MIDI panic for good measure
        if (midiPanic) midiPanic();
      }
    };
    
    // Window blur handler
    const handleBlur = () => {
      console.log("Window blur - clearing all notes");
      clearAllNotes();
    };
    
    // Add event listeners
    window.addEventListener('mousedown', resumeAudioContext);
    window.addEventListener('touchstart', resumeAudioContext);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    
    // Set up safety checks
    const safetyInterval = setupSafetyChecks();
    
    // Cleanup function
    return () => {
      window.removeEventListener('mousedown', resumeAudioContext);
      window.removeEventListener('touchstart', resumeAudioContext);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      clearInterval(safetyInterval);
    };
  }, [synth, activeNotes, clearAllNotes, midiPanic]);
  
  // Render the ThreeCanvas component
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
    <VoiceDebugger />
  </SynthProvider>
);

export default App;
