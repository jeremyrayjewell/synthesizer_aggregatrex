export default class EQ {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.enabled = false;
    
    // Create 3-band EQ
    this.lowShelf = audioContext.createBiquadFilter();
    this.midPeaking = audioContext.createBiquadFilter();
    this.highShelf = audioContext.createBiquadFilter();
    
    this.setupEQ();
    this.setDefaults();
  }

  setupEQ() {
    // Configure filter types
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 320;
    
    this.midPeaking.type = 'peaking';
    this.midPeaking.frequency.value = 1000;
    this.midPeaking.Q.value = 1;
    
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 3200;
    
    // Chain the filters
    this.input.connect(this.lowShelf);
    this.lowShelf.connect(this.midPeaking);
    this.midPeaking.connect(this.highShelf);
    this.highShelf.connect(this.output);
  }

  setParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch (param) {
      case 'lowGain':
        this.lowGain = Math.max(-20, Math.min(20, value));
        this.lowShelf.gain.setValueAtTime(this.lowGain, now);
        break;
      case 'lowFreq':
        this.lowFreq = Math.max(50, Math.min(500, value));
        this.lowShelf.frequency.setValueAtTime(this.lowFreq, now);
        break;
      case 'midGain':
        this.midGain = Math.max(-20, Math.min(20, value));
        this.midPeaking.gain.setValueAtTime(this.midGain, now);
        break;
      case 'midFreq':
        this.midFreq = Math.max(200, Math.min(5000, value));
        this.midPeaking.frequency.setValueAtTime(this.midFreq, now);
        break;
      case 'midQ':
        this.midQ = Math.max(0.1, Math.min(10, value));
        this.midPeaking.Q.setValueAtTime(this.midQ, now);
        break;
      case 'highGain':
        this.highGain = Math.max(-20, Math.min(20, value));
        this.highShelf.gain.setValueAtTime(this.highGain, now);
        break;
      case 'highFreq':
        this.highFreq = Math.max(1000, Math.min(10000, value));
        this.highShelf.frequency.setValueAtTime(this.highFreq, now);
        break;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const now = this.audioContext.currentTime;
    
    if (!enabled) {
      // Reset all gains to 0 (flat response) when disabled
      this.lowShelf.gain.setValueAtTime(0, now);
      this.midPeaking.gain.setValueAtTime(0, now);
      this.highShelf.gain.setValueAtTime(0, now);
    } else {
      // Restore the gain settings
      this.lowShelf.gain.setValueAtTime(this.lowGain, now);
      this.midPeaking.gain.setValueAtTime(this.midGain, now);
      this.highShelf.gain.setValueAtTime(this.highGain, now);
    }
  }

  setDefaults() {
    this.lowGain = 0;
    this.lowFreq = 320;
    this.midGain = 0;
    this.midFreq = 1000;
    this.midQ = 1;
    this.highGain = 0;
    this.highFreq = 3200;
    
    this.setParam('lowGain', this.lowGain);
    this.setParam('lowFreq', this.lowFreq);
    this.setParam('midGain', this.midGain);
    this.setParam('midFreq', this.midFreq);
    this.setParam('midQ', this.midQ);
    this.setParam('highGain', this.highGain);
    this.setParam('highFreq', this.highFreq);
  }

  getDefaults() {
    return { 
      lowGain: 0,
      lowFreq: 320,
      midGain: 0,
      midFreq: 1000,
      midQ: 1,
      highGain: 0,
      highFreq: 3200
    };
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.lowShelf.disconnect();
      this.midPeaking.disconnect();
      this.highShelf.disconnect();
    } catch (e) {
      console.error('Error disposing EQ effect:', e);
    }
  }
}
