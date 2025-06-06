import React from 'react';
import { Text } from '@react-three/drei';
import Knob from './Knob';
import ToggleSwitch from './ToggleSwitch';
import { useSynthContext } from '../hooks/useSynth';
import {
  ARP_RATE_MIN, ARP_RATE_MAX,
  ARP_PATTERNS,
  ARP_OCTAVES_MIN, ARP_OCTAVES_MAX,
  ARP_GATE_MIN, ARP_GATE_MAX,
  ARP_SWING_MIN, ARP_SWING_MAX,
  ARP_STEP_LENGTHS,
  ARP_VELOCITY_MODES
} from '../constants/synth';

const ArpeggiatorPanel = () => {
  // Internal component dimensions and positioning like other panels
  const position = [2, -1.8, 0.3];
  const width = 3;
  const height = 2;
  const depth = 0.2;
  const { synthParams, setSynthParams, synth } = useSynthContext();
  if (!synthParams?.arpeggiator) return null;

  const arpeggiator = synthParams.arpeggiator;
  const knobZ = depth + 0.01;
  const knobSize = 0.5;
  const rowHeight = height / 3.6;
  const colWidth = width / 4;

  const getPosition = (col, row) => [(col - 1) * colWidth, (1 - row) * rowHeight, knobZ];

  const positions = {
    onOff: getPosition(0, 0),     
    rate: getPosition(1, 0),       
    pattern: getPosition(2, 0),   
    octaves: getPosition(0, 1),    
    gate: getPosition(1, 1),       
    swing: getPosition(2, 1),      
    step: getPosition(0, 2),       
    velocity: getPosition(1, 2),   
    hold: getPosition(2, 2),      
  };

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
  };
  const velocityModeValue = () => {
    const index = ARP_VELOCITY_MODES.indexOf(arpeggiator.velocityMode);
    return index >= 0 ? index / (ARP_VELOCITY_MODES.length - 1) : 0;
  };  return (
    <group position={position} scale={[1.5, 1.5, 1.5]}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#220033"
          roughness={0.15}
          metalness={0.8}
          emissive="#220033"
          emissiveIntensity={arpeggiator.enabled ? 0.3 : 0.08}
          envMapIntensity={1.5}
        />
      </mesh>

      <Text position={[0, height / 1.75 - 0.25, knobZ]} fontSize={0.09} color="#ffffff" anchorX="center" anchorY="middle">
        ARPEGGIATOR
      </Text>      <group position={positions.onOff}>
        <ToggleSwitch
          value={arpeggiator.enabled}
          onChange={(enabled) => {
            if (!enabled && arpeggiator.enabled) {
              if (synth) {
                setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, enabled: false } }));
                if (typeof synth.voiceManager?.emergencyReleaseAll === 'function') {
                  synth.voiceManager.emergencyReleaseAll();
                }
                if (synth.masterGain) {
                  try {
                    const destination = synth.masterGain.destination;
                    synth.masterGain.disconnect();
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
                setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, enabled: false } }));
              }
            } else {
              setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, enabled } }));
            }
          }}
          size={0.2}
          onColor="#e91e63"
          offColor="#666666"        />
        <Text position={[0, -0.18, 0]} fontSize={0.08} color="white" anchorX="center" anchorY="middle">
          ON/OFF
        </Text>
      </group>

      <group position={positions.rate}>
        <Knob
          size={knobSize}
          value={rateValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const rate = Math.round(value * (ARP_RATE_MAX - ARP_RATE_MIN) + ARP_RATE_MIN);
            setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, rate } }));
          }}
          label="RATE"
          color="#e91e63"
          valueFormatter={(val) => `${Math.round(val * (ARP_RATE_MAX - ARP_RATE_MIN) + ARP_RATE_MIN)} BPM`}
        />
      </group>

      <group position={positions.pattern}>
        <Knob
          size={knobSize}
          value={patternValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const index = Math.round(value * (ARP_PATTERNS.length - 1));
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, pattern: ARP_PATTERNS[index] }
            }));
          }}
          label="PATTERN"
          color="#e91e63"
          valueFormatter={(val) => ARP_PATTERNS[Math.round(val * (ARP_PATTERNS.length - 1))].toUpperCase()}
        />
      </group>

      <group position={positions.octaves}>
        <Knob
          size={knobSize}
          value={octavesValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const octaves = Math.round(value * (ARP_OCTAVES_MAX - ARP_OCTAVES_MIN) + ARP_OCTAVES_MIN);
            setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, octaves } }));
          }}
          label="OCTAVES"
          color="#e91e63"
          valueFormatter={(val) => Math.round(val * (ARP_OCTAVES_MAX - ARP_OCTAVES_MIN) + ARP_OCTAVES_MIN).toString()}
        />
      </group>

      <group position={positions.gate}>
        <Knob
          size={knobSize}
          value={gateValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const gate = parseFloat((value * (ARP_GATE_MAX - ARP_GATE_MIN) + ARP_GATE_MIN).toFixed(1));
            setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, gate } }));
          }}
          label="GATE"
          color="#e91e63"
          valueFormatter={(val) => `${Math.round((val * (ARP_GATE_MAX - ARP_GATE_MIN) + ARP_GATE_MIN) * 100)}%`}
        />
      </group>

      <group position={positions.swing}>
        <Knob
          size={knobSize}
          value={swingValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const swing = parseFloat((value * (ARP_SWING_MAX - ARP_SWING_MIN) + ARP_SWING_MIN).toFixed(2));
            setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, swing } }));
          }}
          label="SWING"
          color="#e91e63"
          valueFormatter={(val) => {
            const swing = val * (ARP_SWING_MAX - ARP_SWING_MIN) + ARP_SWING_MIN;
            return Math.abs(swing) < 0.05 ? "0%" : `${(swing * 100).toFixed(0)}%`;
          }}
        />
      </group>

      <group position={positions.step}>
        <Knob
          size={knobSize}
          value={stepLengthValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const index = Math.round(value * (ARP_STEP_LENGTHS.length - 1));
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, stepLength: ARP_STEP_LENGTHS[index] }
            }));
          }}
          label="STEP"
          color="#e91e63"
          valueFormatter={(val) => `1/${ARP_STEP_LENGTHS[Math.round(val * (ARP_STEP_LENGTHS.length - 1))]}`}
        />
      </group>

      <group position={positions.velocity}>
        <Knob
          size={knobSize}
          value={velocityModeValue()}
          min={0}
          max={1}
          onChange={(value) => {
            const index = Math.round(value * (ARP_VELOCITY_MODES.length - 1));
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, velocityMode: ARP_VELOCITY_MODES[index] }
            }));
          }}
          label="VELOCITY"
          color="#e91e63"
          valueFormatter={(val) => ARP_VELOCITY_MODES[Math.round(val * (ARP_VELOCITY_MODES.length - 1))].substring(0, 4).toUpperCase()}
        />
      </group>      <group position={positions.hold}>
        <ToggleSwitch
          value={arpeggiator.holdMode}
          onChange={(holdMode) => {
            setSynthParams(prev => ({ ...prev, arpeggiator: { ...prev.arpeggiator, holdMode } }));
          }}
          size={0.2}
          onColor="#e91e63"
          offColor="#666666"        />
        <Text position={[0, -0.18, 0]} fontSize={0.08} color="white" anchorX="center" anchorY="middle">
          HOLD
        </Text>
      </group>
    </group>
  );
};

export default ArpeggiatorPanel;
