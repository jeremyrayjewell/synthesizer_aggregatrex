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
      this.oscillator = this.audioContext.createOscillator();
    } catch (e) {
      console.error("Failed to create oscillator:", e);
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
  }

  /**
   * Configure all audio nodes with parameters
   */
  configureAudioNodes() {
    const now = this.audioContext.currentTime;

    // Configure oscillator
    try {
      this.oscillator.type = this.options.waveform || 'sawtooth';
    } catch (e) {
      console.error("Failed to set oscillator type:", e);
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
  }

  /**
   * Connect all audio nodes in the chain
   */
  connectAudioNodes() {
    try {
      // Connect nodes: oscillator → filter → gain → output
      this.oscillator.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.outputNode);
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
      this.oscillator.frequency.setValueAtTime(freq, now);
      this.oscillator.start(now);
      
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
        this.oscillator.stop(now + 0.02);
        
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
        this.oscillator.stop(now + safeRelease + 0.05);
        
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
      
      // Disconnect oscillator
      if (this.oscillator) {
        try {
          this.oscillator.disconnect();
          // Null the reference to aid garbage collection
          this.oscillator = null;
        } catch (e) {
          console.error("Error disconnecting oscillator:", e);
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
      
      // Clear any pending timeouts
      if (this.scheduledStop) {
        clearTimeout(this.scheduledStop);
        this.scheduledStop = null;
      }
    } catch (e) {
      console.error("Error disconnecting audio nodes:", e);
    }
  }
}
