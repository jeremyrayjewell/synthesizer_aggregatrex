import React from 'react';
import { Text } from '@react-three/drei';
import Knob from './Knob';
import ToggleSwitch from './ToggleSwitch';
import { useSynthContext } from '../hooks/useSynth';
import {
  ARP_RATE_MIN,
  ARP_RATE_MAX,
  ARP_PATTERNS,
  ARP_OCTAVES_MIN,
  ARP_OCTAVES_MAX,
  ARP_GATE_MIN,
  ARP_GATE_MAX,
  ARP_SWING_MIN,
  ARP_SWING_MAX,
  ARP_STEP_LENGTHS,
  ARP_VELOCITY_MODES
} from '../constants/synth';

const ArpeggiatorPanel = ({
  position = [0, 0, 0],
  width = 4,
  height = 3.2,
  depth = 0.2
}) => {  const { synthParams, setSynthParams, synth } = useSynthContext();
  
  // Debug logging
  console.log("🎹 ArpeggiatorPanel rendering at position:", position);
  
  // Enhanced null checking with detailed logging
  if (!synthParams) {
    console.error("ArpeggiatorPanel: synthParams is null or undefined");
    return null;
  }
  
  if (!synthParams.arpeggiator) {
    console.error("ArpeggiatorPanel: arpeggiator not found in synthParams:", synthParams);
    return null;
  }
  
  const arpeggiator = synthParams.arpeggiator;
  console.log("ArpeggiatorPanel - arpeggiator state:", arpeggiator);
  
  // Z-positioning for elements
  const knobZ = depth + 0.01;
  
  // Layout calculations - 3x3 grid
  const rowHeight = height / 3.6;
  const colWidth = width / 3;
  
  // Position helpers
  const getPosition = (col, row) => [
    (col - 1) * colWidth,
    (1 - row) * rowHeight,
    knobZ
  ];
  
  // Value scaling helpers
  const rateValue = () => (arpeggiator.rate - ARP_RATE_MIN) / (ARP_RATE_MAX - ARP_RATE_MIN);
  const patternValue = () => {
    const index = ARP_PATTERNS.indexOf(arpeggiator.pattern);
    return index >= 0 ? index / (ARP_PATTERNS.length - 1) : 0;
  };
  const octavesValue = () => (arpeggiator.octaves - ARP_OCTAVES_MIN) / (ARP_OCTAVES_MAX - ARP_OCTAVES_MIN);
  const gateValue = () => (arpeggiator.gate - ARP_GATE_MIN) / (ARP_GATE_MAX - ARP_GATE_MIN);
  const swingValue = () => (arpeggiator.swing - ARP_SWING_MIN) / (ARP_SWING_MAX - ARP_SWING_MIN);
  const stepLengthValue = () => {
    const index = ARP_STEP_LENGTHS.indexOf(arpeggiator.stepLength);
    return index >= 0 ? index / (ARP_STEP_LENGTHS.length - 1) : 0;
  };  const velocityModeValue = () => {
    const index = ARP_VELOCITY_MODES.indexOf(arpeggiator.velocityMode);
    return index >= 0 ? index / (ARP_VELOCITY_MODES.length - 1) : 0;
  };
    return (
    <group position={position}>
      {/* Panel background */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color="#220033"
          roughness={0.6}
          metalness={0.3}
          emissive="#220033"
          emissiveIntensity={arpeggiator.enabled ? 0.2 : 0.05}
        />
      </mesh>
  

      {/* Title */}
      <Text
        position={[0, height/2 - 0.25, knobZ]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        ARPEGGIATOR
      </Text>
      
      {/* Row 1: On/Off, Rate, Pattern */}      <group position={getPosition(-1, 0.7)}>        <ToggleSwitch
          value={arpeggiator.enabled}
          onChange={(enabled) => {
            // When changing the arpeggiator state, we need special handling
            console.log(`Setting arpeggiator enabled: ${enabled}`);
            
            // Setup everything in the correct order
            if (!enabled && arpeggiator.enabled) {
              if (synth) {
                // 2. Update state first - this is important so the engine knows it should be disabled
                setSynthParams(prev => ({
                  ...prev,
                  arpeggiator: { ...prev.arpeggiator, enabled: false }
                }));
                
                // 3. Use our emergency function to kill all notes
                console.log("EMERGENCY: Killing all arpeggiator notes");
                if (typeof synth.voiceManager?.emergencyReleaseAll === 'function') {
                  synth.voiceManager.emergencyReleaseAll();
                }
                
                // 4. Trigger a forced silence using brute force
                if (synth.masterGain) {
                  try {
                    // Temporarily disconnect the main output for instant silence
                    const destination = synth.masterGain.destination;
                    synth.masterGain.disconnect();
                    
                    // Give time for any notes to be cleaned up
                    setTimeout(() => {
                      if (synth.masterGain && destination) {
                        synth.masterGain.connect(destination);
                      }
                    }, 100);
                  } catch (e) {
                    console.error("Error in emergency silence: ", e);
                  }
                }
              } else {
                // Still update state if no synth instance
                setSynthParams(prev => ({
                  ...prev,
                  arpeggiator: { ...prev.arpeggiator, enabled: false }
                }));
              }
            } else {
              // Just normal enabling, update state directly
              setSynthParams(prev => ({
                ...prev,
                arpeggiator: { ...prev.arpeggiator, enabled }
              }));
            }
          }}
          size={0.2}
          onColor="#e91e63"
          offColor="#666666"
        />
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          ON/OFF
        </Text>
      </group>

      {/* Rate Knob */}
      <group position={getPosition(0, 0.7)}>
        <Knob
          size={0.25}
          value={rateValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const rate = Math.round(value * (ARP_RATE_MAX - ARP_RATE_MIN) + ARP_RATE_MIN);
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, rate }
            }));
          }}
          label="RATE"
          color="#e91e63"
          valueFormatter={(val) => {
            const rate = Math.round(val * (ARP_RATE_MAX - ARP_RATE_MIN) + ARP_RATE_MIN);
            return `${rate} BPM`;
          }}
        />
      </group>

      {/* Pattern Knob */}
      <group position={getPosition(1, 0.7)}>
        <Knob
          size={0.25}
          value={patternValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const index = Math.round(value * (ARP_PATTERNS.length - 1));
            const pattern = ARP_PATTERNS[index];
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, pattern }
            }));
          }}
          label="PATTERN"
          color="#e91e63"
          valueFormatter={(val) => {
            const index = Math.round(val * (ARP_PATTERNS.length - 1));
            return ARP_PATTERNS[index].toUpperCase();
          }}
        />
      </group>

      {/* Row 2: Octaves, Gate, Swing */}
      {/* Octaves Knob */}
      <group position={getPosition(-1, 1.7)}>
        <Knob
          size={0.25}
          value={octavesValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const octaves = Math.round(value * (ARP_OCTAVES_MAX - ARP_OCTAVES_MIN) + ARP_OCTAVES_MIN);
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, octaves }
            }));
          }}
          label="OCTAVES"
          color="#e91e63"
          valueFormatter={(val) => {
            const octaves = Math.round(val * (ARP_OCTAVES_MAX - ARP_OCTAVES_MIN) + ARP_OCTAVES_MIN);
            return octaves.toString();
          }}
        />
      </group>

      {/* Gate Knob */}
      <group position={getPosition(0, 1.7)}>
        <Knob
          size={0.25}
          value={gateValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const gate = parseFloat((value * (ARP_GATE_MAX - ARP_GATE_MIN) + ARP_GATE_MIN).toFixed(1));
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, gate }
            }));
          }}
          label="GATE"
          color="#e91e63"
          valueFormatter={(val) => {
            const gate = val * (ARP_GATE_MAX - ARP_GATE_MIN) + ARP_GATE_MIN;
            return `${Math.round(gate * 100)}%`;
          }}
        />
      </group>

      {/* Swing Knob */}
      <group position={getPosition(1, 1.7)}>
        <Knob
          size={0.25}
          value={swingValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const swing = parseFloat((value * (ARP_SWING_MAX - ARP_SWING_MIN) + ARP_SWING_MIN).toFixed(2));
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, swing }
            }));
          }}
          label="SWING"
          color="#e91e63"
          valueFormatter={(val) => {
            const swing = val * (ARP_SWING_MAX - ARP_SWING_MIN) + ARP_SWING_MIN;
            if (Math.abs(swing) < 0.05) return "0%";
            return `${(swing * 100).toFixed(0)}%`;
          }}
        />
      </group>

      {/* Row 3: Step Length, Velocity Mode, Hold Mode */}
      {/* Step Length Knob */}
      <group position={getPosition(-1, 2.7)}>
        <Knob
          size={0.25}
          value={stepLengthValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const index = Math.round(value * (ARP_STEP_LENGTHS.length - 1));
            const stepLength = ARP_STEP_LENGTHS[index];
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, stepLength }
            }));
          }}
          label="STEP"
          color="#e91e63"
          valueFormatter={(val) => {
            const index = Math.round(val * (ARP_STEP_LENGTHS.length - 1));
            const stepLength = ARP_STEP_LENGTHS[index];
            return `1/${stepLength}`;
          }}
        />
      </group>

      {/* Velocity Mode Knob */}
      <group position={getPosition(0, 2.7)}>
        <Knob
          size={0.25}
          value={velocityModeValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const index = Math.round(value * (ARP_VELOCITY_MODES.length - 1));
            const velocityMode = ARP_VELOCITY_MODES[index];
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, velocityMode }
            }));
          }}
          label="VELOCITY"
          color="#e91e63"
          valueFormatter={(val) => {
            const index = Math.round(val * (ARP_VELOCITY_MODES.length - 1));
            const velMode = ARP_VELOCITY_MODES[index];
            return velMode.substring(0, 4).toUpperCase();
          }}
        />
      </group>

      {/* Hold Mode Toggle */}
      <group position={getPosition(1, 2.7)}>
        <ToggleSwitch
          value={arpeggiator.holdMode}
          onChange={(holdMode) => {
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, holdMode }
            }));
          }}
          size={0.2}
          onColor="#e91e63"
          offColor="#666666"
        />
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          HOLD        </Text>
      </group>
    </group>
  );
};

export default ArpeggiatorPanel;
