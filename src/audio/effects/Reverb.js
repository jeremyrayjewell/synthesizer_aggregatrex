export default class Reverb {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.enabled = false;
    
    // Create convolver for reverb
    this.convolverNode = audioContext.createConvolver();
    
    // Create a simple algorithmic reverb using delays and filters
    this.preDelay = audioContext.createDelay(0.1);
    this.highCut = audioContext.createBiquadFilter();
    this.lowCut = audioContext.createBiquadFilter();
    
    this.setupReverb();
    this.createImpulseResponse();
    this.setDefaults();
  }

  setupReverb() {
    // Configure filters
    this.highCut.type = 'lowpass';
    this.highCut.frequency.value = 8000;
    this.highCut.Q.value = 0.5;
    
    this.lowCut.type = 'highpass';
    this.lowCut.frequency.value = 200;
    this.lowCut.Q.value = 0.5;
    
    // Dry signal
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Wet signal through reverb
    this.input.connect(this.preDelay);
    this.preDelay.connect(this.lowCut);
    this.lowCut.connect(this.highCut);
    this.highCut.connect(this.convolverNode);
    this.convolverNode.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }

  createImpulseResponse(duration = 3, decay = 2) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      }
    }
    
    this.convolverNode.buffer = impulse;
  }

  setParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch (param) {
      case 'size':
        this.size = Math.max(0, Math.min(1, value));
        // Recreate impulse response with new size
        const duration = 0.5 + (this.size * 4.5); // 0.5 to 5 seconds
        this.createImpulseResponse(duration, this.decay);
        break;
      case 'decay':
        this.decay = Math.max(0.1, Math.min(5, value));
        // Recreate impulse response with new decay
        const size = 0.5 + (this.size * 4.5);
        this.createImpulseResponse(size, this.decay);
        break;
      case 'mix':
        this.mix = Math.max(0, Math.min(1, value));
        if (this.enabled) {
          this.wetGain.gain.setValueAtTime(this.mix * 0.5, now); // Scale down to prevent too loud
          this.dryGain.gain.setValueAtTime(1 - (this.mix * 0.3), now);
        }
        break;
      case 'predelay':
        this.predelay = Math.max(0, Math.min(0.1, value));
        this.preDelay.delayTime.setValueAtTime(this.predelay, now);
        break;
      case 'damping':
        this.damping = Math.max(0, Math.min(1, value));
        // Higher damping = lower high frequency cutoff
        const highCutoff = 2000 + (1 - this.damping) * 8000;
        this.highCut.frequency.setValueAtTime(highCutoff, now);
        break;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const now = this.audioContext.currentTime;
    
    if (enabled) {
      this.wetGain.gain.setValueAtTime(this.mix * 0.5, now);
      this.dryGain.gain.setValueAtTime(1 - (this.mix * 0.3), now);
    } else {
      this.wetGain.gain.setValueAtTime(0, now);
      this.dryGain.gain.setValueAtTime(1, now);
    }
  }

  setDefaults() {
    this.size = 0.5;
    this.decay = 2;
    this.mix = 0.3;
    this.predelay = 0.02;
    this.damping = 0.3;
    
    this.setParam('size', this.size);
    this.setParam('decay', this.decay);
    this.setParam('mix', this.mix);
    this.setParam('predelay', this.predelay);
    this.setParam('damping', this.damping);
  }

  getDefaults() {
    return { 
      size: 0.5, 
      decay: 2, 
      mix: 0.3,
      predelay: 0.02,
      damping: 0.3
    };
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.wetGain.disconnect();
      this.dryGain.disconnect();
      this.convolverNode.disconnect();
      this.preDelay.disconnect();
      this.highCut.disconnect();
      this.lowCut.disconnect();
    } catch (e) {
      console.error('Error disposing reverb effect:', e);
    }
  }
}
