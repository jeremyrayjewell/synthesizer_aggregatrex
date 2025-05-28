export const midiToFrequency = (midiNote) => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

export const noteNameToMidi = (noteName) => {
  const noteMap = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const octave = parseInt(noteName.slice(-1));
  const note = noteName.slice(0, -1);
  if (noteMap[note] !== undefined && !isNaN(octave)) {
    return noteMap[note] + (octave + 1) * 12;
  }
  return null; 
};
