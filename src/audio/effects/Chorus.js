export default class Chorus {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.enabled = false;
    
    // Create multiple delay lines for richer chorus effect
    this.delay1 = audioContext.createDelay(0.1);
    this.delay2 = audioContext.createDelay(0.1);
    this.delay3 = audioContext.createDelay(0.1);
    
    // Create LFOs for modulation
    this.lfo1 = audioContext.createOscillator();
    this.lfo2 = audioContext.createOscillator();
    this.lfo3 = audioContext.createOscillator();
    
    this.lfoGain1 = audioContext.createGain();
    this.lfoGain2 = audioContext.createGain();
    this.lfoGain3 = audioContext.createGain();
    
    // Output mixers for each delay line
    this.delayMix1 = audioContext.createGain();
    this.delayMix2 = audioContext.createGain();
    this.delayMix3 = audioContext.createGain();
    
    this.setupChorus();
    this.setDefaults();
  }

  setupChorus() {
    // Set up LFO frequencies (slightly different for richer sound)
    this.lfo1.type = 'sine';
    this.lfo2.type = 'sine';
    this.lfo3.type = 'sine';
    
    this.lfo1.frequency.value = 0.5;
    this.lfo2.frequency.value = 0.7;
    this.lfo3.frequency.value = 0.9;
    
    // Set base delay times
    this.delay1.delayTime.value = 0.015;
    this.delay2.delayTime.value = 0.025;
    this.delay3.delayTime.value = 0.035;
    
    // Connect LFOs to delay modulation
    this.lfo1.connect(this.lfoGain1);
    this.lfo2.connect(this.lfoGain2);
    this.lfo3.connect(this.lfoGain3);
    
    this.lfoGain1.connect(this.delay1.delayTime);
    this.lfoGain2.connect(this.delay2.delayTime);
    this.lfoGain3.connect(this.delay3.delayTime);
    
    // Set up signal routing
    // Dry signal
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Wet signals through delays
    this.input.connect(this.delay1);
    this.input.connect(this.delay2);
    this.input.connect(this.delay3);
    
    this.delay1.connect(this.delayMix1);
    this.delay2.connect(this.delayMix2);
    this.delay3.connect(this.delayMix3);
    
    this.delayMix1.connect(this.wetGain);
    this.delayMix2.connect(this.wetGain);
    this.delayMix3.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Start LFOs
    this.lfo1.start();
    this.lfo2.start();
    this.lfo3.start();
  }

  setParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch (param) {
      case 'rate':
        this.rate = Math.max(0, Math.min(1, value));
        const rateHz = 0.1 + (this.rate * 2);
        this.lfo1.frequency.setValueAtTime(rateHz, now);
        this.lfo2.frequency.setValueAtTime(rateHz * 1.4, now);
        this.lfo3.frequency.setValueAtTime(rateHz * 1.8, now);
        break;
      case 'depth':
        this.depth = Math.max(0, Math.min(1, value));
        const depthAmount = this.depth * 0.005;
        this.lfoGain1.gain.setValueAtTime(depthAmount, now);
        this.lfoGain2.gain.setValueAtTime(depthAmount, now);
        this.lfoGain3.gain.setValueAtTime(depthAmount, now);
        break;
      case 'mix':
        this.mix = Math.max(0, Math.min(1, value));
        if (this.enabled) {
          this.wetGain.gain.setValueAtTime(this.mix * 0.3, now); // Scale down to prevent too loud
          this.dryGain.gain.setValueAtTime(1 - (this.mix * 0.3), now);
        }
        break;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    const now = this.audioContext.currentTime;
    
    if (enabled) {
      this.wetGain.gain.setValueAtTime(this.mix * 0.3, now);
      this.dryGain.gain.setValueAtTime(1 - (this.mix * 0.3), now);
    } else {
      this.wetGain.gain.setValueAtTime(0, now);
      this.dryGain.gain.setValueAtTime(1, now);
    }
  }

  setDefaults() {
    this.rate = 0.5;
    this.depth = 0.3;
    this.mix = 0.5;
    
    // Set equal mix for each delay line
    this.delayMix1.gain.value = 0.33;
    this.delayMix2.gain.value = 0.33;
    this.delayMix3.gain.value = 0.33;
    
    this.setParam('rate', this.rate);
    this.setParam('depth', this.depth);
    this.setParam('mix', this.mix);
  }

  getDefaults() {
    return { 
      rate: 0.5, 
      depth: 0.3, 
      mix: 0.5 
    };
  }

  dispose() {
    try {
      this.lfo1.stop();
      this.lfo2.stop();
      this.lfo3.stop();
      
      this.input.disconnect();
      this.output.disconnect();
      this.wetGain.disconnect();
      this.dryGain.disconnect();
      this.delay1.disconnect();
      this.delay2.disconnect();
      this.delay3.disconnect();
      this.lfo1.disconnect();
      this.lfo2.disconnect();
      this.lfo3.disconnect();
      this.lfoGain1.disconnect();
      this.lfoGain2.disconnect();
      this.lfoGain3.disconnect();
      this.delayMix1.disconnect();
      this.delayMix2.disconnect();
      this.delayMix3.disconnect();
    } catch (e) {
      console.error('Error disposing chorus effect:', e);
    }
  }
}
