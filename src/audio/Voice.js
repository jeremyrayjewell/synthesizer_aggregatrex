/**
 * Advanced synthesizer voice with built-in safety mechanisms
 */
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
      // Create nodes with defensive programming
      this.createAudioNodes();
      this.configureAudioNodes();
      this.connectAudioNodes();
    } catch (e) {
      console.error("Failed to initialize voice:", e);
      this.isStopped = true;
      throw e;
    }
  }

  /**
   * Create all audio nodes needed for this voice
   */
  createAudioNodes() {
    // Create nodes with error handling
    try {
      // Create oscillators
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
      // Effects chain
      this.delayNode = this.audioContext.createDelay();
      this.delayFeedback = this.audioContext.createGain();
      this.delayMix = this.audioContext.createGain();
      this.reverbNode = this.audioContext.createConvolver(); // Basic reverb
      this.reverbMix = this.audioContext.createGain();
    } catch (e) {
      console.error("Failed to create effects:", e);
      throw e;
    }
  }

  /**
   * Configure all audio nodes with parameters
   */
  configureAudioNodes() {
    const now = this.audioContext.currentTime;

    // Configure oscillators
    try {
      this.oscillator1.type = this.options.oscillator1Type || 'sawtooth';
      this.oscillator2.type = this.options.oscillator2Type || 'square';
      
      // Set detune values
      this.oscillator1.detune.value = this.options.oscillator1Detune || 0;
      this.oscillator2.detune.value = this.options.oscillator2Detune || 0;
      
      // Set oscillator mix levels
      this.oscMixer1.gain.value = this.options.oscillator1Mix || 0.5;
      this.oscMixer2.gain.value = this.options.oscillator2Mix || 0.5;
    } catch (e) {
      console.error("Failed to configure oscillators:", e);
    }

    // Configure gain (envelope starts at 0)
    try {
      this.gainNode.gain.value = 0;
      this.gainNode.gain.setValueAtTime(0, now);
    } catch (e) {
      console.error("Failed to configure gain node:", e);
    }

    // Configure filter
    try {
      this.filter.type = this.options.filterType || 'lowpass';
      this.filter.frequency.value = this.options.filterCutoff || 2000;
      this.filter.Q.value = this.options.filterQ || 1;
    } catch (e) {
      console.error("Failed to configure filter:", e);
    }
    
    // Configure effects
    try {
      this.delayNode.delayTime.value = this.options.delayTime || 0.3;
      this.delayFeedback.gain.value = this.options.delayFeedback || 0.3;
      this.delayMix.gain.value = this.options.delayMix || 0.2;
      this.reverbMix.gain.value = this.options.reverbMix || 0.2;
      
      // TODO: Configure convolver with reverb impulse response based on size
      // For now we'll skip actual reverb implementation
    } catch (e) {
      console.error("Failed to configure effects:", e);
    }
  }

  /**
   * Connect all audio nodes in the chain
   */
  connectAudioNodes() {
    try {
      // Connect oscillators to their mixers
      this.oscillator1.connect(this.oscMixer1);
      this.oscillator2.connect(this.oscMixer2);
      
      // Connect mixers to filter
      this.oscMixer1.connect(this.filter);
      this.oscMixer2.connect(this.filter);
      
      // Main signal path
      this.filter.connect(this.gainNode);
      
      // Effects chain
      const drySignal = this.gainNode;
      
      // Delay chain
      drySignal.connect(this.delayNode);
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.delayMix);
      
      // Reverb chain
      drySignal.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbMix);
      
      // Mix everything to output
      drySignal.connect(this.outputNode);
      this.delayMix.connect(this.outputNode);
      this.reverbMix.connect(this.outputNode);
    } catch (e) {
      console.error("Failed to connect audio nodes:", e);
      throw e;
    }
  }

  /**
   * Start the voice with a given MIDI note number
   */  start(noteNumber) {
    if (this.isStopped || this.isPlaying) {
      console.warn("Attempted to start a voice that is already playing or stopped");
      return;
    }

    const now = this.audioContext.currentTime;
    
    try {
      // Convert MIDI note to frequency
      const freq = 440 * Math.pow(2, (noteNumber - 69) / 12);
      
      // Set frequency and start oscillator
      this.oscillator1.frequency.setValueAtTime(freq, now);
      this.oscillator2.frequency.setValueAtTime(freq, now);
      this.oscillator1.start(now);
      this.oscillator2.start(now);
      
      // Apply envelope: attack → decay → sustain
      const { attack, decay, sustain, velocity } = this.options;
      const peak = velocity || 1.0;
      const sustainLevel = sustain * peak;
      
      // Use minimum attack time to avoid clicks
      const safeAttack = Math.max(0.005, attack);
      
      // Cancel any previous automation
      this.gainNode.gain.cancelScheduledValues(now);
      
      // Apply envelope
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(peak, now + safeAttack);
      this.gainNode.gain.linearRampToValueAtTime(sustainLevel, now + safeAttack + decay);
      
      // Mark as playing
      this.isPlaying = true;
      
      // Set a safety timeout to stop the voice after 15 seconds (reduced from 30)
      // This prevents stuck notes in worst-case scenarios
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

  /**
   * Stop the voice with release envelope
   * @param {boolean} immediate - If true, stop immediately without release
   */
  stop(immediate = false) {
    // Prevent multiple calls to stop
    if (this.isStopped) {
      return;
    }
    
    const now = this.audioContext.currentTime;
    
    try {
      // Clear any scheduled stop
      if (this.scheduledStop) {
        clearTimeout(this.scheduledStop);
        this.scheduledStop = null;
      }
      
      // Mark release start time for cleanup
      this.releaseStartTime = now;
      
      // Cancel any previous automation
      this.gainNode.gain.cancelScheduledValues(now);
      
      // Get current gain value
      const currentGain = this.gainNode.gain.value;
      this.gainNode.gain.setValueAtTime(currentGain, now);
        if (immediate) {
        // Immediate stop (10ms fade out to avoid clicks)
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
        
        // Stop oscillator after short fade
        this.oscillator1.stop(now + 0.02);
        this.oscillator2.stop(now + 0.02);
        
        // Schedule cleanup
        setTimeout(() => this.disconnect(), 50);
      } else {
        // Normal release
        const { release } = this.options;
        // Cap maximum release time to avoid excessive polyphony consumption
        const safeRelease = Math.min(Math.max(0.01, release), 2.0);
        
        // Apply release envelope
        this.gainNode.gain.linearRampToValueAtTime(0, now + safeRelease);
        
        // Stop oscillator after release
        this.oscillator1.stop(now + safeRelease + 0.05);
        this.oscillator2.stop(now + safeRelease + 0.05);
        
        // Schedule cleanup after release
        setTimeout(() => this.disconnect(), (safeRelease + 0.1) * 1000);
      }
      
      // Mark as stopped
      this.isStopped = true;
      this.isPlaying = false;
    } catch (e) {
      console.error("Error stopping voice:", e);
      
      // Force disconnect on error
      try {
        this.disconnect();
      } catch (disconnectError) {
        console.error("Error disconnecting after stop error:", disconnectError);
      }
      
      // Mark as stopped
      this.isStopped = true;
      this.isPlaying = false;
    }
  }
  /**
   * Disconnect all audio nodes
   */
  disconnect() {
    try {
      // Set internal flags to prevent any further operations
      this.isPlaying = false;
      this.isStopped = true;
      
      // Disconnect oscillators
      if (this.oscillator1) {
        try {
          this.oscillator1.disconnect();
          // Null the reference to aid garbage collection
          this.oscillator1 = null;
        } catch (e) {
          console.error("Error disconnecting oscillator1:", e);
        }
      }
      
      if (this.oscillator2) {
        try {
          this.oscillator2.disconnect();
          // Null the reference to aid garbage collection
          this.oscillator2 = null;
        } catch (e) {
          console.error("Error disconnecting oscillator2:", e);
        }
      }
      
      // Disconnect gain node
      if (this.gainNode) {
        try {
          this.gainNode.disconnect();
          // Null the reference to aid garbage collection
          this.gainNode = null;
        } catch (e) {
          console.error("Error disconnecting gain node:", e);
        }
      }
      
      // Disconnect filter
      if (this.filter) {
        try {
          this.filter.disconnect();
          // Null the reference to aid garbage collection
          this.filter = null;
        } catch (e) {
          console.error("Error disconnecting filter:", e);
        }
      }
      
      // Disconnect effects
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
      
      // Clear any pending timeouts
      if (this.scheduledStop) {
        clearTimeout(this.scheduledStop);
        this.scheduledStop = null;
      }
    } catch (e) {
      console.error("Error disconnecting audio nodes:", e);
    }
  }
  
  /**
   * Update a parameter in real-time
   */
  updateParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch(param) {
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
