import React from 'react';
import Knob from './Knob';
import ToggleSwitch from './ToggleSwitch';
import { Text } from '@react-three/drei';
import { createPositioning, COMMON_SPACING } from '../constants/spacing';

const EffectsPanel = ({
  effects = {},
  onEffectChange = () => {},
  position = [0, 0, 0],
  width = 6,
  height = 4,
  depth = 0.2,
  color = '#2c2c2c',
  knobColor = '#ff6b35'
}) => {
  const { topY, centerY, bottomY, leftX, rightX, centerX, knobZ, textZ } = createPositioning(width, height, depth);
  
  // Create a 3x2 grid layout for effects
  const effectPositions = {
    distortion: [leftX * 1.5, topY * 0.8, knobZ],
    eq: [centerX, topY * 0.8, knobZ],
    compressor: [rightX * 1.5, topY * 0.8, knobZ],
    chorus: [leftX * 1.5, bottomY * 0.8, knobZ],
    delay: [centerX, bottomY * 0.8, knobZ],
    reverb: [rightX * 1.5, bottomY * 0.8, knobZ]
  };

  const handleEffectParamChange = (effectName, paramName, value) => {
    onEffectChange({
      ...effects,
      [effectName]: {
        ...effects[effectName],
        [paramName]: value
      }
    });
  };

  const DistortionSection = ({ position }) => (
    <group position={position}>
      {/* Effect title */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        DISTORTION
      </Text>
      
      {/* Enable toggle */}
      <group position={[0, 0.25, 0]}>
        <ToggleSwitch
          value={effects.distortion?.enabled || false}
          onChange={(value) => handleEffectParamChange('distortion', 'enabled', value)}
          size={0.04}
          onColor="#ff6b35"
          offColor="#666666"
        />
      </group>
      
      {/* Parameter knobs arranged in a small grid */}
      <group position={[-0.15, 0, 0]}>
        <Knob
          size={0.12}
          value={(effects.distortion?.drive || 0) / 20}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('distortion', 'drive', value * 20)}
          label="DRIVE"
          color={knobColor}
          valueFormatter={(val) => (val * 20).toFixed(1)}
        />
      </group>
      
      <group position={[0.15, 0, 0]}>
        <Knob
          size={0.12}
          value={(effects.distortion?.tone || 0.5)}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('distortion', 'tone', value)}
          label="TONE"
          color={knobColor}
          valueFormatter={(val) => val.toFixed(2)}
        />
      </group>
      
      <group position={[0, -0.2, 0]}>
        <Knob
          size={0.12}
          value={effects.distortion?.mix || 0.5}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('distortion', 'mix', value)}
          label="MIX"
          color={knobColor}
          valueFormatter={(val) => `${(val * 100).toFixed(0)}%`}
        />
      </group>
    </group>
  );

  const EQSection = ({ position }) => (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        EQ
      </Text>
      
      <group position={[0, 0.25, 0]}>
        <ToggleSwitch
          value={effects.eq?.enabled || false}
          onChange={(value) => handleEffectParamChange('eq', 'enabled', value)}
          size={0.04}
          onColor="#ff6b35"
          offColor="#666666"
        />
      </group>
      
      <group position={[-0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.eq?.lowGain || 0 + 12) / 24}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('eq', 'lowGain', (value * 24) - 12)}
          label="LOW"
          color={knobColor}
          valueFormatter={(val) => `${((val * 24) - 12).toFixed(1)}dB`}
        />
      </group>
      
      <group position={[0, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.eq?.midGain || 0 + 12) / 24}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('eq', 'midGain', (value * 24) - 12)}
          label="MID"
          color={knobColor}
          valueFormatter={(val) => `${((val * 24) - 12).toFixed(1)}dB`}
        />
      </group>
      
      <group position={[0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.eq?.highGain || 0 + 12) / 24}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('eq', 'highGain', (value * 24) - 12)}
          label="HIGH"
          color={knobColor}
          valueFormatter={(val) => `${((val * 24) - 12).toFixed(1)}dB`}
        />
      </group>
    </group>
  );

  const CompressorSection = ({ position }) => (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        COMPRESSOR
      </Text>
      
      <group position={[0, 0.25, 0]}>
        <ToggleSwitch
          value={effects.compressor?.enabled || false}
          onChange={(value) => handleEffectParamChange('compressor', 'enabled', value)}
          size={0.04}
          onColor="#ff6b35"
          offColor="#666666"
        />
      </group>
      
      <group position={[-0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.compressor?.threshold || -12 + 60) / 60}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('compressor', 'threshold', (value * 60) - 60)}
          label="THRESH"
          color={knobColor}
          valueFormatter={(val) => `${((val * 60) - 60).toFixed(0)}dB`}
        />
      </group>
      
      <group position={[0, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.compressor?.ratio || 4 - 1) / 19}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('compressor', 'ratio', (value * 19) + 1)}
          label="RATIO"
          color={knobColor}
          valueFormatter={(val) => `${((val * 19) + 1).toFixed(1)}:1`}
        />
      </group>
      
      <group position={[0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.compressor?.makeupGain || 0 + 20) / 20}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('compressor', 'makeupGain', (value * 20) - 20)}
          label="GAIN"
          color={knobColor}
          valueFormatter={(val) => `${((val * 20) - 20).toFixed(1)}dB`}
        />
      </group>
    </group>
  );

  const ChorusSection = ({ position }) => (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        CHORUS
      </Text>
      
      <group position={[0, 0.25, 0]}>
        <ToggleSwitch
          value={effects.chorus?.enabled || false}
          onChange={(value) => handleEffectParamChange('chorus', 'enabled', value)}
          size={0.04}
          onColor="#ff6b35"
          offColor="#666666"
        />
      </group>
      
      <group position={[-0.15, 0, 0]}>
        <Knob
          size={0.12}
          value={(effects.chorus?.rate || 0.5) / 10}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('chorus', 'rate', value * 10)}
          label="RATE"
          color={knobColor}
          valueFormatter={(val) => `${(val * 10).toFixed(1)}Hz`}
        />
      </group>
      
      <group position={[0.15, 0, 0]}>
        <Knob
          size={0.12}
          value={effects.chorus?.depth || 0.002}
          min={0}
          max={0.01}
          onChange={(value) => handleEffectParamChange('chorus', 'depth', value)}
          label="DEPTH"
          color={knobColor}
          valueFormatter={(val) => (val * 1000).toFixed(1)}
        />
      </group>
      
      <group position={[0, -0.2, 0]}>
        <Knob
          size={0.12}
          value={effects.chorus?.mix || 0.3}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('chorus', 'mix', value)}
          label="MIX"
          color={knobColor}
          valueFormatter={(val) => `${(val * 100).toFixed(0)}%`}
        />
      </group>
    </group>
  );

  const DelaySection = ({ position }) => (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        DELAY
      </Text>
      
      <group position={[0, 0.25, 0]}>
        <ToggleSwitch
          value={effects.delay?.enabled || false}
          onChange={(value) => handleEffectParamChange('delay', 'enabled', value)}
          size={0.04}
          onColor="#ff6b35"
          offColor="#666666"
        />
      </group>
      
      <group position={[-0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.delay?.time || 0.25)}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('delay', 'time', value)}
          label="TIME"
          color={knobColor}
          valueFormatter={(val) => `${(val * 1000).toFixed(0)}ms`}
        />
      </group>
      
      <group position={[0, 0.05, 0]}>
        <Knob
          size={0.1}
          value={effects.delay?.feedback || 0.3}
          min={0}
          max={0.95}
          onChange={(value) => handleEffectParamChange('delay', 'feedback', value)}
          label="FDBK"
          color={knobColor}
          valueFormatter={(val) => `${(val * 100).toFixed(0)}%`}
        />
      </group>
      
      <group position={[0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={effects.delay?.mix || 0.2}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('delay', 'mix', value)}
          label="MIX"
          color={knobColor}
          valueFormatter={(val) => `${(val * 100).toFixed(0)}%`}
        />
      </group>
    </group>
  );

  const ReverbSection = ({ position }) => (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        REVERB
      </Text>
      
      <group position={[0, 0.25, 0]}>
        <ToggleSwitch
          value={effects.reverb?.enabled || false}
          onChange={(value) => handleEffectParamChange('reverb', 'enabled', value)}
          size={0.04}
          onColor="#ff6b35"
          offColor="#666666"
        />
      </group>
      
      <group position={[-0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={effects.reverb?.size || 0.5}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('reverb', 'size', value)}
          label="SIZE"
          color={knobColor}
          valueFormatter={(val) => val.toFixed(2)}
        />
      </group>
      
      <group position={[0, 0.05, 0]}>
        <Knob
          size={0.1}
          value={(effects.reverb?.decay || 2) / 10}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('reverb', 'decay', value * 10)}
          label="DECAY"
          color={knobColor}
          valueFormatter={(val) => `${(val * 10).toFixed(1)}s`}
        />
      </group>
      
      <group position={[0.15, 0.05, 0]}>
        <Knob
          size={0.1}
          value={effects.reverb?.mix || 0.2}
          min={0}
          max={1}
          onChange={(value) => handleEffectParamChange('reverb', 'mix', value)}
          label="MIX"
          color={knobColor}
          valueFormatter={(val) => `${(val * 100).toFixed(0)}%`}
        />
      </group>
    </group>
  );

  return (
    <group position={position}>
      {/* Main panel background */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Panel title */}
      <Text
        position={[0, height / 2 - 0.2, textZ]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        EFFECTS
      </Text>

      {/* Effect sections */}
      <DistortionSection position={effectPositions.distortion} />
      <EQSection position={effectPositions.eq} />
      <CompressorSection position={effectPositions.compressor} />
      <ChorusSection position={effectPositions.chorus} />
      <DelaySection position={effectPositions.delay} />
      <ReverbSection position={effectPositions.reverb} />
    </group>
  );
};

export default EffectsPanel;
