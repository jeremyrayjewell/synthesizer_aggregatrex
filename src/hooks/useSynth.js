import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import SynthEngine from '../audio/SynthEngine';
import { SynthContext } from '../context/SynthContext';

// Synth Provider Component
export const SynthProvider = ({ children }) => {
  const synthRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize default synth parameters based on the SynthEngine parameters
  const [synthParams, setSynthParams] = useState({
    oscillator1: {
      type: 'sawtooth',
      frequency: 440,
      detune: 0,
      mix: 0.5
    },
    oscillator2: {
      type: 'square',
      frequency: 440,
      detune: 0,
      mix: 0.5
    },
    filter: {
      type: 'lowpass',
      frequency: 2000,
      Q: 1,
      envelopeAmount: 0.5
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5
    },
    effects: {
      delay: {
        time: 0.3,
        feedback: 0.3,
        mix: 0.2
      },
      reverb: {
        size: 0.5,
        dampening: 3000,
        mix: 0.2
      }
    },
    master: {
      volume: 0.8
    }
  });

  useEffect(() => {
    synthRef.current = new SynthEngine();
    setIsReady(true);
    
    // Cleanup
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);
    // Update synth engine when parameters change
  useEffect(() => {
    if (synthRef.current && isReady) {
      // Update engine parameters based on synthParams
      try {
        // Convert from our UI params to engine params format
        synthRef.current.parameters = {
          waveform: synthParams.oscillator1.type,
          attack: synthParams.envelope.attack,
          decay: synthParams.envelope.decay,
          sustain: synthParams.envelope.sustain,
          release: synthParams.envelope.release,
          filterType: synthParams.filter.type,
          filterCutoff: synthParams.filter.frequency,
          filterQ: synthParams.filter.Q,
          // Add other parameters as they become available
        };
        
        // Update master volume
        if (synthRef.current.masterGain) {
          synthRef.current.masterGain.gain.setValueAtTime(
            synthParams.master.volume,
            synthRef.current.audioContext.currentTime
          );
        }
      } catch (error) {
        console.error("Error updating synth parameters:", error);
      }
    }
  }, [isReady, synthParams]);
  
  // State for patch management
  const [currentPatch, setCurrentPatch] = useState({});
  
  // State for global play/stop functionality
  const [isPlaying, setIsPlaying] = useState(false);
  
  // State for automation data
  const [automationData, setAutomationData] = useState({});
  
  // Example function to update patch and inform synthEngine
  const loadPatch = useCallback((patchData) => {
    setCurrentPatch(patchData);
    // Update synthParams based on patch data
    if (patchData.params) {
      setSynthParams(patchData.params);
    }
  }, []);

  // Example: toggle global play state
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (synthRef.current) {
      // You could implement playback state control here
      // synthRef.current.setPlaybackState(!isPlaying);
    }
  }, [isPlaying]);

  // All notes off / panic function
  const panic = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.allNotesOff();
    }
  }, []);
  return (
    <SynthContext.Provider value={{
      synth: synthRef.current,
      synthParams,
      setSynthParams,
      currentPatch,
      loadPatch,
      isPlaying,
      togglePlay,
      automationData,
      setAutomationData,
      panic
    }}>
      {isReady ? children : null}
    </SynthContext.Provider>
  );
};

// Custom Hook to use Synth
export const useSynth = () => {
  const context = useContext(SynthContext);
  if (!context) {
    throw new Error('useSynth must be used within a SynthProvider');
  }
  return context.synth;
};

// Custom Hook to use all synth context values
export const useSynthContext = () => {
  const context = useContext(SynthContext);
  if (!context) {
    throw new Error('useSynthContext must be used within a SynthProvider');
  }
  return context;
};
