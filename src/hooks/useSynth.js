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
  DEFAULT_ARP_HOLD_MODE,
  // Effects imports
  DEFAULT_DISTORTION_ENABLED,
  DEFAULT_DISTORTION_DRIVE,
  DEFAULT_DISTORTION_TONE,
  DEFAULT_DISTORTION_MIX,
  DEFAULT_EQ_ENABLED,
  DEFAULT_EQ_LOW_GAIN,
  DEFAULT_EQ_MID_GAIN,
  DEFAULT_EQ_HIGH_GAIN,
  DEFAULT_COMPRESSOR_ENABLED,
  DEFAULT_COMPRESSOR_THRESHOLD,
  DEFAULT_COMPRESSOR_RATIO,
  DEFAULT_COMPRESSOR_ATTACK,
  DEFAULT_COMPRESSOR_RELEASE,
  DEFAULT_COMPRESSOR_MAKEUP,
  DEFAULT_CHORUS_ENABLED,
  DEFAULT_CHORUS_RATE,
  DEFAULT_CHORUS_DEPTH,
  DEFAULT_CHORUS_MIX,
  DEFAULT_DELAY_ENABLED,
  DEFAULT_DELAY_TIME,
  DEFAULT_DELAY_FEEDBACK,
  DEFAULT_DELAY_MIX,
  DEFAULT_DELAY_DAMPING,
  DEFAULT_REVERB_ENABLED,
  DEFAULT_REVERB_SIZE,
  DEFAULT_REVERB_DECAY,
  DEFAULT_REVERB_MIX,
  DEFAULT_REVERB_PREDELAY,
  DEFAULT_REVERB_DAMPING
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
      distortion: {
        enabled: DEFAULT_DISTORTION_ENABLED,
        drive: DEFAULT_DISTORTION_DRIVE,
        tone: DEFAULT_DISTORTION_TONE,
        mix: DEFAULT_DISTORTION_MIX
      },
      eq: {
        enabled: DEFAULT_EQ_ENABLED,
        lowGain: DEFAULT_EQ_LOW_GAIN,
        midGain: DEFAULT_EQ_MID_GAIN,
        highGain: DEFAULT_EQ_HIGH_GAIN
      },
      compressor: {
        enabled: DEFAULT_COMPRESSOR_ENABLED,
        threshold: DEFAULT_COMPRESSOR_THRESHOLD,
        ratio: DEFAULT_COMPRESSOR_RATIO,
        attack: DEFAULT_COMPRESSOR_ATTACK,
        release: DEFAULT_COMPRESSOR_RELEASE,
        makeupGain: DEFAULT_COMPRESSOR_MAKEUP
      },
      chorus: {
        enabled: DEFAULT_CHORUS_ENABLED,
        rate: DEFAULT_CHORUS_RATE,
        depth: DEFAULT_CHORUS_DEPTH,
        mix: DEFAULT_CHORUS_MIX
      },
      delay: {
        enabled: DEFAULT_DELAY_ENABLED,
        time: DEFAULT_DELAY_TIME,
        feedback: DEFAULT_DELAY_FEEDBACK,
        mix: DEFAULT_DELAY_MIX,
        damping: DEFAULT_DELAY_DAMPING
      },
      reverb: {
        enabled: DEFAULT_REVERB_ENABLED,
        size: DEFAULT_REVERB_SIZE,
        decay: DEFAULT_REVERB_DECAY,
        mix: DEFAULT_REVERB_MIX,
        predelay: DEFAULT_REVERB_PREDELAY,
        damping: DEFAULT_REVERB_DAMPING
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
    const initSynth = async () => {
      try {
        synthRef.current = new SynthEngine();
        // Wait for synth engine initialization
        await synthRef.current.initPromise;
        console.log("Synth engine initialized successfully");
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize synth engine:", error);
        setIsReady(false);
      }
    };

    initSynth();

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

        // Update effects parameters
        if (synthRef.current.effectChain && synthParams.effects) {
          // Distortion
          synthRef.current.setParam('distortion.enabled', synthParams.effects.distortion.enabled);
          synthRef.current.setParam('distortion.drive', synthParams.effects.distortion.drive);
          synthRef.current.setParam('distortion.tone', synthParams.effects.distortion.tone);
          synthRef.current.setParam('distortion.mix', synthParams.effects.distortion.mix);
          
          // EQ
          synthRef.current.setParam('eq.enabled', synthParams.effects.eq.enabled);
          synthRef.current.setParam('eq.lowGain', synthParams.effects.eq.lowGain);
          synthRef.current.setParam('eq.midGain', synthParams.effects.eq.midGain);
          synthRef.current.setParam('eq.highGain', synthParams.effects.eq.highGain);
          
          // Compressor
          synthRef.current.setParam('compressor.enabled', synthParams.effects.compressor.enabled);
          synthRef.current.setParam('compressor.threshold', synthParams.effects.compressor.threshold);
          synthRef.current.setParam('compressor.ratio', synthParams.effects.compressor.ratio);
          synthRef.current.setParam('compressor.attack', synthParams.effects.compressor.attack);
          synthRef.current.setParam('compressor.release', synthParams.effects.compressor.release);
          synthRef.current.setParam('compressor.makeupGain', synthParams.effects.compressor.makeupGain);
          
          // Chorus
          synthRef.current.setParam('chorus.enabled', synthParams.effects.chorus.enabled);
          synthRef.current.setParam('chorus.rate', synthParams.effects.chorus.rate);
          synthRef.current.setParam('chorus.depth', synthParams.effects.chorus.depth);
          synthRef.current.setParam('chorus.mix', synthParams.effects.chorus.mix);
          
          // Delay
          synthRef.current.setParam('delay.enabled', synthParams.effects.delay.enabled);
          synthRef.current.setParam('delay.time', synthParams.effects.delay.time);
          synthRef.current.setParam('delay.feedback', synthParams.effects.delay.feedback);
          synthRef.current.setParam('delay.mix', synthParams.effects.delay.mix);
          synthRef.current.setParam('delay.damping', synthParams.effects.delay.damping);
          
          // Reverb
          synthRef.current.setParam('reverb.enabled', synthParams.effects.reverb.enabled);
          synthRef.current.setParam('reverb.size', synthParams.effects.reverb.size);
          synthRef.current.setParam('reverb.decay', synthParams.effects.reverb.decay);
          synthRef.current.setParam('reverb.mix', synthParams.effects.reverb.mix);
          synthRef.current.setParam('reverb.predelay', synthParams.effects.reverb.predelay);
          synthRef.current.setParam('reverb.damping', synthParams.effects.reverb.damping);
        }

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
