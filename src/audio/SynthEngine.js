import Voice from './Voice';
import MIDIVoiceManager from './MIDIVoiceManager';
import { DEFAULT_MASTER_VOLUME } from '../constants';

export default class SynthEngine {
  constructor(audioContext = new (window.AudioContext || window.webkitAudioContext)()) {
    this.audioContext = audioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = DEFAULT_MASTER_VOLUME;
    this.masterGain.connect(this.audioContext.destination);

    this.parameters = {
      oscillator1Type: 'sawtooth',
      oscillator1Detune: 0,
      oscillator1Mix: 0.5,
      oscillator2Type: 'square',
      oscillator2Detune: 0,
      oscillator2Mix: 0.5,
      filterType: 'lowpass',
      filterCutoff: 2000,
      filterQ: 1,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5,
      delayTime: 0.3,
      delayFeedback: 0.3,
      delayMix: 0.2,
      reverbSize: 0.5,
      reverbMix: 0.2
    };

    this.voiceManager = new MIDIVoiceManager(this.audioContext);
    this.cleanupInterval = setInterval(() => this.emergencyCleanupCheck(), 5000);
    this.midiActivityCounter = 0;
    this.midiActivityTimeout = null;
    console.log("SynthEngine initialized with new MIDIVoiceManager");
  }

  createVoiceFactory(velocity) {
    return (note) => {
      try {
        const currentGain = this.masterGain ? this.masterGain.gain.value : DEFAULT_MASTER_VOLUME;
        const voice = new Voice(this.audioContext, this.masterGain, {
          ...this.parameters,
          velocity: velocity / 127,
          masterVolume: currentGain
        });
        voice.start(note);
        return voice;
      } catch (e) {
        console.error(`Error in voice factory for note ${note}:`, e);
        return null;
      }
    };
  }

  noteOn(note, velocity = 127) {
    this.midiActivityCounter++;
    if (this.midiActivityTimeout) {
      clearTimeout(this.midiActivityTimeout);
    }
    this.midiActivityTimeout = setTimeout(() => {
      this.midiActivityCounter = 0;
    }, 500);

    try {
      const voiceFactory = this.createVoiceFactory(velocity);
      this.voiceManager.noteOn(note, velocity, voiceFactory);
      return true;
    } catch (e) {
      console.error(`Error in noteOn for note ${note}:`, e);
      return false;
    }
  }

  noteOff(note) {
    try {
      const releaseCallback = (voice, immediate = false) => {
        if (voice && typeof voice.stop === 'function') {
          voice.stop(immediate);
        }
      };
      return this.voiceManager.noteOff(note, releaseCallback);
    } catch (e) {
      console.error(`Error in noteOff for note ${note}:`, e);
      return false;
    }
  }

  allNotesOff() {
    console.log("All notes off triggered in SynthEngine");
    try {
      const releaseCallback = (voice, immediate = true) => {
        if (voice && typeof voice.stop === 'function') {
          voice.stop(immediate);
        }
      };
      return this.voiceManager.allNotesOff(releaseCallback);
    } catch (e) {
      console.error("Error in allNotesOff:", e);
      return false;
    }
  }
  emergencyCleanupCheck() {
    if (this.audioContext.state !== 'running') return;
    if (this.voiceManager.voiceCount > Math.floor(this.voiceManager.maxVoices * 0.75)) {
      console.warn(`Emergency cleanup: ${this.voiceManager.voiceCount} voices active`);
      this.voiceManager.performCleanup();
      if (this.voiceManager.voiceCount > Math.floor(this.voiceManager.maxVoices * 0.75)) {
        console.warn("Still over threshold after cleanup, forcing all notes off");
        this.allNotesOff();
      }
    }
  }

  setParam(param, value) {
    console.log('Setting synth param:', param, value);
    if (this.parameters.hasOwnProperty(param)) {
      this.parameters[param] = value;
      if (this.voiceManager && typeof this.voiceManager.getAllVoices === 'function') {
        try {
          const voices = this.voiceManager.getAllVoices();
          if (voices && voices.length > 0) {
            voices.forEach(voice => {
              if (voice && typeof voice.updateParam === 'function') {
                voice.updateParam(param, value);
              }
            });
          }
        } catch (e) {
          console.error('Error applying parameter change to voices:', e);
        }
      }
    } else {
      console.warn('Unknown parameter:', param);
    }
  }

  setWaveform(type) {
    this.parameters.waveform = type;
  }

  setFilter(type, cutoff, q) {
    console.log(`Setting filter: ${type}, cutoff: ${cutoff}, Q: ${q}`);
    this.parameters.filterType = type;
    this.parameters.filterCutoff = cutoff;
    this.parameters.filterQ = q;
    this.parameters.filterEnabled = true;

    if (this.voiceManager && typeof this.voiceManager.getAllVoices === 'function') {
      try {
        const voices = this.voiceManager.getAllVoices();
        if (voices && voices.length > 0) {
          voices.forEach(voice => {
            if (voice && voice.filter) {
              voice.filter.type = type;
              voice.filter.frequency.value = cutoff;
              voice.filter.Q.value = q;
            }
          });
        } else {
          console.log('No active voices to apply filter to');
        }
      } catch (e) {
        console.error('Error applying filter to voices:', e);
      }
    } else {
      console.log('Voice manager not available or missing getAllVoices method');
    }
  }

  bypassFilter() {
    console.log('Bypassing filter');
    this.parameters.filterEnabled = false;

    if (this.voiceManager && typeof this.voiceManager.getAllVoices === 'function') {
      try {
        const voices = this.voiceManager.getAllVoices();
        if (voices && voices.length > 0) {
          voices.forEach(voice => {
            if (voice && voice.filter) {
              if (voice.filter.type === 'lowpass') {
                voice.filter.frequency.value = 20000;
                voice.filter.Q.value = 0.1;
              } else if (voice.filter.type === 'highpass') {
                voice.filter.frequency.value = 20;
                voice.filter.Q.value = 0.1;
              } else if (voice.filter.type === 'bandpass') {
                voice.filter.frequency.value = 1000;
                voice.filter.Q.value = 0.01;
              }
            }
          });
        } else {
          console.log('No active voices to bypass filter on');
        }
      } catch (e) {
        console.error('Error bypassing filter:', e);
      }
    } else {
      console.log('Voice manager not available or missing getAllVoices method');
    }
  }

  setEnvelope(attack, decay, sustain, release) {
    this.parameters.attack = attack;
    this.parameters.decay = decay;
    this.parameters.sustain = sustain;
    this.parameters.release = release;
  }

  dispose() {
    clearInterval(this.cleanupInterval);
    this.allNotesOff();
    if (this.voiceManager) {
      this.voiceManager.dispose();
    }
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => {
        console.error("Error closing audio context:", e);
      });
    }
  }
}
