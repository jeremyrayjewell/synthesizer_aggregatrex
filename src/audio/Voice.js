export default class Voice {
  constructor(audioContext, outputNode, options) {
    this.audioContext = audioContext;
    this.outputNode = outputNode;
    this.options = options;

    // Create nodes
    this.oscillator = audioContext.createOscillator();
    this.gainNode = audioContext.createGain();
    this.filter = audioContext.createBiquadFilter();

    // Configure oscillator
    this.oscillator.type = options.waveform || 'sawtooth';

    // Configure gain (envelope starts at 0)
    this.gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    // Configure filter
    this.filter.type = options.filterType || 'lowpass';
    this.filter.frequency.value = options.filterCutoff || 2000;
    this.filter.Q.value = options.filterQ || 1;

    // Connect nodes: oscillator → filter → gain → output
    this.oscillator.connect(this.filter);
    this.filter.connect(this.gainNode);
    this.gainNode.connect(this.outputNode);
  }

  start(noteNumber) {
    const now = this.audioContext.currentTime;
    const freq = 440 * Math.pow(2, (noteNumber - 69) / 12); // MIDI to frequency

    this.oscillator.frequency.setValueAtTime(freq, now);
    this.oscillator.start(now);

    // Envelope: attack → decay → sustain
    const { attack, decay, sustain, velocity } = this.options;
    const peak = velocity || 1.0;
    const sustainLevel = sustain * peak;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(peak, now + attack);
    this.gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
  }

  stop() {
    const now = this.audioContext.currentTime;
    const { release } = this.options;

    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + release);

    this.oscillator.stop(now + release + 0.05); // slight buffer
    setTimeout(() => {
      this.oscillator.disconnect();
      this.gainNode.disconnect();
      this.filter.disconnect();
    }, (release + 0.1) * 1000);
  }
}
