
class MIDIVoiceManager {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.activeVoices = new Map();
    this.pendingReleases = new Map();
    this.scheduledVoices = new Map();
    this.releasedVoices = new Set();
    this.voiceCount = 0;
    this.maxVoices = 32;
    this.lastNoteOnTime = new Map();
    this.CLEANUP_INTERVAL = 2000;
    this.cleanupInterval = setInterval(() => this.performCleanup(), this.CLEANUP_INTERVAL);
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
  }

  noteOn(note, velocity, voiceFactory) {
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
            voice.stop(true);
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
}

export default MIDIVoiceManager;
