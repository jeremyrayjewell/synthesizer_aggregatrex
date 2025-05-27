import React, { useContext } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Panel from './Panel';
import Slider from './Slider';
import { SynthContext } from '../context/SynthContext';

const ADSREnvelopePanel = ({ 
  // Panel styling
  width = 4,
  height = 3.5,
  depth = 0.2,
  color = '#333333',
  sliderColor = '#8bc34a',
  
  // Position
  position = [0, 0, 0]
}) => {
  // Access the synth context for envelope parameters
  const { synthParams, setSynthParams } = useContext(SynthContext);
  const { attack, decay, sustain, release } = synthParams.envelope;
  
  // Format time values to ms for display
  const formatTimeMs = (seconds) => {
    const ms = seconds * 1000;
    if (ms < 10) return `${ms.toFixed(1)}ms`;
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  // Format sustain level as percentage
  const formatSustain = (value) => `${Math.round(value * 100)}%`;  // Slider settings
  const sliderThickness = 0.08;
  const sliderLength = 1.75; // Slightly shorter to leave room for labels
  const sliderSpacing = 0.35; // Further decreased spacing between sliders
    // Create a memoized texture for the ADSR curve visualization
  const envelopeTextureRef = React.useRef();
  
  React.useEffect(() => {
    // This ensures we only update when component is mounted and values change
    drawADSRCurve();
  }, [attack, decay, sustain, release]);
  
  // Draw the ADSR curve visualization
  const drawADSRCurve = () => {
    const canvasSize = 256; // Size of the canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Draw grid
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = i * (canvasSize / 10);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = i * (canvasSize / 10);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize, y);
      ctx.stroke();
    }
    
    // Calculate curve points based on ADSR values
    // Normalize to canvas size
    const normalizedAttack = Math.min(attack * 1.5, 0.4) * canvasSize * 2;
    const normalizedDecay = Math.min(decay * 1.5, 0.4) * canvasSize * 2;
    const normalizedSustain = (1 - sustain) * canvasSize;
    const normalizedRelease = Math.min(release * 1.5, 0.4) * canvasSize * 2;
    
    // Start point
    const startX = canvasSize * 0.1;
    const startY = canvasSize * 0.9;
    
    // Attack peak
    const attackX = startX + normalizedAttack;
    const attackY = canvasSize * 0.1;
    
    // Decay end / Sustain level
    const decayX = attackX + normalizedDecay;
    const sustainY = attackY + normalizedSustain;
    
    // Release start (note off)
    const releaseX = Math.min(decayX + canvasSize * 0.1, canvasSize * 0.8);
    
    // Release end
    const releaseEndX = Math.min(releaseX + normalizedRelease, canvasSize * 0.95);
    const releaseEndY = startY;
    
    // Draw the curve
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Attack line (to peak)
    ctx.lineTo(attackX, attackY);
    
    // Decay line (to sustain level)
    ctx.lineTo(decayX, sustainY);
    
    // Sustain line (horizontal)
    ctx.lineTo(releaseX, sustainY);
    
    // Release curve
    ctx.lineTo(releaseEndX, releaseEndY);
    
    // Style the line
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Create or update the texture from the canvas
    if (!envelopeTextureRef.current) {
      envelopeTextureRef.current = new THREE.CanvasTexture(canvas);
    } else {
      envelopeTextureRef.current.needsUpdate = true;
      envelopeTextureRef.current.image = canvas;
    }
    
    return envelopeTextureRef.current;
  };

  // Create handlers to update each envelope parameter
  const handleAttackChange = (value) => {
    // Map slider range 0-1 to attack time 0.001-3s (logarithmic)
    const attackTime = Math.pow(3000, value) * 0.001;
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        attack: attackTime
      }
    });
  };
  
  const handleDecayChange = (value) => {
    // Map slider range 0-1 to decay time 0.001-3s (logarithmic)
    const decayTime = Math.pow(3000, value) * 0.001;
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        decay: decayTime
      }
    });
  };
  
  const handleSustainChange = (value) => {
    // Linear mapping 0-1
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        sustain: value
      }
    });
  };
  
  const handleReleaseChange = (value) => {
    // Map slider range 0-1 to release time 0.001-5s (logarithmic)
    const releaseTime = Math.pow(5000, value) * 0.001;
    setSynthParams({
      ...synthParams,
      envelope: {
        ...synthParams.envelope,
        release: releaseTime
      }
    });
  };
  
  // Convert logarithmic time values back to slider position (0-1)
  const timeToSliderPosition = (time, maxTime) => {
    return Math.log(time * 1000) / Math.log(maxTime);
  };
  
  // Get current slider positions based on actual envelope values
  const attackPosition = timeToSliderPosition(attack, 3000);
  const decayPosition = timeToSliderPosition(decay, 3000);
  const sustainPosition = sustain; // Linear
  const releasePosition = timeToSliderPosition(release, 5000);
  
  return (
    <group position={position}>
      <Panel 
        width={width} 
        height={height} 
        depth={depth}
        color={color}
        title="ENVELOPE"
      >        {/* ADSR Visualization */}
        <mesh position={[0, height/2 -1, depth/2 + 0.01]}>
          <planeGeometry args={[width * 0.45, 0.7]} />
          <meshBasicMaterial 
            map={envelopeTextureRef.current || drawADSRCurve()} 
            transparent={true} 
            opacity={0.9} 
          />
        </mesh>          {/* Attack Slider */}
        <group position={[-width/5 + sliderSpacing, -height/4 + 0.3, depth/2 + 0.1]}>          <Slider
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
            labelOffset={0} // No offset needed with new vertical layout
            valueOffset={0} // No offset needed with new vertical layout
          />
        </group>
        {/* Decay Slider */}
        <group position={[ -width/5+ sliderSpacing*2, -height/4 + 0.3, depth/2 + 0.1]}>          <Slider
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
            labelOffset={0} // No offset needed with new vertical layout
            valueOffset={0} // No offset needed with new vertical layout
          />
        </group>
        {/* Sustain Slider */}
        <group position={[-width/5 + sliderSpacing*3, -height/4 + 0.3, depth/2 + 0.1]}>          <Slider
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
            labelOffset={0} // No offset needed with new vertical layout
            valueOffset={0} // No offset needed with new vertical layout
          />
        </group>
        {/* Release Slider */}
        <group position={[-width/5 + sliderSpacing*4, -height/4 + 0.3, depth/2 + 0.1]}>          <Slider
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
            labelOffset={0} // No offset needed with new vertical layout
            valueOffset={0} // No offset needed with new vertical layout
          />
        </group>
      </Panel>
    </group>
  );
};

export default ADSREnvelopePanel;
