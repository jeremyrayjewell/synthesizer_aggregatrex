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
  // Knob and slider sizes
  SMALL_KNOB_SIZE: 0.35,
  MEDIUM_KNOB_SIZE: 0.4,
  LARGE_KNOB_SIZE: 0.5,
  
  // Slider dimensions
  SLIDER_THICKNESS: 0.08,
  SLIDER_LENGTH: 1.75,
  
  // Text spacing
  TITLE_OFFSET: 0.06,
  
  // Panel adjustments
  FILTER_TOP_ADJUSTMENT: -0.25,
  FILTER_LOW_ADJUSTMENT: -0.25,
  ADSR_SLIDER_Y_ADJUSTMENT: 0.,
  
  // Common spacings
  SLIDER_SPACING: 0.35
};
