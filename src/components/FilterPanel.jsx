import React from 'react';
import Knob from './Knob';
import Slider from './Slider';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const FilterPanel = ({
  filterEnabled = true,
  filterType = 'lowpass',
  onFilterTypeChange = () => {},
  filterFreq = 2000,
  onFilterFreqChange = () => {},
  filterQ = 1,
  onFilterQChange = () => {},
  width = 5,
  height = 0.5,
  depth = 0.2,
  color = '#333333',
  knobColor = '#8bc34a'
}) => {
  const getFilterTypeValue = () => {
    if (!filterEnabled) return 0;
    return filterType === 'lowpass' ? 0.33 :
           filterType === 'highpass' ? 0.67 : 1;
  };

  const getFilterFreqValue = () => {
    return ((filterFreq || 2000) - 50) / 16000;
  };

  const getFilterQValue = () => {
    return (filterQ - 0.1) / 19.9;
  };

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <Text
        position={[0, height / 2 - 0.06, depth / 2 + 0.01]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        FILTER
      </Text>
      <group position={[-width / 5, height / 3 - 0.25, depth / 2 + 0.1]}>
        <Knob
          size={0.5}
          value={getFilterTypeValue()}
          min={0}
          max={1}
          onChange={(value) => {
            let newFilterEnabled = true;
            let newType = filterType;
            if (value < 0.1) {
              newFilterEnabled = false;
            } else if (value < 0.45) {
              newType = 'lowpass';
            } else if (value < 0.78) {
              newType = 'highpass';
            } else {
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
      </group>
      <group position={[width / 5, height / 3 - 0.25, depth / 2 + 0.1]}>
        <Knob
          size={0.5}
          value={getFilterQValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const newQ = value * 19.9 + 0.1;
            onFilterQChange(newQ);
          }}
          label="RESONANCE"
          color={knobColor}
          valueFormatter={(val) => {
            const q = val * 19.9 + 0.1;
            return q.toFixed(1);
          }}
        />
      </group>
      <group position={[0, -0.25, depth / 2.5 + 0.1]}>
        <Slider
          length={width * 0.75}
          thickness={height * 0.03}
          value={getFilterFreqValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const frequency = value * 16000 + 50;
            onFilterFreqChange(frequency);
          }}
          label="FREQUENCY"
          color={knobColor}
          orientation="horizontal"
          valueFormatter={(val) => {
            if (!filterEnabled) return "OFF";
            const freq = val * 16000 + 50;
            return freq < 1000 ? `${Math.round(freq)}Hz` : `${(freq / 1000).toFixed(1)}kHz`;
          }}
        />
      </group>
    </group>
  );
};

export default FilterPanel;
