import Voice from './Voice';

export default class SynthEngine {
  constructor(audioContext = new (window.AudioContext || window.webkitAudioContext)()) {
    this.audioContext = audioContext;
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);

    this.activeVoices = new Map();
    this.parameters = {
      waveform: 'sawtooth',
      attack: 0.01,
      decay: 0.2,
      sustain: 0.7,
      release: 0.5,
      filterType: 'lowpass',
      filterCutoff: 2000,
      filterQ: 1,
    };
  }

  noteOn(note, velocity = 127) {
    if (this.activeVoices.has(note)) return; // Avoid duplicate notes

    const voice = new Voice(this.audioContext, this.masterGain, {
      ...this.parameters,
      velocity: velocity / 127
    });
    voice.start(note);
    this.activeVoices.set(note, voice);
  }

  noteOff(note) {
    const voice = this.activeVoices.get(note);
    if (voice) {
      voice.stop();
      this.activeVoices.delete(note);
    }
  }

  setParam(param, value) {
    if (this.parameters.hasOwnProperty(param)) {
      this.parameters[param] = value;
    }
  }

  setWaveform(type) {
    this.parameters.waveform = type;
  }

  setFilter(type, cutoff, q) {
    this.parameters.filterType = type;
    this.parameters.filterCutoff = cutoff;
    this.parameters.filterQ = q;
  }

  setEnvelope(attack, decay, sustain, release) {
    this.parameters.attack = attack;
    this.parameters.decay = decay;
    this.parameters.sustain = sustain;
    this.parameters.release = release;
  }
}
