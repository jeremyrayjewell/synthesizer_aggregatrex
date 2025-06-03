import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import SynthEngine from '../audio/SynthEngine';
import { SynthContext } from '../context/SynthContext';
import { 
  DEFAULT_MASTER_VOLUME, 
  DEFAULT_DETUNE, 
  DEFAULT_PULSE_WIDTH, 
  DEFAULT_SUB_ENABLED, 
  DEFAULT_SUB_MIX, 
  DEFAULT_SUB_WAVEFORM,
  DEFAULT_ARP_ENABLED,
  DEFAULT_ARP_RATE,
  DEFAULT_ARP_PATTERN,
  DEFAULT_ARP_OCTAVES,
  DEFAULT_ARP_GATE,
  DEFAULT_ARP_SWING,
  DEFAULT_ARP_STEP_LENGTH,
  DEFAULT_ARP_VELOCITY_MODE,
  DEFAULT_ARP_HOLD_MODE
} from '../constants/synth';

export const SynthProvider = ({ children }) => {
  const synthRef = useRef(null);
  const [isReady, setIsReady] = useState(false);  const [synthParams, setSynthParams] = useState({    oscillator1: {
      type: 'sawtooth',
      frequency: 440,
      detune: DEFAULT_DETUNE,
      mix: 0.8,  // Increased from 0.5 to make more audible
      pulseWidth: DEFAULT_PULSE_WIDTH
    },
    oscillator2: {
      type: 'square',
      frequency: 440,
      detune: DEFAULT_DETUNE,
      mix: 0.5,
      pulseWidth: DEFAULT_PULSE_WIDTH
    },
    subOscillator: {
      enabled: DEFAULT_SUB_ENABLED,
      type: DEFAULT_SUB_WAVEFORM,
      mix: DEFAULT_SUB_MIX
    },    filter: {
      type: 'lowpass',
      frequency: 8000,  // Increased from 2000 for brighter sound
      Q: 1,
      envelopeAmount: 0.5,
      enabled: true
    },
    envelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5
    },    effects: {
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
    arpeggiator: {
      enabled: DEFAULT_ARP_ENABLED,
      rate: DEFAULT_ARP_RATE,
      pattern: DEFAULT_ARP_PATTERN,
      octaves: DEFAULT_ARP_OCTAVES,
      gate: DEFAULT_ARP_GATE,
      swing: DEFAULT_ARP_SWING,
      stepLength: DEFAULT_ARP_STEP_LENGTH,
      velocityMode: DEFAULT_ARP_VELOCITY_MODE,
      holdMode: DEFAULT_ARP_HOLD_MODE
    },
    master: {
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
  }, []);  useEffect(() => {
    if (synthRef.current && isReady) {
      try {
        // Update the synth engine parameters
        synthRef.current.parameters = {
          waveform: synthParams.oscillator1.type,
          oscillator1Type: synthParams.oscillator1.type,
          oscillator1Detune: synthParams.oscillator1.detune,
          oscillator1PulseWidth: synthParams.oscillator1.pulseWidth,
          oscillator2Type: synthParams.oscillator2.type,
          oscillator2Detune: synthParams.oscillator2.detune,
          oscillator2PulseWidth: synthParams.oscillator2.pulseWidth,
          subOscillatorEnabled: synthParams.subOscillator.enabled,
          subOscillatorType: synthParams.subOscillator.type,
          subOscillatorMix: synthParams.subOscillator.mix,
          attack: synthParams.envelope.attack,
          decay: synthParams.envelope.decay,
          sustain: synthParams.envelope.sustain,
          release: synthParams.envelope.release,
          filterType: synthParams.filter.type,
          filterCutoff: synthParams.filter.frequency,
          filterQ: synthParams.filter.Q
        };

        // Update arpeggiator parameters if they exist
        if (synthRef.current.updateArpeggiator && synthParams.arpeggiator) {
          synthRef.current.updateArpeggiator({
            enabled: synthParams.arpeggiator.enabled,
            rate: synthParams.arpeggiator.rate,
            pattern: synthParams.arpeggiator.pattern,
            octaves: synthParams.arpeggiator.octaves,
            gate: synthParams.arpeggiator.gate,
            swing: synthParams.arpeggiator.swing,
            stepLength: synthParams.arpeggiator.stepLength,
            velocityMode: synthParams.arpeggiator.velocityMode,
            holdMode: synthParams.arpeggiator.holdMode
          });
        }

        // Update master volume
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
      // If arpeggiator is enabled, disable it first
      if (synthRef.current.arpeggiator && synthRef.current.arpeggiator.isEnabled) {
        console.log("Disabling arpeggiator during panic button press");
        // Update both the engine and the state
        synthRef.current.arpeggiator.setEnabled(false);
        setSynthParams(prev => ({
          ...prev,
          arpeggiator: { ...prev.arpeggiator, enabled: false }
        }));
      }
      
      // Now stop all notes
      synthRef.current.allNotesOff();
      
      console.log("Panic button pressed - all notes off");
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
