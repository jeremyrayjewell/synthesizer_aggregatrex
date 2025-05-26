/**
 * MIDIVoiceManager - Advanced MIDI voice management for synthesizers
 * Handles voice allocation, scheduling, and ensuring no stuck notes
 */
import voiceMonitor from '../utils/voiceMonitor';

class MIDIVoiceManager {  constructor(audioContext) {
    this.audioContext = audioContext;
    this.activeVoices = new Map(); // Note number -> array of voices
    this.pendingReleases = new Map(); // Note number -> array of timeout IDs
    this.scheduledVoices = new Map(); // Scheduled voices for future start
    this.releasedVoices = new Set(); // Set of voice objects in release phase
    this.voiceCount = 0;
    this.maxVoices = 32;
    this.lastNoteOnTime = new Map(); // Note number -> timestamp
    this.CLEANUP_INTERVAL = 2000; // Reduced from 5000ms to 2000ms for more frequent cleanup
    
    // Start the cleanup interval
    this.cleanupInterval = setInterval(() => this.performCleanup(), this.CLEANUP_INTERVAL);
  }
  /**
   * Create a new voice
   */
  createVoice(note, velocity, voiceFactory) {
    // Voice management - track when this note was activated
    this.lastNoteOnTime.set(note, this.audioContext.currentTime);
    
    // Pre-emptively check if we need to steal voices
    if (this.voiceCount >= this.maxVoices - 1) {
      console.log(`Approaching voice limit (${this.voiceCount}/${this.maxVoices}), stealing oldest voice`);
      this.stealOldestVoice();
    }
    
    try {
      // Create a new voice using the factory function
      const voice = voiceFactory(note, velocity);
      
      // Only proceed if we got a valid voice
      if (!voice) {
        console.warn(`Failed to create voice for note ${note}`);
        return null;
      }
      
      // Track the voice in our active voices map
      if (!this.activeVoices.has(note)) {
        this.activeVoices.set(note, []);
      }
      this.activeVoices.get(note).push(voice);
      this.voiceCount++;
      
      // Update voice monitor
      voiceMonitor.recordVoiceCreation();
      voiceMonitor.updateVoiceCount(this.voiceCount);
      
      // Return the created voice
      return voice;
    } catch (e) {
      console.error(`Error creating voice for note ${note}:`, e);
      return null;
    }
  }
  
