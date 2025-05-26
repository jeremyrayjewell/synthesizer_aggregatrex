import React from 'react';
import Knob from './Knob';
import Slider from './Slider';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const FilterPanel = ({ 
  // Filter type properties
  filterEnabled = true,
  filterType = 'lowpass',
  onFilterTypeChange = () => {},
  
  // Filter frequency properties
  filterFreq = 2000,
  onFilterFreqChange = () => {},
    // Filter resonance properties
  filterQ = 1,
  onFilterQChange = () => {},  // Styling
  width = 5,
  height = 0.5, // Extreme minimal height with component overlap
  depth = 0.2,
  color = '#333333',
  knobColor = '#8bc34a'
})=> {
  // Convert filter type to normalized value for knob
  const getFilterTypeValue = () => {
    if (!filterEnabled) return 0;
    return filterType === 'lowpass' ? 0.33 : 
           filterType === 'highpass' ? 0.67 : 1;
  };
  
  // Get normalized value for frequency slider
  const getFilterFreqValue = () => {
    return ((filterFreq || 2000) - 50) / 16000; // Normalize to 0-1 range
  };
  
  // Get normalized value for resonance knob
  const getFilterQValue = () => {
    return (filterQ - 0.1) / 19.9; // Normalize to 0-1 range (Q from 0.1 to 20)
  };
  
  return (
    <group>
      {/* Panel background */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>      {/* Panel title - extremely close to top edge */}
      <Text 
        position={[0, height/2 - 0.06, depth/2 + 0.01]} 
        fontSize={0.1} /* Keeping text readable size */
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        FILTER
      </Text>      {/* Filter Type Knob - positioned at left side with virtually no space between title and knob */}      
      <group position={[-width/5, height/3 - 0.25, depth/2 + 0.1]}>
        <Knob
          size={0.5} /* Minimal knob size */
          value={getFilterTypeValue()}
          min={0}
          max={1}
          onChange={(value) => {
            // Convert normalized value to filter settings
            let newFilterEnabled = true;
            let newType = filterType;
            
            if (value < 0.1) {
              // OFF position - disable filter
              newFilterEnabled = false;
            } else if (value < 0.45) {
              // LOW position
              newType = 'lowpass';
            } else if (value < 0.78) {
              // HIGH position
              newType = 'highpass';
            } else {
              // BAND position
              newType = 'bandpass';
            }
            
            onFilterTypeChange(newType, newFilterEnabled);
          }}
          label="TYPE"
          color={knobColor}
          valueFormatter={(val) => {
            if (val < 0.1) return "OFF";
            return val < 0.45 ? 'LOW' :
                   val < 0.78 ? 'HIGH' : 'BAND';
          }}
        />
      </group>      {/* Filter Resonance Knob - positioned at right side with virtually no space between title and knob */}     
       <group position={[width/5, height/3 - 0.25, depth/2 + 0.1]}>
        <Knob
          size={0.5} /* Minimal knob size */
          value={getFilterQValue()}
          min={0}
          max={1}
          onChange={(value) => {
            // Convert normalized value to Q range (0.1 to 20)
            const newQ = value * 19.9 + 0.1;
            onFilterQChange(newQ);
          }}
          label="RESONANCE"
          color={knobColor}
          valueFormatter={(val) => {
            // Show resonance value with appropriate precision
            const q = val * 19.9 + 0.1;
            return q.toFixed(1);
          }}        />      </group>      {/* Filter Frequency Slider - positioned extremely close to the knobs */}
      <group position={[0, -0.25, depth/2.5 + 0.1]}> {/* Moved much closer to the knobs */}
        <Slider
          length={width * 0.75}
          thickness={height * 0.03} /* Even thinner slider */
          value={getFilterFreqValue()}
          min={0}
          max={1}
          onChange={(value) => {
            // Convert normalized value to frequency range
            const frequency = value * 16000 + 50;
            onFilterFreqChange(frequency);
          }}
          label="FREQUENCY"
          color={knobColor}
          orientation="horizontal"
          valueFormatter={(val) => {
            if (!filterEnabled) return "OFF";
            
            // Convert the normalized value to frequency in Hz
            const freq = val * 16000 + 50;
            return freq < 1000 ? `${Math.round(freq)}Hz` : `${(freq/1000).toFixed(1)}kHz`;
          }}
        />
      </group>
    </group>
  );
};

export default FilterPanel;
