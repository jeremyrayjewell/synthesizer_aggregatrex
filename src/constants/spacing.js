// Shared spacing constants for consistent layout across all panels

// Standard Z-depth offsets
export const KNOB_Z_OFFSET = 0.1;
export const SLIDER_Z_OFFSET = 0.1;
export const TEXT_Z_OFFSET = 0.01;

// Common fractional positioning
export const TOP_THIRD = 1 / 3;
export const BOTTOM_THIRD = -1 / 3;
export const TOP_QUARTER = 1 / 4;
export const BOTTOM_QUARTER = -1 / 4;
export const TOP_FIFTH = 1 / 5;
export const BOTTOM_FIFTH = -1 / 5;

export const LEFT_QUARTER = -1 / 4;
export const RIGHT_QUARTER = 1 / 4;
export const LEFT_EIGHTH = -1 / 8;
export const RIGHT_EIGHTH = 1 / 8;
export const LEFT_FIFTH = -1 / 5;
export const RIGHT_FIFTH = 1 / 5;

export const CENTER_X = 0;
export const CENTER_Y = 0;

// Helper functions for consistent positioning
export const createPositioning = (width, height, depth) => ({
  // Y positions
  topY: height * TOP_QUARTER,
  bottomY: height * BOTTOM_QUARTER,
  topThirdY: height * TOP_THIRD,
  bottomThirdY: height * BOTTOM_THIRD,
  topFifthY: height * TOP_FIFTH,
  bottomFifthY: height * BOTTOM_FIFTH,
  centerY: CENTER_Y,
  
  // X positions
  leftX: width * LEFT_QUARTER,
  rightX: width * RIGHT_QUARTER,
  leftEighthX: width * LEFT_EIGHTH,
  rightEighthX: width * RIGHT_EIGHTH,
  leftFifthX: width * LEFT_FIFTH,
  rightFifthX: width * RIGHT_FIFTH,
  centerX: CENTER_X,
  
  // Z positions
  knobZ: depth / 2 + KNOB_Z_OFFSET,
  sliderZ: depth / 2 + SLIDER_Z_OFFSET,
  textZ: depth / 2 + TEXT_Z_OFFSET
});

// Common spacing values used across panels
export const COMMON_SPACING = {
  // Knob sizes - standardized across all panels
  SMALL_KNOB_SIZE: 0.35,        // For toggles/sub-oscillator controls
  MEDIUM_KNOB_SIZE: 0.45,       // Standard panel knobs (most common)
  LARGE_KNOB_SIZE: 0.45,        // Same as medium for consistency
  MASTER_KNOB_SIZE: 0.55,       // Master volume knob - slightly larger but not huge
  
  // Toggle switch sizes - standardized
  SMALL_TOGGLE_SIZE: 0.15,      // Effects toggles
  MEDIUM_TOGGLE_SIZE: 0.2,      // Standard toggles
  LARGE_TOGGLE_SIZE: 0.35,      // Primary/panel toggles
  
  // Slider dimensions - standardized
  SLIDER_THICKNESS: 0.08,
  SLIDER_LENGTH: 1.75,
  
  // Text sizing - standardized
  TITLE_FONT_SIZE: 0.1,         // Panel titles
  LABEL_FONT_SIZE: 0.06,        // Knob/control labels
  VALUE_FONT_SIZE: 0.08,        // Value displays
  SECTION_FONT_SIZE: 0.12,      // Section headers (effects)
  
  // Text spacing and positioning
  TITLE_OFFSET: 0.06,
  LABEL_Y_OFFSET: -0.4,         // Relative to knob size
  VALUE_Y_OFFSET: 0.4,          // Relative to knob size
  
  // Panel adjustments
  FILTER_TOP_ADJUSTMENT: -0.25,
  FILTER_LOW_ADJUSTMENT: -0.25,
  ADSR_SLIDER_Y_ADJUSTMENT: 0,
  
  // Common spacings
  SLIDER_SPACING: 0.35,
  
  // Waveform selector sizing
  WAVEFORM_SIZE: 0.5,
  WAVEFORM_FONT_MULTIPLIER: 0.2,  // Relative to size
  WAVEFORM_LABEL_MULTIPLIER: 0.15 // Relative to size
};
