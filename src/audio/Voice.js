export default class Voice {
  constructor(audioContext, outputNode, options) {
    this.audioContext = audioContext;
    this.outputNode = outputNode;
    this.options = options;
    this.isStopped = false;
    this.isPlaying = false;
    this.releaseStartTime = null;
    this.scheduledStop = null;

    try {
      this.createAudioNodes();
      this.configureAudioNodes();
      this.connectAudioNodes();
    } catch (e) {
      console.error("Failed to initialize voice:", e);
      this.isStopped = true;
      throw e;
    }
  }

  createAudioNodes() {
    try {
      this.oscillator1 = this.audioContext.createOscillator();
      this.oscillator2 = this.audioContext.createOscillator();
      this.oscMixer1 = this.audioContext.createGain();
      this.oscMixer2 = this.audioContext.createGain();
    } catch (e) {
      console.error("Failed to create oscillators:", e);
      throw e;
    }

    try {
      this.gainNode = this.audioContext.createGain();
    } catch (e) {
      console.error("Failed to create gain node:", e);
      throw e;
    }

    try {
      this.filter = this.audioContext.createBiquadFilter();
    } catch (e) {
      console.error("Failed to create filter:", e);
      throw e;
    }

    try {
      this.delayNode = this.audioContext.createDelay();
      this.delayFeedback = this.audioContext.createGain();
      this.delayMix = this.audioContext.createGain();
      this.reverbNode = this.audioContext.createConvolver();
      this.reverbMix = this.audioContext.createGain();
    } catch (e) {
      console.error("Failed to create effects:", e);
      throw e;
    }
  }

  configureAudioNodes() {
    const now = this.audioContext.currentTime;

    try {
      this.oscillator1.type = this.options.oscillator1Type || 'sawtooth';
      this.oscillator2.type = this.options.oscillator2Type || 'square';
      this.oscillator1.detune.value = this.options.oscillator1Detune || 0;
      this.oscillator2.detune.value = this.options.oscillator2Detune || 0;
      this.oscMixer1.gain.value = this.options.oscillator1Mix || 0.5;
      this.oscMixer2.gain.value = this.options.oscillator2Mix || 0.5;
    } catch (e) {
      console.error("Failed to configure oscillators:", e);
    }

    try {
      this.gainNode.gain.value = 0;
      this.gainNode.gain.setValueAtTime(0, now);
    } catch (e) {
      console.error("Failed to configure gain node:", e);
    }

    try {
      this.filter.type = this.options.filterType || 'lowpass';
      this.filter.frequency.value = this.options.filterCutoff || 2000;
      this.filter.Q.value = this.options.filterQ || 1;
    } catch (e) {
      console.error("Failed to configure filter:", e);
    }

    try {
      this.delayNode.delayTime.value = this.options.delayTime || 0.3;
      this.delayFeedback.gain.value = this.options.delayFeedback || 0.3;
      this.delayMix.gain.value = this.options.delayMix || 0.2;
      this.reverbMix.gain.value = this.options.reverbMix || 0.2;
    } catch (e) {
      console.error("Failed to configure effects:", e);
    }
  }

  connectAudioNodes() {
    try {
      this.oscillator1.connect(this.oscMixer1);
      this.oscillator2.connect(this.oscMixer2);
      this.oscMixer1.connect(this.filter);
      this.oscMixer2.connect(this.filter);
      this.filter.connect(this.gainNode);

      const drySignal = this.gainNode;
      drySignal.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.delayMix);
      drySignal.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbMix);
      drySignal.connect(this.outputNode);
      this.delayMix.connect(this.outputNode);
      this.reverbMix.connect(this.outputNode);
    } catch (e) {
      console.error("Failed to connect audio nodes:", e);
      throw e;
    }
  }

  start(noteNumber) {
    if (this.isStopped || this.isPlaying) {
      console.warn("Attempted to start a voice that is already playing or stopped");
      return;
    }

    const now = this.audioContext.currentTime;

    try {
      const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
      this.oscillator1.frequency.setValueAtTime(freq, now);
      this.oscillator2.frequency.setValueAtTime(freq, now);
      this.oscillator1.start(now);
      this.oscillator2.start(now);

      const { attack, decay, sustain, velocity } = this.options;
      const peak = velocity || 1.0;
      const sustainLevel = sustain * peak;
      const safeAttack = Math.max(0.005, attack);

      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(peak, now + safeAttack);
      this.gainNode.gain.linearRampToValueAtTime(sustainLevel, now + safeAttack + decay);

      this.isPlaying = true;

      this.scheduledStop = setTimeout(() => {
        if (this.isPlaying && !this.isStopped) {
          console.warn("Safety timeout: stopping voice after 15 seconds");
          this.stop(true);
        }
      }, 15000);
    } catch (e) {
      console.error("Error starting voice:", e);
      this.isStopped = true;
      throw e;
    }
  }

  stop(immediate = false) {
    if (this.isStopped) return;
    const now = this.audioContext.currentTime;

    try {
      if (this.scheduledStop) {
        clearTimeout(this.scheduledStop);
        this.scheduledStop = null;
      }

      this.releaseStartTime = now;
      this.gainNode.gain.cancelScheduledValues(now);
      const currentGain = this.gainNode.gain.value;
      this.gainNode.gain.setValueAtTime(currentGain, now);

      if (immediate) {
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
        this.oscillator1.stop(now + 0.02);
        this.oscillator2.stop(now + 0.02);
        setTimeout(() => this.disconnect(), 50);
      } else {
        const { release } = this.options;
        const safeRelease = Math.min(Math.max(0.01, release), 2.0);
        this.gainNode.gain.linearRampToValueAtTime(0, now + safeRelease);
        this.oscillator1.stop(now + safeRelease + 0.05);
        this.oscillator2.stop(now + safeRelease + 0.05);
        setTimeout(() => this.disconnect(), (safeRelease + 0.1) * 1000);
      }

      this.isStopped = true;
      this.isPlaying = false;
    } catch (e) {
      console.error("Error stopping voice:", e);
      try {
        this.disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting after stop error:", disconnectError);
      }
      this.isStopped = true;
      this.isPlaying = false;
    }
  }

  disconnect() {
    try {
      this.isPlaying = false;
      this.isStopped = true;

      if (this.oscillator1) {
        try {
          this.oscillator1.disconnect();
          this.oscillator1 = null;
        } catch (e) {
          console.error("Error disconnecting oscillator1:", e);
        }
      }

      if (this.oscillator2) {
        try {
          this.oscillator2.disconnect();
          this.oscillator2 = null;
        } catch (e) {
          console.error("Error disconnecting oscillator2:", e);
        }
      }

      if (this.gainNode) {
        try {
          this.gainNode.disconnect();
          this.gainNode = null;
        } catch (e) {
          console.error("Error disconnecting gain node:", e);
        }
      }

      if (this.filter) {
        try {
          this.filter.disconnect();
          this.filter = null;
        } catch (e) {
          console.error("Error disconnecting filter:", e);
        }
      }

      if (this.delayNode) {
        try {
          this.delayNode.disconnect();
          this.delayNode = null;
        } catch (e) {
          console.error("Error disconnecting delay node:", e);
        }
      }

      if (this.delayFeedback) {
        try {
          this.delayFeedback.disconnect();
          this.delayFeedback = null;
        } catch (e) {
          console.error("Error disconnecting delay feedback:", e);
        }
      }

      if (this.delayMix) {
        try {
          this.delayMix.disconnect();
          this.delayMix = null;
        } catch (e) {
          console.error("Error disconnecting delay mix:", e);
        }
      }

      if (this.reverbNode) {
        try {
          this.reverbNode.disconnect();
          this.reverbNode = null;
        } catch (e) {
          console.error("Error disconnecting reverb node:", e);
        }
      }

      if (this.reverbMix) {
        try {
          this.reverbMix.disconnect();
          this.reverbMix = null;
        } catch (e) {
          console.error("Error disconnecting reverb mix:", e);
        }
      }

      if (this.scheduledStop) {
        clearTimeout(this.scheduledStop);
        this.scheduledStop = null;
      }
    } catch (e) {
      console.error("Error disconnecting audio nodes:", e);
    }
  }

  updateParam(param, value) {
    const now = this.audioContext.currentTime;

    switch (param) {
      case 'oscillator1Type':
        if (this.oscillator1) this.oscillator1.type = value;
        break;
      case 'oscillator2Type':
        if (this.oscillator2) this.oscillator2.type = value;
        break;
      case 'oscillator1Detune':
        if (this.oscillator1) this.oscillator1.detune.setValueAtTime(value, now);
        break;
      case 'oscillator2Detune':
        if (this.oscillator2) this.oscillator2.detune.setValueAtTime(value, now);
        break;
      case 'oscillator1Mix':
        if (this.oscMixer1) this.oscMixer1.gain.setValueAtTime(value, now);
        break;
      case 'oscillator2Mix':
        if (this.oscMixer2) this.oscMixer2.gain.setValueAtTime(value, now);
        break;
      case 'filterCutoff':
        if (this.filter) this.filter.frequency.setValueAtTime(value, now);
        break;
      case 'filterQ':
        if (this.filter) this.filter.Q.setValueAtTime(value, now);
        break;
      case 'filterType':
        if (this.filter) this.filter.type = value;
        break;
      case 'delayTime':
        if (this.delayNode) this.delayNode.delayTime.setValueAtTime(value, now);
        break;
      case 'delayFeedback':
        if (this.delayFeedback) this.delayFeedback.gain.setValueAtTime(value, now);
        break;
      case 'delayMix':
        if (this.delayMix) this.delayMix.gain.setValueAtTime(value, now);
        break;
      case 'reverbMix':
        if (this.reverbMix) this.reverbMix.gain.setValueAtTime(value, now);
        break;
      default:
        console.warn('Unknown parameter:', param);
    }
  }
}
