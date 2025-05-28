class MIDIDebugger {
  constructor() {
    this.activeNotes = new Map();
    this.stuckThreshold = 10000;
    this.debug = true;
  }

  noteOn(noteNumber, velocity) {
    if (!this.debug) return;
    this.activeNotes.set(noteNumber, {
      timestamp: Date.now(),
      velocity
    });
    console.log(`[MIDI Debug] Note On: ${noteNumber}, velocity: ${velocity}, active notes: ${this.activeNotes.size}`);
  }

  noteOff(noteNumber) {
    if (!this.debug) return;
    if (this.activeNotes.has(noteNumber)) {
      const noteData = this.activeNotes.get(noteNumber);
      const duration = Date.now() - noteData.timestamp;
      console.log(`[MIDI Debug] Note Off: ${noteNumber}, duration: ${duration}ms, remaining notes: ${this.activeNotes.size - 1}`);
      this.activeNotes.delete(noteNumber);
    } else {
      console.warn(`[MIDI Debug] Note Off received for inactive note: ${noteNumber}`);
    }
  }

  checkForStuckNotes() {
    if (!this.debug) return [];
    const now = Date.now();
    const stuckNotes = [];
    this.activeNotes.forEach((data, noteNumber) => {
      const duration = now - data.timestamp;
      if (duration > this.stuckThreshold) {
        stuckNotes.push({ note: noteNumber, duration });
      }
    });
    if (stuckNotes.length > 0) {
      console.warn(`[MIDI Debug] Found ${stuckNotes.length} stuck notes:`, stuckNotes);
    }
    return stuckNotes;
  }

  clearAll() {
    if (!this.debug) return;
    const noteCount = this.activeNotes.size;
    if (noteCount > 0) {
      console.log(`[MIDI Debug] Clearing all ${noteCount} active notes`);
    }
    this.activeNotes.clear();
  }

  getActiveNotes() {
    return [...this.activeNotes.keys()];
  }
}

const midiDebugger = new MIDIDebugger();

export default midiDebugger;
