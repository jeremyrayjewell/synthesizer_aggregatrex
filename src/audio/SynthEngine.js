import Voice from './Voice';
import MIDIVoiceManager from './MIDIVoiceManager';
import voiceMonitor from '../utils/voiceMonitor';

export default class SynthEngine {
  constructor(audioContext = new (window.AudioContext || window.webkitAudioContext)()) {
    this.audioContext = audioContext;
    
    // Create master gain node
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);
    
    // Create synth parameters with extended parameter set
    this.parameters = {
      // Oscillator 1
      oscillator1Type: 'sawtooth',
      oscillator1Detune: 0,
      oscillator1Mix: 0.5,
      
      // Oscillator 2
      oscillator2Type: 'square',
      oscillator2Detune: 0,
      oscillator2Mix: 0.5,
      
      // Filter
      filterType: 'lowpass',
      filterCutoff: 2000,
      filterQ: 1,
      
      // Envelope
      attack: 0.01,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5,
      
      // Effects
      delayTime: 0.3,
      delayFeedback: 0.3,
      delayMix: 0.2,
      reverbSize: 0.5,
      reverbMix: 0.2
    };
    
    // Initialize the MIDI Voice Manager for advanced voice handling
    this.voiceManager = new MIDIVoiceManager(this.audioContext);
    
    // Set up an emergency cleanup interval - reduced from 10s to 5s for more frequent checks
    this.cleanupInterval = setInterval(() => this.emergencyCleanupCheck(), 5000);
    
    // Counter for rapid sequence of note on/off messages
    this.midiActivityCounter = 0;
    this.midiActivityTimeout = null;
    
    // For debugging
    console.log("SynthEngine initialized with new MIDIVoiceManager");
  }
  
  /**
   * Create a voice factory function for the voice manager
   */
  createVoiceFactory(velocity) {
    return (note) => {
      try {
        // Create new voice with current parameters
        const voice = new Voice(this.audioContext, this.masterGain, {
          ...this.parameters,
          velocity: velocity / 127
        });
        
        // Start the voice
        voice.start(note);
        
        return voice;
      } catch (e) {
        console.error(`Error in voice factory for note ${note}:`, e);
        return null;
      }
    };
  }
    /**
   * Handle note on messages
   */
  noteOn(note, velocity = 127) {
    // Detect rapid MIDI activity
    this.midiActivityCounter++;
    
    if (this.midiActivityTimeout) {
      clearTimeout(this.midiActivityTimeout);
    }
    
    this.midiActivityTimeout = setTimeout(() => {
      this.midiActivityCounter = 0;
    }, 500);
    
    // If we're getting a flood of MIDI messages, be more aggressive with voice management
    // Lowered threshold to 10 (from 20) to be more responsive to rapid playing
    if (this.midiActivityCounter > 10) {
      console.log(`Detected rapid MIDI input (${this.midiActivityCounter} messages), using aggressive voice management`);
      
      // Stop all current instances of this note immediately before creating a new one
      try {
        // Create a voice factory function
        const voiceFactory = this.createVoiceFactory(velocity);
        
        // Use voice manager to handle note on
        this.voiceManager.noteOn(note, velocity, voiceFactory);
        
        return true;
      } catch (e) {
        console.error(`Error in noteOn (aggressive mode) for note ${note}:`, e);
        return false;
      }
    } else {
      // Normal operation
      try {
        // Create a voice factory function
        const voiceFactory = this.createVoiceFactory(velocity);
        
        // Use voice manager to handle note on
        this.voiceManager.noteOn(note, velocity, voiceFactory);
        
        return true;
      } catch (e) {
        console.error(`Error in noteOn for note ${note}:`, e);
        return false;
      }
    }
  }
  
  /**
   * Handle note off messages
   */
  noteOff(note) {
    try {
      // Create a release callback function
      const releaseCallback = (voice, immediate = false) => {
        if (voice && typeof voice.stop === 'function') {
          voice.stop(immediate);
        }
      };
      
      // Use voice manager to handle note off
      return this.voiceManager.noteOff(note, releaseCallback);
    } catch (e) {
      console.error(`Error in noteOff for note ${note}:`, e);
      return false;
    }
  }
  
  /**
   * Stop all notes immediately
   */
  allNotesOff() {
    console.log("All notes off triggered in SynthEngine");
    
    try {
      // Create a release callback function
      const releaseCallback = (voice, immediate = true) => {
        if (voice && typeof voice.stop === 'function') {
          voice.stop(immediate);
        }
      };
      
      // Use voice manager to handle all notes off
      return this.voiceManager.allNotesOff(releaseCallback);
    } catch (e) {
      console.error("Error in allNotesOff:", e);
      return false;
    }
  }
    /**
   * Emergency cleanup check for stuck notes
   */
  emergencyCleanupCheck() {
    // If audioContext is not running, do nothing
    if (this.audioContext.state !== 'running') {
      return;
    }
      // If we have a lot of voices active, perform emergency cleanup
    // More aggressive threshold (75% capacity instead of almost full)
    if (this.voiceManager.voiceCount > Math.floor(this.voiceManager.maxVoices * 0.75)) {
      console.warn(`Emergency cleanup: ${this.voiceManager.voiceCount} voices active (threshold: ${Math.floor(this.voiceManager.maxVoices * 0.75)})`);
      
      // Record emergency cleanup in voice monitor
      voiceMonitor.recordEmergencyCleanup();
      
      // Force voice manager to run a cleanup cycle
      this.voiceManager.performCleanup();
      
      // If we're still over threshold after cleanup, do an allNotesOff
      if (this.voiceManager.voiceCount > Math.floor(this.voiceManager.maxVoices * 0.75)) {
        console.warn("Still over threshold after cleanup, forcing all notes off");
        this.allNotesOff();
      }
    }
  }
  
  /**
   * Set a synth parameter
   */
  setParam(param, value) {
    console.log('Setting synth param:', param, value);
    if (this.parameters.hasOwnProperty(param)) {
      this.parameters[param] = value;
      
      // Apply parameter change to existing voices
      if (this.voiceManager) {
        const voices = this.voiceManager.getAllVoices();
        voices.forEach(voice => {
          if (voice && typeof voice.updateParam === 'function') {
            voice.updateParam(param, value);
          }
        });
      }
    } else {
      console.warn('Unknown parameter:', param);
    }
  }
  
  /**
   * Set the waveform type
   */
  setWaveform(type) {
    this.parameters.waveform = type;
  }
  
  /**
   * Set filter parameters
   */
  setFilter(type, cutoff, q) {
    this.parameters.filterType = type;
    this.parameters.filterCutoff = cutoff;
    this.parameters.filterQ = q;
  }
  
  /**
   * Set envelope parameters
   */
  setEnvelope(attack, decay, sustain, release) {
    this.parameters.attack = attack;
    this.parameters.decay = decay;
    this.parameters.sustain = sustain;
    this.parameters.release = release;
  }
  
  /**
   * Clean up resources when no longer needed
   */
  dispose() {
    // Clear emergency cleanup interval
    clearInterval(this.cleanupInterval);
    
    // Stop all notes
    this.allNotesOff();
    
    // Dispose voice manager
    if (this.voiceManager) {
      this.voiceManager.dispose();
    }
    
    // Disconnect master gain
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => {
        console.error("Error closing audio context:", e);
      });
    }
  }
}