  /**
   * Schedule note on
   */
  scheduleNoteOn(time, note, velocity, voiceFactory) {
    if (this.voiceCount >= this.maxVoices) {
      this.stealOldestVoice();
    }
    
    // Create a unique ID for this scheduled voice
    const scheduleId = `note_${note}_${time}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Schedule the note on
    const scheduledTime = time;
    const scheduleTimeout = setTimeout(() => {
      this.createVoice(note, velocity, voiceFactory);
      this.scheduledVoices.delete(scheduleId);
    }, (scheduledTime - this.audioContext.currentTime) * 1000);
    
    // Store the scheduled voice
    this.scheduledVoices.set(scheduleId, {
      note,
      velocity,
      time: scheduledTime,
      timeout: scheduleTimeout
    });
    
    return scheduleId;
  }
  
  /**
   * Handle note on
   */
  noteOn(note, velocity, voiceFactory) {
    // If we already have voices for this note, handle them
    if (this.activeVoices.has(note)) {
      // Get current voices for this note
      const voices = this.activeVoices.get(note);
      
      // Clear any pending releases for this note
      if (this.pendingReleases.has(note)) {
        const timeouts = this.pendingReleases.get(note);
        timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.pendingReleases.delete(note);
      }
      
      // For rapid repeats of the same note, kill previous instances
      // to avoid phase issues and stuck notes
      voices.forEach(voice => {
        try {
          // Mark voice as being released (for cleanup)
          this.releasedVoices.add(voice);
          
          // Force immediate stopping
          if (typeof voice.stop === 'function') {
            voice.stop(true); // Use immediate stopping
          }
        } catch (e) {
          console.error(`Error stopping voice for note ${note}:`, e);
        }
      });
      
      // Clear the voices array for this note
      this.activeVoices.set(note, []);
    }
    
    // Voice management - if we have too many voices active, steal the oldest
    if (this.voiceCount >= this.maxVoices) {
      this.stealOldestVoice();
    }
    
    // Create a new voice
    return this.createVoice(note, velocity, voiceFactory);
  }
  
  /**
   * Handle note off
   */
  noteOff(note, releaseCallback) {
    if (!this.activeVoices.has(note)) {
      return false; // No active voices for this note
    }
    
    const voices = this.activeVoices.get(note);
    if (voices.length === 0) {
      return false; // No active voices for this note
    }
      // Release all voices for this note
    const timeouts = [];
      voices.forEach(voice => {
      try {
        // Call the release callback to stop the voice
        if (typeof releaseCallback === 'function') {
          releaseCallback(voice);
        }
        
        // Mark voice as being released (for cleanup)
        this.releasedVoices.add(voice);
        
        // Reduce voice count immediately to improve polyphony in rapid playing
        this.voiceCount--;
        
        // Update voice monitor
        voiceMonitor.recordVoiceRelease();
        voiceMonitor.updateVoiceCount(this.voiceCount);
        
        // Schedule final cleanup
        const timeout = setTimeout(() => {
          // Remove the voice from the released voices set
          this.releasedVoices.delete(voice);
        }, 5000); // Reduced from 10s to 5s for faster cleanup
        
        timeouts.push(timeout);
      } catch (e) {
        console.error(`Error releasing voice for note ${note}:`, e);
        // Force decrement voice count if there was an error
        this.voiceCount--;
        voiceMonitor.updateVoiceCount(this.voiceCount);
      }
    });
    
    // Store the timeouts
    this.pendingReleases.set(note, timeouts);
    
    // Clear the active voices for this note
    this.activeVoices.set(note, []);
    
    return true;
  }
  /**
   * Steal the oldest voice when we exceed the maximum
   */
  stealOldestVoice() {
    let oldestNote = null;
    let oldestTime = Infinity;
    
    // Find the oldest note
    for (const [note, time] of this.lastNoteOnTime.entries()) {
      if (time < oldestTime && this.activeVoices.has(note) && this.activeVoices.get(note).length > 0) {
        oldestTime = time;
        oldestNote = note;
      }
    }
    
    // If we found an oldest note, steal it
    if (oldestNote !== null) {
      const voices = this.activeVoices.get(oldestNote);
      if (voices && voices.length > 0) {
        const voiceToSteal = voices[0]; // Steal the first voice
        
        try {
          // Mark voice as being released (for cleanup)
          this.releasedVoices.add(voiceToSteal);
          
          // Force immediate stopping
          if (typeof voiceToSteal.stop === 'function') {
            voiceToSteal.stop(true); // Use immediate stopping
          }
          
          // Remove the voice from the active voices
          voices.shift(); // Remove the first voice
          
          // Decrement voice count
          this.voiceCount--;
          
          // Update voice monitor
          voiceMonitor.recordVoiceSteal();
          voiceMonitor.updateVoiceCount(this.voiceCount);
          
          console.log(`Stole voice for note ${oldestNote}`);
        } catch (e) {
          console.error(`Error stealing voice for note ${oldestNote}:`, e);
        }
      }
    } else {
      // If we can't find a specific voice to steal, just steal some voices to free up capacity
      console.warn("No specific voice to steal - doing emergency voice pruning");
      this.emergencyVoicePruning();
    }
  }
  
  /**
   * Emergency pruning when we can't find specific voices to steal
   * This helps ensure polyphony doesn't get choked
   */
  emergencyVoicePruning() {
    // Get all voices sorted by start time
    const allVoices = [];
    
    for (const [note, voices] of this.activeVoices.entries()) {
      for (const voice of voices) {
        if (voice) {
          allVoices.push({
            note,
            voice,
            time: this.lastNoteOnTime.get(note) || 0
          });
        }
      }
    }
    
    // Sort by time (oldest first)
    allVoices.sort((a, b) => a.time - b.time);
    
    // Take the oldest 25% of voices and stop them
    const voicesToStop = Math.max(1, Math.floor(allVoices.length * 0.25));
    let stoppedCount = 0;
      for (let i = 0; i < voicesToStop && i < allVoices.length; i++) {
      const { note, voice } = allVoices[i];
      
      try {
        // Mark voice as being released
        this.releasedVoices.add(voice);
        
        // Force immediate stopping
        if (typeof voice.stop === 'function') {
          voice.stop(true);
        }
        
        // Remove from active voices
        const activeVoicesForNote = this.activeVoices.get(note);
        if (activeVoicesForNote) {
          const index = activeVoicesForNote.indexOf(voice);
          if (index !== -1) {
            activeVoicesForNote.splice(index, 1);
            this.voiceCount--;
            stoppedCount++;
            
            // Update voice monitor
            voiceMonitor.recordVoiceSteal();
            voiceMonitor.updateVoiceCount(this.voiceCount);
          }
        }
      } catch (e) {
        console.error(`Error during emergency voice pruning:`, e);
      }
    }
    
    // Log emergency cleanup to voice monitor
    voiceMonitor.recordEmergencyCleanup();
    
    console.log(`Emergency voice pruning: stopped ${stoppedCount} voices`);
  }
  
  /**
   * All notes off - immediate stopping of all voices
   */
  allNotesOff(releaseCallback) {
    console.log("All notes off triggered in VoiceManager");
    
    // Clear all scheduled voices
    for (const [scheduleId, scheduled] of this.scheduledVoices.entries()) {
      clearTimeout(scheduled.timeout);
    }
    this.scheduledVoices.clear();
    
    // Clear all pending releases
    for (const [note, timeouts] of this.pendingReleases.entries()) {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    }
    this.pendingReleases.clear();
    
    // Stop all active voices
    for (const [note, voices] of this.activeVoices.entries()) {
      voices.forEach(voice => {
        try {
          // Call the release callback with immediate flag
          if (typeof releaseCallback === 'function') {
            releaseCallback(voice, true); // Pass true to indicate immediate stop
          }
          
          // Add to released voices for cleanup
          this.releasedVoices.add(voice);
        } catch (e) {
          console.error(`Error stopping voice for note ${note} in allNotesOff:`, e);
        }
      });
    }
    
    // Clear all active voices
    this.activeVoices.clear();
    
    // Reset note timestamps
    this.lastNoteOnTime.clear();
    
    // Reset voice count to just the voices in release
    this.voiceCount = this.releasedVoices.size;
    
    return true;
  }
    /**
   * Periodic cleanup of resources
   */
  performCleanup() {
    const now = this.audioContext.currentTime;
    let cleanupCount = 0;
    
    // More aggressive cleanup of released voices
    // Reduced cleanup time from 10 seconds to 5 seconds
    for (const voice of this.releasedVoices) {
      if (voice.releaseStartTime && (now - voice.releaseStartTime > 5)) {
        // Voice has been releasing for over 5 seconds, force cleanup
        this.releasedVoices.delete(voice);
        cleanupCount++;
      }
    }
    
    // Cleanup orphaned voices (those without active notes)
    for (const [note, voices] of this.activeVoices.entries()) {
      if (voices.length === 0) {
        this.activeVoices.delete(note);
      }
    }
    
    // Verify voice count matches reality - important for polyphony
    const countedVoices = [...this.activeVoices.values()].reduce(
      (total, voices) => total + voices.length, 
      0
    );
      // If our counted voices don't match our tracked count, fix it
    if (countedVoices !== this.voiceCount) {
      console.warn(`Voice count mismatch: tracked=${this.voiceCount}, actual=${countedVoices}. Fixing.`);
      this.voiceCount = countedVoices;
      voiceMonitor.updateVoiceCount(this.voiceCount);
    }
    
    if (cleanupCount > 0) {
      console.log(`Cleaned up ${cleanupCount} voices, current voice count: ${this.voiceCount}`);
    }
    
    // Log voice stats every 10 seconds (approx every 5 cleanup cycles)
    if (Math.random() < 0.2) {
      voiceMonitor.logStats();
    }
  }
  
  /**
   * Dispose all resources
   */
  dispose() {
    // Clear the cleanup interval
    clearInterval(this.cleanupInterval);
    
    // Perform final allNotesOff
    this.allNotesOff();
    
    // Clear all maps
    this.activeVoices.clear();
    this.pendingReleases.clear();
    this.scheduledVoices.clear();
    this.releasedVoices.clear();
    this.lastNoteOnTime.clear();
    
    // Reset voice count
    this.voiceCount = 0;
  }
    /**
   * Get all active voices in the voice manager
   * @returns {Array} Array of all voice objects
   */
  getAllVoices() {
    const allVoices = [];
    
    // Collect all voices from the activeVoices map
    for (const [note, voices] of this.activeVoices.entries()) {
      for (const voice of voices) {
        if (voice) {
          allVoices.push(voice);
        }
      }
    }
    
    return allVoices;
  }
}

export default MIDIVoiceManager;
