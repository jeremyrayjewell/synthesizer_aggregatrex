import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Panel from './Panel';
import Slider from './Slider';
import { useSynthContext } from '../hooks/useSynth';
import { createPositioning, COMMON_SPACING } from '../constants/spacing';

const ADSREnvelopePanel = () => {
  // Internal component dimensions and styling
  const width = 2;
  const height = 3.5;
  const depth = 0.2;
  const color = '#333333';
  const sliderColor = '#8bc34a';
  const position = [4.7, -1.1, 0.1];
  const { synthParams, setSynthParams, synth } = useSynthContext();
  const { attack, decay, sustain, release } = synthParams.envelope;
  const formatTimeMs = (seconds) => {
    const ms = seconds * 1000;
    if (ms < 10) return `${ms.toFixed(1)}ms`;
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  const formatSustain = (value) => `${Math.round(value * 100)}%`;  // Create standardized positioning
  const { leftFifthX, bottomY, sliderZ, textZ } = createPositioning(width, height, depth);
  
  const sliderThickness = COMMON_SPACING.SLIDER_THICKNESS;
  const sliderLength = COMMON_SPACING.SLIDER_LENGTH;
  const sliderSpacing = COMMON_SPACING.SLIDER_SPACING;
  const baseSliderY = bottomY + COMMON_SPACING.ADSR_SLIDER_Y_ADJUSTMENT;

  // Center the 4 sliders across the panel width
  const sliderWidth = width * 0.8; // Use 80% of panel width for sliders
  const sliderStartX = -sliderWidth / 2;
  const sliderStepX = sliderWidth / 3; // 3 gaps between 4 sliders

  const envelopeTextureRef = React.useRef();

  React.useEffect(() => {
    drawADSRCurve();
  }, [attack, decay, sustain, release]);

  const drawADSRCurve = () => {
    const canvasSize = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i++) {
      const x = i * (canvasSize / 10);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize);
      ctx.stroke();
    }

    for (let i = 0; i <= 10; i++) {
      const y = i * (canvasSize / 10);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize, y);
      ctx.stroke();
    }

    const normalizedAttack = Math.min(attack * 1.5, 0.4) * canvasSize * 2;
    const normalizedDecay = Math.min(decay * 1.5, 0.4) * canvasSize * 2;
    const normalizedSustain = (1 - sustain) * canvasSize;
    const normalizedRelease = Math.min(release * 1.5, 0.4) * canvasSize * 2;

    const startX = canvasSize * 0.1;
    const startY = canvasSize * 0.9;
    const attackX = startX + normalizedAttack;
    const attackY = canvasSize * 0.1;
    const decayX = attackX + normalizedDecay;
    const sustainY = attackY + normalizedSustain;
    const releaseX = Math.min(decayX + canvasSize * 0.1, canvasSize * 0.8);
    const releaseEndX = Math.min(releaseX + normalizedRelease, canvasSize * 0.95);
    const releaseEndY = startY;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(attackX, attackY);
    ctx.lineTo(decayX, sustainY);
    ctx.lineTo(releaseX, sustainY);
    ctx.lineTo(releaseEndX, releaseEndY);
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 3;
    ctx.stroke();

    if (!envelopeTextureRef.current) {
      envelopeTextureRef.current = new THREE.CanvasTexture(canvas);
    } else {
      envelopeTextureRef.current.needsUpdate = true;
      envelopeTextureRef.current.image = canvas;
    }

    return envelopeTextureRef.current;
  };

  const handleAttackChange = (value) => {
    const attackTime = Math.pow(3000, value) * 0.001;
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        attack: attackTime
      }
    });
    if (synth) {
      synth.setEnvelope(
        attackTime,
        synthParams.envelope.decay,
        synthParams.envelope.sustain,
        synthParams.envelope.release
      );
    }
  };

  const handleDecayChange = (value) => {
    const decayTime = Math.pow(3000, value) * 0.001;
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        decay: decayTime
      }
    });
    if (synth) {
      synth.setEnvelope(
        synthParams.envelope.attack,
        decayTime,
        synthParams.envelope.sustain,
        synthParams.envelope.release
      );
    }
  };

  const handleSustainChange = (value) => {
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        sustain: value
      }
    });
    if (synth) {
      synth.setEnvelope(
        synthParams.envelope.attack,
        synthParams.envelope.decay,
        value,
        synthParams.envelope.release
      );
    }
  };

  const handleReleaseChange = (value) => {
    const releaseTime = Math.pow(5000, value) * 0.001;
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        release: releaseTime
      }
    });
    if (synth) {
      synth.setEnvelope(
        synthParams.envelope.attack,
        synthParams.envelope.decay,
        synthParams.envelope.sustain,
        releaseTime
      );
    }
  };

  const timeToSliderPosition = (time, maxTime) => {
    return Math.log(time * 1000) / Math.log(maxTime);
  };

  const attackPosition = timeToSliderPosition(attack, 3000);
  const decayPosition = timeToSliderPosition(decay, 3000);
  const sustainPosition = sustain;
  const releasePosition = timeToSliderPosition(release, 5000);  return (
    <group position={position} scale={[1.5, 1.5, 1.5]}>      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.15} 
          metalness={0.8}
          envMapIntensity={1.8}
        />
      </mesh>

      <Text
        position={[0, height / 2 - COMMON_SPACING.TITLE_OFFSET, textZ]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ENVELOPE
      </Text>      {/* Wider and centered visualizer */}
      <mesh position={[0, height / 2 - 1, depth / 2 + 0.01]}>
        <planeGeometry args={[width * 0.9, 1]} />
        <meshBasicMaterial
          map={envelopeTextureRef.current || drawADSRCurve()}
          transparent
          opacity={0.9}
        />      </mesh>
      <group position={[sliderStartX, baseSliderY, sliderZ]}>
          <Slider
            orientation="vertical"
            length={sliderLength}
            thickness={sliderThickness}
            value={attackPosition}
            min={0}
            max={1}
            onChange={handleAttackChange}
            label="ATTACK"
            color={sliderColor}
            valueFormatter={(val) => formatTimeMs(Math.pow(3000, val) * 0.001)}
            labelOffset={0}
            valueOffset={0}
          />
        </group>        <group position={[sliderStartX + sliderStepX, baseSliderY, sliderZ]}>
          <Slider
            orientation="vertical"
            length={sliderLength}
            thickness={sliderThickness}
            value={decayPosition}
            min={0}
            max={1}
            onChange={handleDecayChange}
            label="DECAY"
            color={sliderColor}
            valueFormatter={(val) => formatTimeMs(Math.pow(3000, val) * 0.001)}
            labelOffset={0}
            valueOffset={0}
          />
        </group>        <group position={[sliderStartX + sliderStepX * 2, baseSliderY, sliderZ]}>
          <Slider
            orientation="vertical"
            length={sliderLength}
            thickness={sliderThickness}
            value={sustainPosition}
            min={0}
            max={1}
            onChange={handleSustainChange}
            label="SUSTAIN"
            color={sliderColor}
            valueFormatter={formatSustain}
            labelOffset={0}
            valueOffset={0}
          />
        </group>        <group position={[sliderStartX + sliderStepX * 3, baseSliderY, sliderZ]}>
          <Slider
            orientation="vertical"
            length={sliderLength}
            thickness={sliderThickness}
            value={releasePosition}
            min={0}
            max={1}
            onChange={handleReleaseChange}
            label="RELEASE"
            color={sliderColor}
            valueFormatter={(val) => formatTimeMs(Math.pow(5000, val) * 0.001)}
            labelOffset={0}
            valueOffset={0}
          />
        </group>
    </group>
  );
};

export default ADSREnvelopePanel;
