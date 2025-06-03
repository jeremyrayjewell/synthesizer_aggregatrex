export default class Distortion {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.enabled = false;
    
    // Create waveshaper for distortion
    this.waveshaper = audioContext.createWaveShaper();
    this.waveshaper.curve = this.makeDistortionCurve(0);
    this.waveshaper.oversample = '4x';
    
    // Create filter to smooth harsh frequencies
    this.filter = audioContext.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 8000;
    this.filter.Q.value = 0.5;
    
    this.setupRouting();
    this.setDefaults();
  }

  setupRouting() {
    // Dry signal path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Wet signal path
    this.input.connect(this.waveshaper);
    this.waveshaper.connect(this.filter);
    this.filter.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }

  makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      if (amount === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      }
    }
    
    return curve;
  }

  setParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch (param) {
      case 'drive':
        this.drive = Math.max(0, Math.min(1, value));
        this.waveshaper.curve = this.makeDistortionCurve(this.drive * 50);
        break;
      case 'tone':
        this.tone = Math.max(0, Math.min(1, value));
        this.filter.frequency.setValueAtTime(500 + (this.tone * 7500), now);
        break;
      case 'mix':
        this.mix = Math.max(0, Math.min(1, value));
        if (this.enabled) {
          this.wetGain.gain.setValueAtTime(this.mix, now);
          this.dryGain.gain.setValueAtTime(1 - this.mix, now);
        }
        break;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const now = this.audioContext.currentTime;
    
    if (enabled) {
      this.wetGain.gain.setValueAtTime(this.mix, now);
      this.dryGain.gain.setValueAtTime(1 - this.mix, now);
    } else {
      this.wetGain.gain.setValueAtTime(0, now);
      this.dryGain.gain.setValueAtTime(1, now);
    }
  }

  setDefaults() {
    this.drive = 0.3;
    this.tone = 0.5;
    this.mix = 0.5;
    this.setParam('drive', this.drive);
    this.setParam('tone', this.tone);
    this.setParam('mix', this.mix);
  }

  getDefaults() {
    return { 
      drive: 0.3, 
      tone: 0.5, 
      mix: 0.5 
    };
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.wetGain.disconnect();
      this.dryGain.disconnect();
      this.waveshaper.disconnect();
      this.filter.disconnect();
    } catch (e) {
      console.error('Error disposing distortion effect:', e);
    }
  }
}
