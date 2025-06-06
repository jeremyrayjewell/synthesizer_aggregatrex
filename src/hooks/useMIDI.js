import { useEffect, useRef, useCallback } from 'react';
import midiDebugger from '../utils/midiDebugger';

export function useMIDI(onNoteOn, onNoteOff) {
  const activeNotesRef = useRef(new Set());
  const processingRef = useRef(false);
  const messageBatchTimerRef = useRef(null);
  const messageQueueRef = useRef([]);
  const lastActivityRef = useRef(Date.now());
  const panicModeRef = useRef(false);
  const noteStatesRef = useRef(new Map());
  
  // Performance optimization: adaptive batch processing
  const highVelocityThresholdRef = useRef(10); // messages per 100ms
  const lastMessageCountRef = useRef(0);
  const lastCountCheckRef = useRef(Date.now());

  const clearAllNotes = useCallback(() => {
    console.log('MIDI Panic: Clearing all notes');
    panicModeRef.current = true;
    const notes = [...activeNotesRef.current];
    notes.forEach(note => {
      try {
        onNoteOff(note);
      } catch (e) {
        console.error(`Error sending note off for note ${note} during panic:`, e);
      }
    });
    activeNotesRef.current.clear();
    noteStatesRef.current.clear();
    messageQueueRef.current = [];
    midiDebugger.clearAll();
    setTimeout(() => {
      panicModeRef.current = false;
    }, 500);
    return true;
  }, [onNoteOff]);
  const processMessageBatch = useCallback(() => {
    if (processingRef.current || messageQueueRef.current.length === 0) return;
    processingRef.current = true;
    lastActivityRef.current = Date.now();
    
    try {
      // Performance optimization: adaptive batch size based on queue length
      const queueLength = messageQueueRef.current.length;
      const batchSize = queueLength > 50 ? 20 : queueLength > 20 ? 15 : 10;
      const batch = messageQueueRef.current.splice(0, batchSize);
      
      batch.forEach(message => {
        const { status, note, velocity } = message;
        const command = status & 0xf0;
        const channel = status & 0x0f;
        if (panicModeRef.current && command !== 0xB0) return;
        try {
          if (command === 0x90 && velocity > 0) {
            const now = Date.now();
            noteStatesRef.current.set(note, { active: true, timestamp: now, velocity });
            activeNotesRef.current.add(note);
            midiDebugger.noteOn(note, velocity);
            onNoteOn(note, velocity);
          } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
            if (noteStatesRef.current.has(note)) {
              const noteState = noteStatesRef.current.get(note);
              noteState.active = false;
              noteStatesRef.current.set(note, noteState);
            }
            activeNotesRef.current.delete(note);
            midiDebugger.noteOff(note);
            onNoteOff(note);
          } else if (command === 0xB0) {
            if (note === 123 || note === 120) clearAllNotes();
          }
        } catch (e) {
          console.error(`Error processing MIDI message (status: ${status}, note: ${note}):`, e);
        }
      });
    } catch (e) {
      console.error('Error processing MIDI message batch:', e);
    }
    
    if (messageQueueRef.current.length > 0) {
      // Performance optimization: dynamic timeout based on queue pressure
      const timeout = messageQueueRef.current.length > 30 ? 0 : 1;
      messageBatchTimerRef.current = setTimeout(processMessageBatch, timeout);
    }
    processingRef.current = false;
  }, [onNoteOn, onNoteOff, clearAllNotes]);

  const queueMIDIMessage = useCallback((message) => {
    const [status, note, velocity] = message.data;
    messageQueueRef.current.push({ status, note, velocity });
    if (!processingRef.current && !messageBatchTimerRef.current) {
      messageBatchTimerRef.current = setTimeout(() => {
        messageBatchTimerRef.current = null;
        processMessageBatch();
      }, 0);
    }
  }, [processMessageBatch]);

  useEffect(() => {
    let midiAccess = null;
    const initMIDI = async () => {
      try {
        midiAccess = await navigator.requestMIDIAccess();
        for (let input of midiAccess.inputs.values()) {
          console.log(`Connected MIDI input: ${input.name}`);
          input.onmidimessage = queueMIDIMessage;
        }
        console.log('MIDI inputs connected:');
        for (let input of midiAccess.inputs.values()) {
          console.log(`- ${input.name || 'Unnamed device'} (${input.manufacturer || 'Unknown manufacturer'})`);
        }
        midiAccess.onstatechange = (event) => {
          const port = event.port;
          if (port.type === 'input') {
            console.log(`MIDI port ${port.name || 'Unnamed'} ${port.state}`);
            if (port.state === 'connected') port.onmidimessage = queueMIDIMessage;
          }
        };
      } catch (e) {
        console.error('Failed to initialize MIDI access:', e);
      }
    };

    initMIDI();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed: triggering MIDI panic');
        clearAllNotes();
      }
    };

    const handleBlur = () => {
      console.log('Window lost focus: clearing all notes');
      clearAllNotes();
    };

    const safetyInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > 10000) {
        const stuckNotes = midiDebugger.checkForStuckNotes();
        if (stuckNotes.length > 0) {
          console.warn(`Safety check: Found ${stuckNotes.length} stuck notes, clearing all notes`);
          clearAllNotes();
        }
      }
      if (activeNotesRef.current.size > 0) {
        const debuggerNotes = new Set(midiDebugger.getActiveNotes());
        const orphanedNotes = [];
        activeNotesRef.current.forEach(note => {
          if (!debuggerNotes.has(note)) orphanedNotes.push(note);
        });
        if (orphanedNotes.length > 0) {
          console.warn(`Safety check: Found ${orphanedNotes.length} orphaned notes, sending note-offs`);
          orphanedNotes.forEach(note => {
            activeNotesRef.current.delete(note);
            onNoteOff(note);
          });
        }
      }
    }, 5000);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(safetyInterval);
      if (messageBatchTimerRef.current) clearTimeout(messageBatchTimerRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      if (midiAccess) {
        for (let input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
      clearAllNotes();
    };
  }, [queueMIDIMessage, clearAllNotes, onNoteOff]);

  return { clearAllNotes };
}
