import { useEffect } from 'react';

// Simple map from QWERTY keys to MIDI notes
const keyToNote = {
  a: 60, // C4
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72, // C5
};

export default function useQwertyInput(onNoteOn, onNoteOff) {
  useEffect(() => {
    const down = new Set();

    const handleKeyDown = (e) => {
      if (!down.has(e.key) && keyToNote[e.key]) {
        down.add(e.key);
        onNoteOn(keyToNote[e.key], 127);
      }
    };

    const handleKeyUp = (e) => {
      if (keyToNote[e.key]) {
        down.delete(e.key);
        onNoteOff(keyToNote[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onNoteOn, onNoteOff]);
}
