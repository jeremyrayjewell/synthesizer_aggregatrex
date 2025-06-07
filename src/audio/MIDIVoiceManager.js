class MIDIVoiceManager {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.activeVoices = new Map();
    this.pendingReleases = new Map();
    this.scheduledVoices = new Map();
    this.releasedVoices = new Set();
    this.voiceCount = 0;
    this.maxVoices = 16; // Further reduced for high-speed sequences
    this.lastNoteOnTime = new Map();
    this.CLEANUP_INTERVAL = 500; // Much more frequent cleanup
    this.cleanupInterval = setInterval(() => this.performCleanup(), this.CLEANUP_INTERVAL);
    
    // Add special tracking for arpeggiator voices
    this.arpeggiatedNotes = new Set();
    this.arpeggiatedVoices = new Set();
    
    // Enhanced rapid input protection
    this.rapidInputCount = 0;
    this.rapidInputWindow = 50; // Shorter window for tighter control
    this.rapidInputThreshold = 4; // Much lower threshold - max 4 notes per 50ms
    this.lastInputTime = 0;
    this.inputRateLimited = false;
    
    // High-speed sequencer protection
    this.sequencerModeActive = false;
    this.sequencerNoteCount = 0;
    this.sequencerTimeWindow = 1000; // 1 second window
    this.sequencerThreshold = 20; // If more than 20 notes in 1 second, activate sequencer mode
    this.sequencerStartTime = 0;
    
    // Emergency brake system
    this.emergencyBrakeActive = false;
    this.emergencyThreshold = 50; // Emergency if more than 50 notes in 1 second
  }

  createVoice(note, velocity, voiceFactory) {
    this.lastNoteOnTime.set(note, this.audioContext.currentTime);
    if (this.voiceCount >= this.maxVoices - 1) {
      console.log(`Approaching voice limit (${this.voiceCount}/${this.maxVoices}), stealing oldest voice`);
      this.stealOldestVoice();
    }
    try {
      const voice = voiceFactory(note, velocity);
      if (!voice) {
        console.warn(`Failed to create voice for note ${note}`);
        return null;
      }
      if (!this.activeVoices.has(note)) {
        this.activeVoices.set(note, []);
      }      this.activeVoices.get(note).push(voice);
      this.voiceCount++;
      return voice;
    } catch (e) {
      console.error(`Error creating voice for note ${note}:`, e);
      return null;
    }
  }

  scheduleNoteOn(time, note, velocity, voiceFactory) {
    if (this.voiceCount >= this.maxVoices) {
      this.stealOldestVoice();
    }
    const scheduleId = `note_${note}_${time}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledTime = time;
    const scheduleTimeout = setTimeout(() => {
      this.createVoice(note, velocity, voiceFactory);
      this.scheduledVoices.delete(scheduleId);
    }, (scheduledTime - this.audioContext.currentTime) * 1000);
    this.scheduledVoices.set(scheduleId, {
      note,
      velocity,
      time: scheduledTime,
      timeout: scheduleTimeout
    });
    return scheduleId;
  }  noteOn(note, velocity, voiceFactory) {
    // Quick exit if audio context is not running
    if (this.audioContext.state !== 'running') {
      return false;
    }
    
    const now = performance.now();
    
    // Enhanced rapid input and sequencer detection
    if (now - this.lastInputTime < this.rapidInputWindow) {
      this.rapidInputCount++;
    } else {
      this.rapidInputCount = 1;
      this.inputRateLimited = false;
    }
    this.lastInputTime = now;
    
    // Sequencer mode detection
    if (!this.sequencerModeActive) {
      if (now - this.sequencerStartTime > this.sequencerTimeWindow) {
        this.sequencerNoteCount = 1;
        this.sequencerStartTime = now;
      } else {
        this.sequencerNoteCount++;
        if (this.sequencerNoteCount > this.sequencerThreshold) {
          console.warn("High-speed sequencer detected - activating performance mode");
          this.sequencerModeActive = true;
          this.maxVoices = 8; // Drastically reduce voices for sequencer mode
        }
      }
    }
    
    // Emergency brake
    if (this.sequencerNoteCount > this.emergencyThreshold) {
      if (!this.emergencyBrakeActive) {
        console.error("EMERGENCY BRAKE: Excessive MIDI input detected - dropping 90% of notes");
        this.emergencyBrakeActive = true;
        this.allNotesOff(() => {}); // Force silence
      }
      // Drop 90% of notes in emergency mode
      if (Math.random() > 0.1) {
        return false;
      }
    }
    
    // Rate limiting based on mode
    const threshold = this.sequencerModeActive ? 2 : this.rapidInputThreshold;
    if (this.rapidInputCount > threshold) {
      if (!this.inputRateLimited) {
        console.warn(`Rate limiting MIDI input (mode: ${this.sequencerModeActive ? 'sequencer' : 'normal'})`);
        this.inputRateLimited = true;
      }
      // In sequencer mode, drop more aggressively
      if (this.sequencerModeActive && Math.random() > 0.3) {
        return false;
      } else if (!this.sequencerModeActive) {
        return false;
      }
    }
    
    // Reset emergency brake if things calm down
    if (this.emergencyBrakeActive && now - this.sequencerStartTime > 2000 && this.sequencerNoteCount < 10) {
      console.log("Emergency brake deactivated");
      this.emergencyBrakeActive = false;
      this.sequencerModeActive = false;
      this.maxVoices = 16;
    }
    
    // Ultra-aggressive voice stealing in sequencer mode
    const voiceThreshold = this.sequencerModeActive ? 0.5 : 0.7;
    if (this.voiceCount >= this.maxVoices * voiceThreshold) {
      this.emergencyVoicePruning();
    }
    
    // Kill existing note immediately in high-speed mode
    if (this.activeVoices.has(note)) {
      const voices = this.activeVoices.get(note);
      if (this.pendingReleases.has(note)) {
        const timeouts = this.pendingReleases.get(note);
        timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.pendingReleases.delete(note);
      }
      voices.forEach(voice => {
        try {
          this.releasedVoices.add(voice);
          if (typeof voice.stop === 'function') {
            voice.stop(true); // Immediate stop
          }
        } catch (e) {
          console.error(`Error stopping voice for note ${note}:`, e);
        }
      });
      this.activeVoices.set(note, []);
    }
    
    if (this.voiceCount >= this.maxVoices) {
      this.stealOldestVoice();
    }
    
    return this.createVoice(note, velocity, voiceFactory);
  }

  noteOff(note, releaseCallback) {
    if (!this.activeVoices.has(note)) {
      return false;
    }
    const voices = this.activeVoices.get(note);
    if (voices.length === 0) {
      return false;
    }
    const timeouts = [];
    voices.forEach(voice => {
      try {
        if (typeof releaseCallback === 'function') {
          releaseCallback(voice);
        }        this.releasedVoices.add(voice);
        this.voiceCount--;
        const timeout = setTimeout(() => {
          this.releasedVoices.delete(voice);
        }, 5000);
        timeouts.push(timeout);      } catch (e) {
        console.error(`Error releasing voice for note ${note}:`, e);
        this.voiceCount--;
      }
    });
    this.pendingReleases.set(note, timeouts);
    this.activeVoices.set(note, []);
    return true;
  }

  stealOldestVoice() {
    let oldestNote = null;
    let oldestTime = Infinity;
    for (const [note, time] of this.lastNoteOnTime.entries()) {
      if (time < oldestTime && this.activeVoices.has(note) && this.activeVoices.get(note).length > 0) {
        oldestTime = time;
        oldestNote = note;
      }
    }
    if (oldestNote !== null) {
      const voices = this.activeVoices.get(oldestNote);
      if (voices && voices.length > 0) {
        const voiceToSteal = voices[0];
        try {
          this.releasedVoices.add(voiceToSteal);
          if (typeof voiceToSteal.stop === 'function') {
            voiceToSteal.stop(true);
          }          voices.shift();
          this.voiceCount--;
          console.log(`Stole voice for note ${oldestNote}`);
        } catch (e) {
          console.error(`Error stealing voice for note ${oldestNote}:`, e);
        }
      }
    } else {
      console.warn("No specific voice to steal - doing emergency voice pruning");
      this.emergencyVoicePruning();
    }
  }

  emergencyVoicePruning() {
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
    allVoices.sort((a, b) => a.time - b.time);
    const voicesToStop = Math.max(1, Math.floor(allVoices.length * 0.25));
    let stoppedCount = 0;
    for (let i = 0; i < voicesToStop && i < allVoices.length; i++) {
      const { note, voice } = allVoices[i];
      try {
        this.releasedVoices.add(voice);
        if (typeof voice.stop === 'function') {
          voice.stop(true);
        }
        const activeVoicesForNote = this.activeVoices.get(note);
        if (activeVoicesForNote) {
          const index = activeVoicesForNote.indexOf(voice);
          if (index !== -1) {            activeVoicesForNote.splice(index, 1);
            this.voiceCount--;
            stoppedCount++;
          }
        }
      } catch (e) {
        console.error(`Error during emergency voice pruning:`, e);      }
    }
    console.log(`Emergency voice pruning: stopped ${stoppedCount} voices`);
  }

  allNotesOff(releaseCallback) {
    console.log("All notes off triggered in VoiceManager");
    for (const [scheduleId, scheduled] of this.scheduledVoices.entries()) {
      clearTimeout(scheduled.timeout);
    }
    this.scheduledVoices.clear();
    for (const [note, timeouts] of this.pendingReleases.entries()) {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    }
    this.pendingReleases.clear();
    for (const [note, voices] of this.activeVoices.entries()) {
      voices.forEach(voice => {
        try {
          if (typeof releaseCallback === 'function') {
            releaseCallback(voice, true);
          }
          this.releasedVoices.add(voice);
        } catch (e) {
          console.error(`Error stopping voice for note ${note} in allNotesOff:`, e);
        }
      });
    }
    this.activeVoices.clear();
    this.lastNoteOnTime.clear();
    this.voiceCount = this.releasedVoices.size;
    return true;
  }

  performCleanup() {
    const now = this.audioContext.currentTime;
    let cleanupCount = 0;
    for (const voice of this.releasedVoices) {
      if (voice.releaseStartTime && (now - voice.releaseStartTime > 5)) {
        this.releasedVoices.delete(voice);
        cleanupCount++;
      }
    }
    for (const [note, voices] of this.activeVoices.entries()) {
      if (voices.length === 0) {
        this.activeVoices.delete(note);
      }
    }
    const countedVoices = [...this.activeVoices.values()].reduce((total, voices) => total + voices.length, 0);    if (countedVoices !== this.voiceCount) {
      console.warn(`Voice count mismatch: tracked=${this.voiceCount}, actual=${countedVoices}. Fixing.`);
      this.voiceCount = countedVoices;
    }    if (cleanupCount > 0) {
      console.log(`Cleaned up ${cleanupCount} voices, current voice count: ${this.voiceCount}`);
    }
  }

  performAggressiveCleanup() {
    console.log('Performing aggressive cleanup for sequencer mode');
    const now = this.audioContext.currentTime;
    let cleanupCount = 0;
    
    // More aggressive cleanup of released voices
    for (const voice of this.releasedVoices) {
      if (voice.releaseStartTime && (now - voice.releaseStartTime > 1)) { // Shorter timeout
        this.releasedVoices.delete(voice);
        cleanupCount++;
      }
    }
    
    // Force cleanup voices that aren't playing
    for (const [note, voices] of this.activeVoices.entries()) {
      for (let i = voices.length - 1; i >= 0; i--) {
        const voice = voices[i];
        if (voice && voice.isStopped) {
          voices.splice(i, 1);
          this.voiceCount--;
          cleanupCount++;
        }
      }
    }
    
    console.log(`Aggressive cleanup: removed ${cleanupCount} voices`);
  }
  
  performEmergencyCleanup() {
    console.log('🚨 Emergency cleanup activated');
    
    // Force stop 50% of active voices
    const allVoices = [];
    for (const [note, voices] of this.activeVoices.entries()) {
      for (const voice of voices) {
        if (voice && !voice.isStopped) {
          allVoices.push({ note, voice });
        }
      }
    }
    
    const voicesToStop = Math.floor(allVoices.length * 0.5);
    for (let i = 0; i < voicesToStop; i++) {
      const { note, voice } = allVoices[i];
      try {
        if (typeof voice.forceKill === 'function') {
          voice.forceKill();
        } else if (typeof voice.stop === 'function') {
          voice.stop(true);
        }
        
        const voicesForNote = this.activeVoices.get(note);
        if (voicesForNote) {
          const index = voicesForNote.indexOf(voice);
          if (index !== -1) {
            voicesForNote.splice(index, 1);
            this.voiceCount--;
          }
        }
      } catch (e) {
        console.error('Error in emergency cleanup:', e);
      }
    }
    
    console.log(`Emergency cleanup: force stopped ${voicesToStop} voices`);
  }

  dispose() {
    clearInterval(this.cleanupInterval);
    this.allNotesOff();
    this.activeVoices.clear();
    this.pendingReleases.clear();
    this.scheduledVoices.clear();
    this.releasedVoices.clear();
    this.lastNoteOnTime.clear();
    this.voiceCount = 0;
  }
  getAllVoices() {
    const allVoices = [];
    for (const [note, voices] of this.activeVoices.entries()) {
      for (const voice of voices) {
        if (voice) {
          allVoices.push(voice);
        }
      }
    }
    return allVoices;
  }
  
  // Special method to mark a note as arpeggiated
  markNoteAsArpeggiated(note) {
    this.arpeggiatedNotes.add(note);
  }
  
  // Creates a voice and marks it as arpeggiated if it's from the arpeggiator
  createArpeggiatedVoice(note, velocity, voiceFactory) {
    const voice = this.createVoice(note, velocity, voiceFactory);
    if (voice) {
      this.arpeggiatedVoices.add(voice);
      this.markNoteAsArpeggiated(note);
    }
    return voice;
  }
  
  // Method to release a specific arpeggiated note
  releaseArpeggiatedNote(note) {
    console.log(`Releasing specific arpeggiated note ${note}`);
    
    // Find and stop any arpeggiated voices for this note
    if (this.activeVoices.has(note)) {
      const voices = this.activeVoices.get(note);
      voices.forEach(voice => {
        if (this.arpeggiatedVoices.has(voice)) {
          try {
            if (typeof voice.stop === 'function') {
              voice.stop(true); // Immediate stop for arpeggiated voices
            }
            this.arpeggiatedVoices.delete(voice);
            this.releasedVoices.add(voice);
          } catch (e) {
            console.error(`Error stopping arpeggiated voice for note ${note}:`, e);
          }
        }
      });
      
      // Clear the note from active voices
      this.activeVoices.set(note, []);
      this.voiceCount -= voices.length;
    }
    
    // Clear any pending releases for this note
    if (this.pendingReleases.has(note)) {
      const timeouts = this.pendingReleases.get(note);
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
      this.pendingReleases.delete(note);
    }
    
    // Remove from arpeggiated notes tracking
    this.arpeggiatedNotes.delete(note);
  }
  
  // Special method to release all arpeggiated notes and voices
  releaseAllArpeggiatedNotes() {
    console.log(`Releasing all ${this.arpeggiatedNotes.size} arpeggiated notes`);
    
    // First silence any active arpeggiated voices
    if (this.arpeggiatedVoices.size > 0) {
      this.arpeggiatedVoices.forEach(voice => {
        if (voice && typeof voice.stop === 'function') {
          voice.stop(true); // Immediate stop
        }
      });
      this.arpeggiatedVoices.clear();
    }
    
    // Clear any pending releases for arpeggiated notes
    this.arpeggiatedNotes.forEach(note => {
      if (this.pendingReleases.has(note)) {
        const timeouts = this.pendingReleases.get(note);
        timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.pendingReleases.delete(note);
      }
      
      // Remove the note from active voices
      if (this.activeVoices.has(note)) {
        this.activeVoices.delete(note);
      }
    });
    
    // Clear arpeggiated notes set
    this.arpeggiatedNotes.clear();
    
    // Force recalculate voice count
    this.recalculateVoiceCount();
  }
  
  recalculateVoiceCount() {
    let count = 0;
    for (const voices of this.activeVoices.values()) {
      count += voices.length;
    }
    this.voiceCount = count;
    return count;
  }
  
  emergencyReleaseAll() {
    console.log("🚨 EMERGENCY: Releasing all voices and clearing state");
    
    // Stop all scheduled voice creation
    for (const [scheduleId, scheduled] of this.scheduledVoices.entries()) {
      clearTimeout(scheduled.timeout);
    }
    this.scheduledVoices.clear();
    
    // Cancel all pending note releases
    for (const [note, timeouts] of this.pendingReleases.entries()) {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    }
    this.pendingReleases.clear();
    
    // Immediately stop all active voices using the new forceKill method
    let stoppedCount = 0;
    for (const [note, voices] of this.activeVoices.entries()) {
      for (const voice of voices) {
        try {
          if (voice) {
            // Use the new forceKill method if available
            if (typeof voice.forceKill === 'function') {
              voice.forceKill();
            } 
            // Fallback to stop and disconnect
            else if (typeof voice.stop === 'function') {
              voice.stop(true); // immediate
            }
            this.releasedVoices.add(voice);
            stoppedCount++;
          }
        } catch (e) {
          console.error(`Error force-stopping voice for note ${note}:`, e);
        }
      }
    }
    
    // Clear all tracking
    this.activeVoices.clear();
    this.lastNoteOnTime.clear();
    if (this.arpeggiatedNotes) this.arpeggiatedNotes.clear();
    if (this.arpeggiatedVoices) this.arpeggiatedVoices.clear();
    this.voiceCount = 0;
    
    return stoppedCount;
  }
}

export default MIDIVoiceManager;
