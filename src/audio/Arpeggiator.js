export default class Arpeggiator {  constructor(audioContext, voiceManager) {
    this.audioContext = audioContext;
    this.voiceManager = voiceManager;
    this.isEnabled = false;
    this.rate = 120; // BPM
    this.pattern = 'up';
    this.octaves = 1;
    this.gate = 0.8;
    this.swing = 0;
    this.stepLength = 4;
    this.velocityMode = 'original';
    this.holdMode = false;
    
    this.activeNotes = [];
    this.notesInQueue = [];
    this.activeTimeouts = []; // Track all setTimeout IDs for cleanup
    this.currentStep = 0;
    this.schedulerInterval = null;
    this.lookaheadTime = 0.1; // 100ms lookahead
    this.noteInterval = this.getBeatTime() / this.stepLength; // time per step
    this.nextStepTime = this.audioContext.currentTime; // Initialize next step time
    
    this.voiceFactory = null;
    this.originalVelocities = new Map(); // Store original velocity of each note
    
    console.log("Arpeggiator initialized with rate:", this.rate);
  }
  
  getBeatTime() {
    return 60 / this.rate;
  }  setEnabled(isEnabled) {
    const wasEnabled = this.isEnabled;
    
    // Handle toggling off
    if (!isEnabled && wasEnabled) {
      console.log("Disabling arpeggiator");
      
      // Use our emergency stop function which handles everything
      this.emergencyStop();
    }
    // Handle toggling on
    else if (isEnabled && !wasEnabled) {
      console.log("Enabling arpeggiator");
      this.isEnabled = true;
      this.start();
    }
  }
  
  setRate(rate) {
    this.rate = rate;
    this.noteInterval = this.getBeatTime() / this.stepLength;
  }
  
  setPattern(pattern) {
    this.pattern = pattern;
  }
  
  setOctaves(octaves) {
    this.octaves = octaves;
  }
  
  setGate(gate) {
    this.gate = gate;
  }
  
  setSwing(swing) {
    this.swing = swing;
  }
  
  setStepLength(stepLength) {
    this.stepLength = stepLength;
    this.noteInterval = this.getBeatTime() / this.stepLength;
  }
  
  setVelocityMode(velocityMode) {
    this.velocityMode = velocityMode;
  }
  
  setHoldMode(holdMode) {
    this.holdMode = holdMode;
    if (!holdMode) {
      // When hold mode is turned off, clear any held notes
      this.clearHeldNotes();
    }
  }  clearHeldNotes() {
    console.log("Clearing held notes in arpeggiator");
    
    // Cancel all scheduled timeouts first
    if (this.activeTimeouts.length > 0) {
      console.log(`Clearing ${this.activeTimeouts.length} pending arpeggiator timeouts`);
      this.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      this.activeTimeouts = [];
    }
    
    // Clear the queue
    const queueLength = this.notesInQueue.length;
    if (queueLength > 0) {
      console.log(`Clearing ${queueLength} notes from arpeggiator queue`);
      this.notesInQueue = [];
    }
    
    // Use the special method to release all arpeggiated notes at once
    // This is the most direct and effective approach
    if (this.voiceManager && typeof this.voiceManager.releaseAllArpeggiatedNotes === 'function') {
      this.voiceManager.releaseAllArpeggiatedNotes();
    }
    
    // Clear active notes array only if we're not in hold mode
    if (!this.holdMode) {
      this.activeNotes = [];
      this.originalVelocities.clear();
    }
  }
  
  addNote(note, velocity) {
    if (!this.isEnabled) return;
    
    // Store original velocity
    this.originalVelocities.set(note, velocity);
    
    // Add to active notes if not already there
    if (!this.activeNotes.includes(note)) {
      this.activeNotes.push(note);
      
      // Sort based on the current pattern
      if (this.pattern === 'up' || this.pattern === 'updown') {
        this.activeNotes.sort((a, b) => a - b);
      } else if (this.pattern === 'down') {
        this.activeNotes.sort((a, b) => b - a);
      }
      // 'random' and 'played' patterns don't need sorting
    }
  }
  
  releaseNote(note) {
    if (!this.isEnabled || this.holdMode) return;
    
    // Remove from active notes
    const index = this.activeNotes.indexOf(note);
    if (index !== -1) {
      this.activeNotes.splice(index, 1);
      this.originalVelocities.delete(note);
    }
  }
    start() {
    if (this.schedulerInterval) return; // Already running
    
    this.currentStep = 0;
    this.nextStepTime = this.audioContext.currentTime; // Reset next step time
    
    const scheduleAhead = () => {
      const currentTime = this.audioContext.currentTime;
      const futureTime = currentTime + this.lookaheadTime;
      
      // Schedule notes for the next time window
      if (this.activeNotes.length > 0) {
        this.scheduleNotes(currentTime, futureTime);
      }
    };
    
    console.log("Arpeggiator starting with rate:", this.rate, "BPM");
    
    // Start scheduler
    this.schedulerInterval = setInterval(scheduleAhead, 25); // 40 times per second
  }  stop() {
    console.log("Stopping arpeggiator");
    
    // Stop the scheduler
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    // Reset step counter and timing
    this.currentStep = 0;
    this.nextStepTime = this.audioContext.currentTime; 
    
    // Use the more robust note clearing method
    this.clearHeldNotes();
    
    // Add an additional forced cleanup after a small delay
    // This catches any notes that might have been scheduled just before stopping
    setTimeout(() => {
      if (this.voiceManager && !this.isEnabled) {
        console.log("Performing additional arpeggiator cleanup");
        if (typeof this.voiceManager.releaseAllArpeggiatedNotes === 'function') {
          this.voiceManager.releaseAllArpeggiatedNotes();
        }
      }
    }, 200);
  }
  
  setVoiceFactory(factory) {
    this.voiceFactory = factory;
  }
    scheduleNotes(startTime, endTime) {
    // If no notes or not enabled, do nothing
    if (this.activeNotes.length === 0 || !this.isEnabled || !this.voiceFactory) {
      return;
    }
    
    try {
      const notesToPlay = this.getNotesToPlay();
      // Safety check for empty pattern
      if (notesToPlay.length === 0) {
        return;
      }
      
      const baseNoteInterval = this.getBeatTime() / this.stepLength;
      
      // Ensure we're not scheduling from the past
      if (this.nextStepTime < this.audioContext.currentTime) {
        this.nextStepTime = this.audioContext.currentTime;
      }
      
      // Schedule notes during the time window
      while (this.nextStepTime < endTime) {
        // Calculate actual time for this step (including swing)
        const swingOffset = this.currentStep % 2 === 1 ? this.swing * baseNoteInterval : 0;
        const noteOnTime = this.nextStepTime + swingOffset;
        
        // Skip if we're past the end time
        if (noteOnTime > endTime) break;
        
        // Get the note to play for this step
        const noteIndex = this.currentStep % notesToPlay.length;
        const noteToPlay = notesToPlay[noteIndex];
        
        if (noteToPlay !== undefined) {
          // Calculate note length based on gate (ensure it doesn't go beyond the next note)
          const noteDuration = Math.min(
            baseNoteInterval * this.gate, 
            baseNoteInterval - 0.01 // Leave a small gap
          );
          const noteOffTime = noteOnTime + noteDuration;
          
          // Determine velocity based on mode
          let velocity;
          switch (this.velocityMode) {
            case 'fixed':
              velocity = 0.8;
              break;
            case 'accent':
              velocity = noteIndex % 4 === 0 ? 1.0 : 0.6;
              break;
            case 'random':
              velocity = 0.5 + Math.random() * 0.5;
              break;
            case 'original':
            default:
              // Original velocity based on the MIDI note's original velocity
              // Get the base note (in the first octave) to match with stored velocities
              const baseNote = noteToPlay % 12;
              velocity = this.originalVelocities.get(baseNote) || 
                        this.originalVelocities.get(noteToPlay) || 0.8;
          }
          
          // Schedule the note
          this.scheduleNote(noteToPlay, velocity, noteOnTime, noteOffTime);
        }
        
        // Move to next step (protecting against empty pattern)
        if (notesToPlay.length > 0) {
          this.currentStep = (this.currentStep + 1) % notesToPlay.length;
        } else {
          this.currentStep = 0;
        }
        this.nextStepTime += baseNoteInterval;
      }
    } catch (err) {
      console.error('Error in arpeggiator scheduling:', err);
    }
  }  scheduleNote(note, velocity, onTime, offTime) {
    // Skip scheduling if the note time is already in the past
    const noteOnDelay = onTime - this.audioContext.currentTime;
    if (noteOnDelay < 0) return; // Skip notes that should have already played
    
    // CRITICAL: Don't schedule anything if arpeggiator is already disabled
    if (!this.isEnabled) {
      console.log(`Skipping note scheduling for ${note} because arpeggiator is disabled`);
      return;
    }
    
    // Create note info object for the queue
    const noteInfo = {
      note,
      velocity,
      onTime,
      offTime
    };
    
    // Add to queue - but first check if it's already in the queue
    if (!this.notesInQueue.some(ni => ni.note === note && ni.onTime === onTime)) {
      this.notesInQueue.push(noteInfo);
    }
    
    // Special marker in voice manager to track arpeggiator notes
    this.voiceManager.markNoteAsArpeggiated(note);
    
    // Schedule the note-on timeout
    const noteOnTimeoutId = setTimeout(() => {
      // Safety check - don't play if arpeggiator is disabled
      if (!this.isEnabled) {
        console.log(`Skipping scheduled note ${note} because arpeggiator disabled`);
        return;
      }
      
      console.log(`Playing arpeggiator note ${note} at time ${this.audioContext.currentTime.toFixed(3)}`);
      
      // Create the voice using special method that marks it as an arpeggiator voice
      try {
        this.voiceManager.createArpeggiatedVoice(note, velocity, this.voiceFactory);
      } catch (err) {
        console.error('Error creating arpeggiator voice:', err);
      }
      
      // Remove timeout ID from tracking array
      const timeoutIndex = this.activeTimeouts.indexOf(noteOnTimeoutId);
      if (timeoutIndex !== -1) {
        this.activeTimeouts.splice(timeoutIndex, 1);
      }
    }, Math.max(0, noteOnDelay * 1000));
    
    // Track this timeout
    this.activeTimeouts.push(noteOnTimeoutId);
    
    // Safety check - ensure noteOff is not in the past
    const noteOffDelay = offTime - this.audioContext.currentTime;
    if (noteOffDelay < 0) return;
    
    // Schedule the note-off timeout
    const noteOffTimeoutId = setTimeout(() => {
      // Release the specific arpeggiated note
      try {
        console.log(`Releasing arpeggiator note ${note} at time ${this.audioContext.currentTime.toFixed(3)}`);
        // Use specific method for releasing arpeggiated voices
        if (this.voiceManager && typeof this.voiceManager.releaseArpeggiatedNote === 'function') {
          this.voiceManager.releaseArpeggiatedNote(note);
        } else {
          // Fallback to generic noteOff but with immediate stop callback
          this.voiceManager.noteOff(note, (voice) => {
            if (voice && typeof voice.stop === 'function') {
              voice.stop(true); // immediate stop
            }
          });
        }
      } catch (err) {
        console.error('Error releasing arpeggiator note:', err);
      }
      
      // Remove from queue
      const index = this.notesInQueue.findIndex(ni => 
        ni.note === noteInfo.note && ni.onTime === noteInfo.onTime);
      if (index !== -1) {
        this.notesInQueue.splice(index, 1);
      }
      
      // Remove timeout ID from tracking array
      const timeoutIndex = this.activeTimeouts.indexOf(noteOffTimeoutId);
      if (timeoutIndex !== -1) {
        this.activeTimeouts.splice(timeoutIndex, 1);
      }
    }, Math.max(0, noteOffDelay * 1000));
    
    // Track this timeout
    this.activeTimeouts.push(noteOffTimeoutId);
  }
  
  getNotesToPlay() {
    if (this.activeNotes.length === 0) return [];
    
    const result = [];
    const baseNotes = [...this.activeNotes]; // Clone to avoid modifying original
    
    // Sort base notes according to pattern
    if (this.pattern === 'up') {
      baseNotes.sort((a, b) => a - b);
    } else if (this.pattern === 'down') {
      baseNotes.sort((a, b) => b - a);
    } else if (this.pattern === 'random') {
      // Shuffle the notes
      for (let i = baseNotes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baseNotes[i], baseNotes[j]] = [baseNotes[j], baseNotes[i]];
      }
    }
    // 'played' pattern uses the notes in the order they were played
    
    // Add base octave
    result.push(...baseNotes);
    
    // Handle updown pattern - add reversed notes except first and last (to avoid duplicates)
    if (this.pattern === 'updown' && baseNotes.length > 2) {
      const reversed = [...baseNotes].reverse();
      result.push(...reversed.slice(1, reversed.length - 1));
    }
    
    // Add additional octaves
    if (this.octaves > 1) {
      for (let oct = 1; oct < this.octaves; oct++) {
        const octaveNotes = baseNotes.map(note => note + (12 * oct));
        result.push(...octaveNotes);
        
        // Handle updown pattern for additional octaves
        if (this.pattern === 'updown' && baseNotes.length > 2) {
          const reversed = [...octaveNotes].reverse();
          result.push(...reversed.slice(1, reversed.length - 1));
        }
      }
    }
    
    return result;
  }
  
  updateParameters(params) {
    if (typeof params.enabled !== 'undefined') this.setEnabled(params.enabled);
    if (typeof params.rate !== 'undefined') this.setRate(params.rate);
    if (typeof params.pattern !== 'undefined') this.setPattern(params.pattern);
    if (typeof params.octaves !== 'undefined') this.setOctaves(params.octaves);
    if (typeof params.gate !== 'undefined') this.setGate(params.gate);
    if (typeof params.swing !== 'undefined') this.setSwing(params.swing);
    if (typeof params.stepLength !== 'undefined') this.setStepLength(params.stepLength);
    if (typeof params.velocityMode !== 'undefined') this.setVelocityMode(params.velocityMode);
    if (typeof params.holdMode !== 'undefined') this.setHoldMode(params.holdMode);
  }
    dispose() {
    console.log("Disposing arpeggiator");
    
    // Make sure arpeggiator is disabled
    this.isEnabled = false;
    
    // Stop the scheduler
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    // Clear all active timeouts to prevent any future note on/offs
    if (this.activeTimeouts && this.activeTimeouts.length > 0) {
      console.log(`Clearing ${this.activeTimeouts.length} pending arpeggiator timeouts`);
      this.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      this.activeTimeouts = [];
    }
    
    // Make sure all notes are released
    this.clearHeldNotes();
    
    // Clear any stored notes
    this.activeNotes = [];
    this.notesInQueue = [];
    this.originalVelocities.clear();
    
    // Remove references
    this.voiceFactory = null;
    
    console.log("Arpeggiator disposed");
  }
  
  emergencyStop() {
    console.log("🚨 EMERGENCY: Stopping arpeggiator completely");
    
    // Set enabled flag to false first thing
    this.isEnabled = false;
    
    // 1. Clear the scheduler interval
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    
    // 2. Clear all scheduled timeouts
    if (this.activeTimeouts && this.activeTimeouts.length > 0) {
      const timeoutCount = this.activeTimeouts.length;
      console.log(`Clearing ${timeoutCount} pending arpeggiator timeouts`);
      
      this.activeTimeouts.forEach(id => {
        clearTimeout(id);
      });
      this.activeTimeouts = [];
    }
    
    // 3. Reset all internal state
    this.notesInQueue = [];
    this.activeNotes = [];
    this.currentStep = 0;
    this.nextStepTime = this.audioContext.currentTime;
    this.originalVelocities.clear();
    
    // 4. Request voice manager to release all arpeggiated notes
    if (this.voiceManager) {
      if (typeof this.voiceManager.emergencyReleaseAll === 'function') {
        this.voiceManager.emergencyReleaseAll();
      } else if (typeof this.voiceManager.allNotesOff === 'function') {
        this.voiceManager.allNotesOff((voice) => {
          if (voice && typeof voice.stop === 'function') {
            voice.stop(true); // true = immediate
          }
        });
      }
    }
    
    return true;
  }
}
