import { useEffect } from 'react';

export function useMIDI(onNoteOn, onNoteOff) {
  useEffect(() => {
    let midiAccess = null;

    const handleMIDIMessage = (message) => {
      const [status, note, velocity] = message.data;

      const command = status & 0xf0;
      if (command === 0x90 && velocity > 0) {
        onNoteOn(note, velocity);
      } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
        onNoteOff(note);
      }
    };

    const initMIDI = async () => {
      try {
        midiAccess = await navigator.requestMIDIAccess();
        for (let input of midiAccess.inputs.values()) {
          input.onmidimessage = handleMIDIMessage;
        }
      } catch (err) {
        console.error('MIDI access failed:', err);
      }
    };

    initMIDI();

    return () => {
      if (midiAccess) {
        for (let input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, [onNoteOn, onNoteOff]);
}
