// MIDI Constants
export const MIDI_NOTE_OFF = 0x80;
export const MIDI_NOTE_ON = 0x90;
export const MIDI_PITCH_BEND = 0xE0;
export const MIDI_CC = 0xB0;

// Audio Engine Constants
export const MAX_VOICES = 8;
export const DEFAULT_ATTACK_TIME = 0.01;
export const DEFAULT_RELEASE_TIME = 0.5;
export const DEFAULT_MASTER_VOLUME = 0.4;

// Oscillator Constants
export const OSC_TYPES = ['sine', 'square', 'sawtooth', 'triangle'];

// Detune constants (expanded range for more audible effect)
export const DETUNE_MIN = -1200;       // -1200 cents (1 octave down)
export const DETUNE_MAX = 1200;        // +1200 cents (1 octave up)
export const DEFAULT_DETUNE = 0;

// Pulse width constants
export const PULSE_WIDTH_MIN = 0.05;   // 5%
export const PULSE_WIDTH_MAX = 0.95;   // 95%
export const DEFAULT_PULSE_WIDTH = 0.5; // 50%

// Sub-oscillator constants
export const DEFAULT_SUB_ENABLED = false;
export const DEFAULT_SUB_MIX = 0.3;    // 30% blend
export const SUB_MIX_MIN = 0;
export const SUB_MIX_MAX = 1;
export const SUB_OSC_TYPES = ['sine', 'square', 'triangle']; // Fewer options for sub
export const DEFAULT_SUB_WAVEFORM = 'sine';

// Filter Constants
export const FILTER_CUTOFF_MIN = 20; 
export const FILTER_CUTOFF_MAX = 20000; 
export const RESONANCE_MIN = 0;
export const RESONANCE_MAX = 30;

// Arpeggiator Constants
export const DEFAULT_ARP_ENABLED = false;
export const DEFAULT_ARP_RATE = 120; // BPM
export const ARP_RATE_MIN = 60;
export const ARP_RATE_MAX = 300;

export const ARP_PATTERNS = ['up', 'down', 'updown', 'random', 'played'];
export const DEFAULT_ARP_PATTERN = 'up';

export const DEFAULT_ARP_OCTAVES = 1;
export const ARP_OCTAVES_MIN = 1;
export const ARP_OCTAVES_MAX = 4;

export const DEFAULT_ARP_GATE = 0.8; // 80% of step length
export const ARP_GATE_MIN = 0.1;
export const ARP_GATE_MAX = 1.0;

export const DEFAULT_ARP_SWING = 0; // No swing
export const ARP_SWING_MIN = -0.5;
export const ARP_SWING_MAX = 0.5;

export const DEFAULT_ARP_STEP_LENGTH = 4; // Quarter notes
export const ARP_STEP_LENGTHS = [1, 2, 4, 8, 16, 32]; // Note divisions

export const ARP_VELOCITY_MODES = ['original', 'fixed', 'accent', 'random'];
export const DEFAULT_ARP_VELOCITY_MODE = 'original';

export const DEFAULT_ARP_HOLD_MODE = false;

// Effects Constants
export const EFFECT_TYPES = ['distortion', 'eq', 'compressor', 'chorus', 'delay', 'reverb'];

// Distortion Constants
export const DEFAULT_DISTORTION_ENABLED = false;
export const DEFAULT_DISTORTION_DRIVE = 0.3;
export const DEFAULT_DISTORTION_TONE = 0.5;
export const DEFAULT_DISTORTION_MIX = 0.5;

// EQ Constants
export const DEFAULT_EQ_ENABLED = false;
export const DEFAULT_EQ_LOW_GAIN = 0;
export const DEFAULT_EQ_LOW_FREQ = 320;
export const DEFAULT_EQ_MID_GAIN = 0;
export const DEFAULT_EQ_MID_FREQ = 1000;
export const DEFAULT_EQ_MID_Q = 1;
export const DEFAULT_EQ_HIGH_GAIN = 0;
export const DEFAULT_EQ_HIGH_FREQ = 3200;

// Compressor Constants
export const DEFAULT_COMPRESSOR_ENABLED = false;
export const DEFAULT_COMPRESSOR_THRESHOLD = -24;
export const DEFAULT_COMPRESSOR_RATIO = 4;
export const DEFAULT_COMPRESSOR_ATTACK = 0.003;
export const DEFAULT_COMPRESSOR_RELEASE = 0.25;
export const DEFAULT_COMPRESSOR_MAKEUP = 1.2;

// Chorus Constants
export const DEFAULT_CHORUS_ENABLED = false;
export const DEFAULT_CHORUS_RATE = 0.5;
export const DEFAULT_CHORUS_DEPTH = 0.3;
export const DEFAULT_CHORUS_MIX = 0.5;

// Delay Constants
export const DEFAULT_DELAY_ENABLED = false;
export const DEFAULT_DELAY_TIME = 0.3;
export const DEFAULT_DELAY_FEEDBACK = 0.3;
export const DEFAULT_DELAY_MIX = 0.3;
export const DEFAULT_DELAY_DAMPING = 0.5;

// Reverb Constants
export const DEFAULT_REVERB_ENABLED = false;
export const DEFAULT_REVERB_SIZE = 0.5;
export const DEFAULT_REVERB_DECAY = 2;
export const DEFAULT_REVERB_MIX = 0.3;
export const DEFAULT_REVERB_PREDELAY = 0.02;
export const DEFAULT_REVERB_DAMPING = 0.3;
