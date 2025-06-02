import React from 'react';
import Knob from './Knob';
import { Text } from '@react-three/drei';
import { useSynthContext } from '../hooks/useSynth';
import {
  OSC_TYPES,
  SUB_OSC_TYPES,
  DETUNE_MIN,
  DETUNE_MAX,
  DEFAULT_DETUNE,
  PULSE_WIDTH_MIN,
  PULSE_WIDTH_MAX,
  DEFAULT_PULSE_WIDTH,
  DEFAULT_SUB_ENABLED,
  SUB_MIX_MIN,
  SUB_MIX_MAX,
  DEFAULT_SUB_MIX,
  DEFAULT_SUB_WAVEFORM
} from '../constants/synth';
import { createPositioning, COMMON_SPACING } from '../constants/spacing';

const WaveformSelector = ({ value, onChange, types, position, size = COMMON_SPACING.MEDIUM_KNOB_SIZE, label }) => {
  const currentIndex = types.indexOf(value);
  const normalizedValue = currentIndex >= 0 ? currentIndex / (types.length - 1) : 0;

  return (
    <group position={position}>
      <Knob
        size={size}
        value={normalizedValue}
        min={0}
        max={1}
        onChange={(val) => {
          const index = Math.round(val * (types.length - 1));
          onChange(types[index]);
        }}
        label={label}
        color="#61dafb"
        valueFormatter={() =>
          value.charAt(0).toUpperCase() + value.slice(1, 3)
        }
      />
    </group>
  );
};

const ToggleSwitch = ({ value, onChange, position, label, size = COMMON_SPACING.MEDIUM_KNOB_SIZE }) => {
  return (
    <group position={position}>
      <mesh
        position={[0, 0, 0.05]}
        onClick={() => onChange(!value)}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[size, size * 0.6, 0.1]} />
        <meshStandardMaterial
          color={value ? "#4CAF50" : "#666666"}
          emissive={value ? "#2E7D32" : "#333333"}
          emissiveIntensity={0.3}
        />
      </mesh>
      <Text
        position={[0, -size * 0.8, 0.06]}
        fontSize={0.06}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.05}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value ? "ON" : "OFF"}
      </Text>
    </group>
  );
};

const OscillatorPanel = ({
  position = [-3.75, 0, 0.1],
  width = 1.2,
  height = 1.4,
  depth = 0.2,
  color = "#333333",
  knobColor = "#61dafb"
}) => {
  const { synthParams, setSynthParams, synth } = useSynthContext();

  // Create standardized positioning
  const { topY, bottomY, leftX, rightX, centerX, knobZ } = createPositioning(width, height, depth);

  const updateOscillator = (updates) => {
    setSynthParams(prev => ({
      ...prev,
      oscillator1: { ...prev.oscillator1, ...updates }
    }));

    if (synth) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'type') synth.setParam('oscillator1Type', value);
        else if (key === 'detune') synth.setParam('oscillator1Detune', value);
        else if (key === 'pulseWidth') synth.setParam('oscillator1PulseWidth', value);
      });
    }
  };

  const updateSubOscillator = (updates) => {
    setSynthParams(prev => ({
      ...prev,
      subOscillator: { ...prev.subOscillator, ...updates }
    }));

    if (synth) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'enabled') synth.setParam('subOscEnabled', value);
        else if (key === 'mix') synth.setParam('subOscMix', value);
        else if (key === 'type') synth.setParam('subOscType', value);
      });
    }
  };

  const osc = synthParams.oscillator1 || {
    type: 'sawtooth',
    detune: DEFAULT_DETUNE,
    pulseWidth: DEFAULT_PULSE_WIDTH
  };

  const subOsc = synthParams.subOscillator || {
    enabled: DEFAULT_SUB_ENABLED,
    mix: DEFAULT_SUB_MIX,
    type: DEFAULT_SUB_WAVEFORM
  };

  return (
    <group position={position}>
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
        OSCILLATOR
      </Text>

      <group position={[leftX, topY, knobZ]}>
        <Knob
          size={0.4}
          value={OSC_TYPES.indexOf(osc.type) / (OSC_TYPES.length - 1)}
          min={0}
          max={1}
          onChange={(val) => {
            const index = Math.round(val * (OSC_TYPES.length - 1));
            updateOscillator({ type: OSC_TYPES[index] });
          }}
          label="WAVE"
          color={knobColor}
          valueFormatter={() =>
            osc.type.charAt(0).toUpperCase() + osc.type.slice(1, 3)
          }
        />
      </group>

      <group position={[centerX, topY, knobZ]}>
        <Knob
          size={0.4}
          value={(osc.detune - DETUNE_MIN) / (DETUNE_MAX - DETUNE_MIN)}
          min={0}
          max={1}
          onChange={(val) => {
            const detune = DETUNE_MIN + val * (DETUNE_MAX - DETUNE_MIN);
            updateOscillator({ detune });
          }}
          label="DETUNE"
          color="#FF9800"
          valueFormatter={(val) => {
            const detune = DETUNE_MIN + val * (DETUNE_MAX - DETUNE_MIN);
            return `${detune.toFixed(0)}¢`;
          }}
        />
      </group>

      <group position={[rightX, topY, knobZ]}>
        <Knob
          size={0.4}
          value={(osc.pulseWidth - PULSE_WIDTH_MIN) / (PULSE_WIDTH_MAX - PULSE_WIDTH_MIN)}
          min={0}
          max={1}
          onChange={(val) => {
            const pulseWidth = PULSE_WIDTH_MIN + val * (PULSE_WIDTH_MAX - PULSE_WIDTH_MIN);
            updateOscillator({ pulseWidth });
          }}
          label="PULSE"
          color="#9C27B0"
          valueFormatter={(val) => {
            const pw = PULSE_WIDTH_MIN + val * (PULSE_WIDTH_MAX - PULSE_WIDTH_MIN);
            return `${(pw * 100).toFixed(0)}%`;
          }}
        />
      </group>

      <ToggleSwitch
        value={subOsc.enabled}
        onChange={(enabled) => updateSubOscillator({ enabled })}
        position={[leftX, bottomY, knobZ]}
        label="SUB OSC"
        size={0.35}
      />

      <group position={[centerX, bottomY, knobZ]}>
        <Knob
          size={0.4}
          value={subOsc.mix}
          min={SUB_MIX_MIN}
          max={SUB_MIX_MAX}
          onChange={(mix) => updateSubOscillator({ mix })}
          label="SUB MIX"
          color="#4CAF50"
          valueFormatter={(val) => `${(val * 100).toFixed(0)}%`}
        />
      </group>

      <group position={[rightX, bottomY, knobZ]}>
        <Knob
          size={0.4}
          value={SUB_OSC_TYPES.indexOf(subOsc.type) / (SUB_OSC_TYPES.length - 1)}
          min={0}
          max={1}
          onChange={(val) => {
            const index = Math.round(val * (SUB_OSC_TYPES.length - 1));
            updateSubOscillator({ type: SUB_OSC_TYPES[index] });
          }}
          label="SUB WAVE"
          color={knobColor}
          valueFormatter={() =>
            subOsc.type.charAt(0).toUpperCase() + subOsc.type.slice(1, 3)
          }
        />
      </group>
    </group>
  );
};

export default OscillatorPanel;
