/**
 * MIDI Debugger Utility
 * This utility helps identify and debug stuck MIDI notes
 */

class MIDIDebugger {
  constructor() {
    this.activeNotes = new Map(); // Maps note number to activation timestamp
    this.stuckThreshold = 10000; // Consider a note stuck if active for 10+ seconds
    this.debug = true; // Enable/disable debugging
  }

  // Log a note-on event
  noteOn(noteNumber, velocity) {
    if (!this.debug) return;
    
    this.activeNotes.set(noteNumber, {
      timestamp: Date.now(),
      velocity
    });
    
    console.log(`[MIDI Debug] Note On: ${noteNumber}, velocity: ${velocity}, active notes: ${this.activeNotes.size}`);
  }
  
  // Log a note-off event
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
  
  // Check for stuck notes
  checkForStuckNotes() {
    if (!this.debug) return [];
    
    const now = Date.now();
    const stuckNotes = [];
    
    this.activeNotes.forEach((data, noteNumber) => {
      const duration = now - data.timestamp;
      if (duration > this.stuckThreshold) {
        stuckNotes.push({
          note: noteNumber,
          duration
        });
      }
    });
    
    if (stuckNotes.length > 0) {
      console.warn(`[MIDI Debug] Found ${stuckNotes.length} stuck notes:`, stuckNotes);
    }
    
    return stuckNotes;
  }
  
  // Clear all tracked notes
  clearAll() {
    if (!this.debug) return;
    
    const noteCount = this.activeNotes.size;
    if (noteCount > 0) {
      console.log(`[MIDI Debug] Clearing all ${noteCount} active notes`);
    }
    
    this.activeNotes.clear();
  }
  
  // Get currently active notes
  getActiveNotes() {
    return [...this.activeNotes.keys()];
  }
}

// Create a singleton instance
const midiDebugger = new MIDIDebugger();

export default midiDebugger;
