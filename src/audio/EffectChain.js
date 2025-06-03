import Distortion from './effects/Distortion.js';
import EQ from './effects/EQ.js';
import Compressor from './effects/Compressor.js';
import Chorus from './effects/Chorus.js';
import Delay from './effects/Delay.js';
import Reverb from './effects/Reverb.js';

export default class EffectChain {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    
    // Initialize effects
    this.distortion = new Distortion(audioContext);
    this.eq = new EQ(audioContext);
    this.compressor = new Compressor(audioContext);
    this.chorus = new Chorus(audioContext);
    this.delay = new Delay(audioContext);
    this.reverb = new Reverb(audioContext);
    
    // Effects order: Input -> Distortion -> EQ -> Compressor -> Chorus -> Delay -> Reverb -> Output
    this.connectEffectsChain();
    
    // Initialize effects parameters with defaults
    this.effects = {
      distortion: { enabled: false, ...this.distortion.getDefaults() },
      eq: { enabled: false, ...this.eq.getDefaults() },
      compressor: { enabled: false, ...this.compressor.getDefaults() },
      chorus: { enabled: false, ...this.chorus.getDefaults() },
      delay: { enabled: false, ...this.delay.getDefaults() },
      reverb: { enabled: false, ...this.reverb.getDefaults() }
    };
    
    console.log('EffectChain initialized with effects:', Object.keys(this.effects));
  }

  connectEffectsChain() {
    this.input.connect(this.distortion.input);
    this.distortion.output.connect(this.eq.input);
    this.eq.output.connect(this.compressor.input);
    this.compressor.output.connect(this.chorus.input);
    this.chorus.output.connect(this.delay.input);
    this.delay.output.connect(this.reverb.input);
    this.reverb.output.connect(this.output);
  }

  setEffectParam(effectName, paramName, value) {
    if (this.effects[effectName] && this[effectName]) {
      this.effects[effectName][paramName] = value;
      this[effectName].setParam(paramName, value);
      console.log(`Set ${effectName}.${paramName} = ${value}`);
    } else {
      console.warn(`Unknown effect or parameter: ${effectName}.${paramName}`);
    }
  }

  toggleEffect(effectName, enabled) {
    if (this.effects[effectName] && this[effectName]) {
      this.effects[effectName].enabled = enabled;
      this[effectName].setEnabled(enabled);
      console.log(`${effectName} ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      console.warn(`Unknown effect: ${effectName}`);
    }
  }

  getEffectParams(effectName) {
    return this.effects[effectName] || null;
  }

  getAllEffects() {
    return { ...this.effects };
  }

  // Preset management
  setPreset(presetName) {
    const presets = {
      clean: {
        distortion: { enabled: false },
        eq: { enabled: false },
        compressor: { enabled: false },
        chorus: { enabled: false },
        delay: { enabled: false },
        reverb: { enabled: false }
      },
      vintage: {
        distortion: { enabled: true, drive: 0.2, tone: 0.6, mix: 0.3 },
        eq: { enabled: true, lowGain: 2, midGain: -1, highGain: 1 },
        compressor: { enabled: true, threshold: -18, ratio: 3, makeup: 1.1 },
        chorus: { enabled: false },
        delay: { enabled: true, time: 0.25, feedback: 0.2, mix: 0.15 },
        reverb: { enabled: true, size: 0.3, mix: 0.2 }
      },
      ambient: {
        distortion: { enabled: false },
        eq: { enabled: true, lowGain: -2, midGain: 0, highGain: 3 },
        compressor: { enabled: false },
        chorus: { enabled: true, rate: 0.3, depth: 0.4, mix: 0.4 },
        delay: { enabled: true, time: 0.5, feedback: 0.4, mix: 0.3 },
        reverb: { enabled: true, size: 0.8, mix: 0.5 }
      },
      aggressive: {
        distortion: { enabled: true, drive: 0.7, tone: 0.4, mix: 0.6 },
        eq: { enabled: true, lowGain: 3, midGain: 2, highGain: 1 },
        compressor: { enabled: true, threshold: -12, ratio: 6, makeup: 1.3 },
        chorus: { enabled: false },
        delay: { enabled: false },
        reverb: { enabled: true, size: 0.2, mix: 0.1 }
      }
    };

    const preset = presets[presetName];
    if (preset) {
      Object.entries(preset).forEach(([effectName, params]) => {
        Object.entries(params).forEach(([paramName, value]) => {
          if (paramName === 'enabled') {
            this.toggleEffect(effectName, value);
          } else {
            this.setEffectParam(effectName, paramName, value);
          }
        });
      });
      console.log(`Applied preset: ${presetName}`);
    } else {
      console.warn(`Unknown preset: ${presetName}`);
    }
  }

  dispose() {
    console.log('Disposing EffectChain');
    
    try {
      this.distortion.dispose();
      this.eq.dispose();
      this.compressor.dispose();
      this.chorus.dispose();
      this.delay.dispose();
      this.reverb.dispose();
      
      this.input.disconnect();
      this.output.disconnect();
    } catch (e) {
      console.error('Error disposing EffectChain:', e);
    }
  }
}
