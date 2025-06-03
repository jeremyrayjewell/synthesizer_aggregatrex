export default class Delay {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.enabled = false;
    
    // Create delay line
    this.delayNode = audioContext.createDelay(2.0); // Up to 2 seconds
    this.feedbackGain = audioContext.createGain();
    
    // High-frequency damping filter for more natural sound
    this.dampingFilter = audioContext.createBiquadFilter();
    this.dampingFilter.type = 'lowpass';
    this.dampingFilter.frequency.value = 5000;
    this.dampingFilter.Q.value = 0.5;
    
    this.setupDelay();
    this.setDefaults();
  }

  setupDelay() {
    // Dry signal
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Wet signal with feedback
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.dampingFilter);
    this.dampingFilter.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Feedback loop
    this.dampingFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
  }

  setParam(param, value) {
    const now = this.audioContext.currentTime;
    
    switch (param) {
      case 'time':
        this.time = Math.max(0.001, Math.min(2.0, value));
        this.delayNode.delayTime.setValueAtTime(this.time, now);
        break;
      case 'feedback':
        this.feedback = Math.max(0, Math.min(0.95, value)); // Limit to prevent runaway feedback
        this.feedbackGain.gain.setValueAtTime(this.feedback, now);
        break;
      case 'mix':
        this.mix = Math.max(0, Math.min(1, value));
        if (this.enabled) {
          this.wetGain.gain.setValueAtTime(this.mix, now);
          this.dryGain.gain.setValueAtTime(1 - this.mix, now);
        }
        break;
      case 'damping':
        this.damping = Math.max(0, Math.min(1, value));
        // Lower damping = higher cutoff frequency
        const cutoff = 1000 + (1 - this.damping) * 9000;
        this.dampingFilter.frequency.setValueAtTime(cutoff, now);
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
    this.time = 0.3;
    this.feedback = 0.3;
    this.mix = 0.3;
    this.damping = 0.5;
    
    this.setParam('time', this.time);
    this.setParam('feedback', this.feedback);
    this.setParam('mix', this.mix);
    this.setParam('damping', this.damping);
  }

  getDefaults() {
    return { 
      time: 0.3, 
      feedback: 0.3, 
      mix: 0.3,
      damping: 0.5
    };
  }

  dispose() {
    try {
      this.input.disconnect();
      this.output.disconnect();
      this.wetGain.disconnect();
      this.dryGain.disconnect();
      this.delayNode.disconnect();
      this.feedbackGain.disconnect();
      this.dampingFilter.disconnect();
    } catch (e) {
      console.error('Error disposing delay effect:', e);
    }
  }
}
