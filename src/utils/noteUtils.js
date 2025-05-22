// noteUtils.js

// Example: Convert MIDI note number to frequency
export const midiToFrequency = (midiNote) => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Example: Convert note name (e.g., "C4") to MIDI number
export const noteNameToMidi = (noteName) => {
  // Basic implementation, can be expanded
  const noteMap = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const octave = parseInt(noteName.slice(-1));
  const note = noteName.slice(0, -1);
  if (noteMap[note] !== undefined && !isNaN(octave)) {
    return noteMap[note] + (octave + 1) * 12;
  }
  return null; // Or throw error
};
