/**
 * VoiceMonitor - Utility for tracking and debugging voice polyphony issues
 * Helps diagnose polyphony choking and provides real-time stats
 */

class VoiceMonitor {
  constructor() {
    this.stats = {
      maxVoicesEver: 0,
      voiceSteals: 0,
      voiceReleases: 0,
      voiceCreations: 0,
      emergencyCleanups: 0,
      lastPolyphonyChoke: null
    };
    
    this.currentVoiceCount = 0;
    this.enabled = true;
  }
  
  /**
   * Update voice count
   */
  updateVoiceCount(count) {
    this.currentVoiceCount = count;
    
    // Track max voices ever seen
    if (count > this.stats.maxVoicesEver) {
      this.stats.maxVoicesEver = count;
    }
  }
  
  /**
   * Record a voice steal event
   */
  recordVoiceSteal() {
    this.stats.voiceSteals++;
  }
  
  /**
   * Record a voice release event
   */
  recordVoiceRelease() {
    this.stats.voiceReleases++;
  }
  
  /**
   * Record a voice creation event
   */
  recordVoiceCreation() {
    this.stats.voiceCreations++;
  }
  
  /**
   * Record an emergency cleanup event
   */
  recordEmergencyCleanup() {
    this.stats.emergencyCleanups++;
    this.stats.lastPolyphonyChoke = new Date();
  }
  
  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      currentVoiceCount: this.currentVoiceCount
    };
  }
  
  /**
   * Reset stats
   */
  resetStats() {
    this.stats = {
      maxVoicesEver: 0,
      voiceSteals: 0,
      voiceReleases: 0,
      voiceCreations: 0,
      emergencyCleanups: 0,
      lastPolyphonyChoke: null
    };
  }
  
  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  /**
   * Log current voice stats
   */
  logStats() {
    if (!this.enabled) return;
    
    console.log('===== Voice Monitor Stats =====');
    console.log(`Current voices: ${this.currentVoiceCount}`);
    console.log(`Max voices ever: ${this.stats.maxVoicesEver}`);
    console.log(`Total voice creations: ${this.stats.voiceCreations}`);
    console.log(`Total voice releases: ${this.stats.voiceReleases}`);
    console.log(`Voice steals: ${this.stats.voiceSteals}`);
    console.log(`Emergency cleanups: ${this.stats.emergencyCleanups}`);
    console.log(`Last polyphony choke: ${this.stats.lastPolyphonyChoke ? this.stats.lastPolyphonyChoke.toISOString() : 'None'}`);
    console.log('==============================');
  }
}

// Create singleton instance
const voiceMonitor = new VoiceMonitor();

export default voiceMonitor;
