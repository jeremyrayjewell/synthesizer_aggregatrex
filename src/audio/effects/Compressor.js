export default class Compressor {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.enabled = false;
    
    // Create compressor node
    this.compressorNode = audioContext.createDynamicsCompressor();
    
    // Create makeup gain to compensate for compression
    this.makeupGain = audioContext.createGain();
    
    this.setupCompressor();
    this.setDefaults();
  }

  setupCompressor() {
    // Route signal through compressor when enabled, bypass when disabled
    this.input.connect(this.compressorNode);
    this.compressorNode.connect(this.makeupGain);
    this.makeupGain.connect(this.output);
    
    // Also create bypass route
    this.input.connect(this.output);
    this.setEnabled(false); // Start bypassed
  }

  setParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch (param) {
      case 'threshold':
        this.threshold = Math.max(-60, Math.min(0, value));
        this.compressorNode.threshold.setValueAtTime(this.threshold, now);
        break;
      case 'ratio':
        this.ratio = Math.max(1, Math.min(20, value));
        this.compressorNode.ratio.setValueAtTime(this.ratio, now);
        break;
      case 'attack':
        this.attack = Math.max(0, Math.min(1, value));
        this.compressorNode.attack.setValueAtTime(this.attack, now);
        break;
      case 'release':
        this.release = Math.max(0, Math.min(1, value));
        this.compressorNode.release.setValueAtTime(this.release, now);
        break;
      case 'makeup':
        this.makeup = Math.max(0, Math.min(2, value));
        this.makeupGain.gain.setValueAtTime(this.makeup, now);
        break;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const now = this.audioContext.currentTime;
    
    if (enabled) {
      // Disconnect bypass, enable compressor path
      try {
        this.input.disconnect(this.output);
      } catch (e) {}
      this.makeupGain.gain.setValueAtTime(this.makeup, now);
    } else {
      // Enable bypass, disconnect compressor
      this.input.connect(this.output);
      this.makeupGain.gain.setValueAtTime(0, now);
    }
  }

  setDefaults() {
    this.threshold = -24;
    this.ratio = 4;
    this.attack = 0.003;
    this.release = 0.25;
    this.makeup = 1.2;
    
    this.setParam('threshold', this.threshold);
    this.setParam('ratio', this.ratio);
    this.setParam('attack', this.attack);
    this.setParam('release', this.release);
    this.setParam('makeup', this.makeup);
  }

  getDefaults() {
    return { 
      threshold: -24, 
      ratio: 4, 
      attack: 0.003,
      release: 0.25,
      makeup: 1.2
    };
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.compressorNode.disconnect();
      this.makeupGain.disconnect();
    } catch (e) {
      console.error('Error disposing compressor effect:', e);
    }
  }
}
