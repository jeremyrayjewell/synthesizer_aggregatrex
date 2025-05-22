import { useEffect, useRef, useCallback } from 'react';
import midiDebugger from '../utils/midiDebugger';

/**
 * Custom hook for handling MIDI input
 * Provides robust handling of MIDI messages and protection against stuck notes
 */
export function useMIDI(onNoteOn, onNoteOff) {
  // Refs to maintain state across renders
  const activeNotesRef = useRef(new Set());
  const processingRef = useRef(false);
  const messageBatchTimerRef = useRef(null);
  const messageQueueRef = useRef([]);
  const lastActivityRef = useRef(Date.now());
  const panicModeRef = useRef(false);
  
  // Track note states with timestamps
  const noteStatesRef = useRef(new Map()); // note -> { active, timestamp, velocity }
  
  // Function to clear all active notes (panic function)
  const clearAllNotes = useCallback(() => {
    console.log('MIDI Panic: Clearing all notes');
    panicModeRef.current = true;
    
    // Send note-off for all active notes
    const notes = [...activeNotesRef.current];
    notes.forEach(note => {
      try {
        onNoteOff(note);
      } catch (e) {
        console.error(`Error sending note off for note ${note} during panic:`, e);
      }
    });
    
    // Clear all state
    activeNotesRef.current.clear();
    noteStatesRef.current.clear();
    messageQueueRef.current = [];
    
    // Clear MIDI debugger
    midiDebugger.clearAll();
    
    // Exit panic mode after a short delay
    setTimeout(() => {
      panicModeRef.current = false;
    }, 500);
    
    return true;
  }, [onNoteOff]);
  
  // Process a batch of MIDI messages
  const processMessageBatch = useCallback(() => {
    if (processingRef.current || messageQueueRef.current.length === 0) {
      return;
    }
    
    processingRef.current = true;
    lastActivityRef.current = Date.now();
    
    try {
      // Take up to 10 messages from the queue
      const batch = messageQueueRef.current.splice(0, 10);
      
      // Process each message in the batch
      batch.forEach(message => {
        const { status, note, velocity } = message;
        const command = status & 0xf0; // Extract command nibble
        const channel = status & 0x0f; // Extract channel nibble
        
        // Skip processing in panic mode except for control change messages
        if (panicModeRef.current && command !== 0xB0) {
          return;
        }
        
        try {
          if (command === 0x90 && velocity > 0) {
            // Note On
            const now = Date.now();
            
            // Update note state
            noteStatesRef.current.set(note, {
              active: true,
              timestamp: now,
              velocity
            });
            
            // Add to active notes set
            activeNotesRef.current.add(note);
            
            // Log to MIDI debugger
            midiDebugger.noteOn(note, velocity);
            
            // Call note on handler
            onNoteOn(note, velocity);
          } 
          else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
            // Note Off
            
            // Update note state
            if (noteStatesRef.current.has(note)) {
              const noteState = noteStatesRef.current.get(note);
              noteState.active = false;
              noteStatesRef.current.set(note, noteState);
            }
            
            // Remove from active notes set
            activeNotesRef.current.delete(note);
            
            // Log to MIDI debugger
            midiDebugger.noteOff(note);
            
            // Call note off handler
            onNoteOff(note);
          } 
          else if (command === 0xB0) {
            // Control Change
            if (note === 123 || note === 120) {
              // All Notes Off (123) or All Sound Off (120)
              clearAllNotes();
            }
          }
        } catch (e) {
          console.error(`Error processing MIDI message (status: ${status}, note: ${note}):`, e);
        }
      });
    } catch (e) {
      console.error('Error processing MIDI message batch:', e);
    }
    
    // If there are more messages in the queue, schedule another batch
    if (messageQueueRef.current.length > 0) {
      messageBatchTimerRef.current = setTimeout(processMessageBatch, 1);
    }
    
    processingRef.current = false;
  }, [onNoteOn, onNoteOff, clearAllNotes]);
  
  // Queue a MIDI message for processing
  const queueMIDIMessage = useCallback((message) => {
    // Extract message data
    const [status, note, velocity] = message.data;
    
    // Queue the message
    messageQueueRef.current.push({ status, note, velocity });
    
    // Start processing if not already in progress
    if (!processingRef.current && !messageBatchTimerRef.current) {
      messageBatchTimerRef.current = setTimeout(() => {
        messageBatchTimerRef.current = null;
        processMessageBatch();
      }, 0);
    }
  }, [processMessageBatch]);
  
  // Set up MIDI access and event handling
  useEffect(() => {
    let midiAccess = null;
    
    // Function to initialize MIDI access
    const initMIDI = async () => {
      try {
        // Request MIDI access
        midiAccess = await navigator.requestMIDIAccess();
        
        // Set up MIDI input handlers
        for (let input of midiAccess.inputs.values()) {
          console.log(`Connected MIDI input: ${input.name}`);
          input.onmidimessage = queueMIDIMessage;
        }
        
        // Log connected MIDI devices
        console.log('MIDI inputs connected:');
        for (let input of midiAccess.inputs.values()) {
          console.log(`- ${input.name || 'Unnamed device'} (${input.manufacturer || 'Unknown manufacturer'})`);
        }
        
        // Set up state change handler
        midiAccess.onstatechange = (event) => {
          const port = event.port;
          
          if (port.type === 'input') {
            console.log(`MIDI port ${port.name || 'Unnamed'} ${port.state}`);
            
            if (port.state === 'connected') {
              port.onmidimessage = queueMIDIMessage;
            }
          }
        };
      } catch (e) {
        console.error('Failed to initialize MIDI access:', e);
      }
    };
    
    // Initialize MIDI
    initMIDI();
    
    // Set up panic button (Escape key)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed: triggering MIDI panic');
        clearAllNotes();
      }
    };
    
    // Set up window blur handler
    const handleBlur = () => {
      console.log('Window lost focus: clearing all notes');
      clearAllNotes();
    };
    
    // Set up safety interval to check for stuck notes
    const safetyInterval = setInterval(() => {
      const now = Date.now();
      
      // Check if there's been no MIDI activity for more than 10 seconds
      if (now - lastActivityRef.current > 10000) {
        // Check for stuck notes using the MIDI debugger
        const stuckNotes = midiDebugger.checkForStuckNotes();
        
        // If we have stuck notes, clear them
        if (stuckNotes.length > 0) {
          console.warn(`Safety check: Found ${stuckNotes.length} stuck notes, clearing all notes`);
          clearAllNotes();
        }
      }
      
      // Check for orphaned notes (active in our state but not in the debugger)
      if (activeNotesRef.current.size > 0) {
        const debuggerNotes = new Set(midiDebugger.getActiveNotes());
        const orphanedNotes = [];
        
        activeNotesRef.current.forEach(note => {
          if (!debuggerNotes.has(note)) {
            orphanedNotes.push(note);
          }
        });
        
        // If we have orphaned notes, send note-offs for them
        if (orphanedNotes.length > 0) {
          console.warn(`Safety check: Found ${orphanedNotes.length} orphaned notes, sending note-offs`);
          
          orphanedNotes.forEach(note => {
            activeNotesRef.current.delete(note);
            onNoteOff(note);
          });
        }
      }
    }, 5000);
    
    // Register event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    
    // Cleanup function
    return () => {
      // Clear timers
      clearInterval(safetyInterval);
      
      if (messageBatchTimerRef.current) {
        clearTimeout(messageBatchTimerRef.current);
      }
      
      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      
      // Disconnect MIDI inputs
      if (midiAccess) {
        for (let input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
      
      // Clear all notes
      clearAllNotes();
    };
  }, [queueMIDIMessage, clearAllNotes, onNoteOff]);
  
  // Return the clearAllNotes function for external use
  return { clearAllNotes };
}
