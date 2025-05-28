import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import SynthEngine from '../audio/SynthEngine';
import { SynthContext } from '../context/SynthContext';
import { DEFAULT_MASTER_VOLUME } from '../constants';

export const SynthProvider = ({ children }) => {
  const synthRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
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
      envelopeAmount: 0.5,
      enabled: true
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
    },    master: {
      volume: DEFAULT_MASTER_VOLUME,
      isMuted: false
    }
  });

  useEffect(() => {
    synthRef.current = new SynthEngine();
    setIsReady(true);
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (synthRef.current && isReady) {
      try {
        synthRef.current.parameters = {
          waveform: synthParams.oscillator1.type,
          attack: synthParams.envelope.attack,
          decay: synthParams.envelope.decay,
          sustain: synthParams.envelope.sustain,
          release: synthParams.envelope.release,
          filterType: synthParams.filter.type,
          filterCutoff: synthParams.filter.frequency,
          filterQ: synthParams.filter.Q
        };

        if (synthRef.current.masterGain && !synthParams.master.isMuted) {
          synthRef.current.masterGain.gain.setValueAtTime(
            synthParams.master.volume,
            synthRef.current.audioContext.currentTime
          );
        } else if (synthRef.current.masterGain && synthParams.master.isMuted) {
          synthRef.current.masterGain.gain.setValueAtTime(
            0,
            synthRef.current.audioContext.currentTime
          );
        }
      } catch (error) {
        console.error("Error updating synth parameters:", error);
      }
    }
  }, [isReady, synthParams]);

  const [currentPatch, setCurrentPatch] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [automationData, setAutomationData] = useState({});

  const loadPatch = useCallback((patchData) => {
    setCurrentPatch(patchData);
    if (patchData.params) {
      setSynthParams(patchData.params);
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (synthRef.current) {
    }
  }, [isPlaying]);

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

export const useSynth = () => {
  const context = useContext(SynthContext);
  if (!context) {
    throw new Error('useSynth must be used within a SynthProvider');
  }
  return context.synth;
};

export const useSynthContext = () => {
  const context = useContext(SynthContext);
  if (!context) {
    throw new Error('useSynthContext must be used within a SynthProvider');
  }
  return context;
};
