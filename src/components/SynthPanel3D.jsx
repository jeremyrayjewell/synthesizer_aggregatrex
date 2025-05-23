import React, { useState } from 'react';
import KnobPanel from './KnobPanel';
import Panel from './Panel';
import SliderPanel from './SliderPanel';
import { useSynthContext } from '../hooks/useSynth';
import { Text, Html, Plane } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A component that creates a full 3D synthesizer control panel
 * with all the knobs and controls arranged in a visually appealing way.
 */
const SynthPanel3D = () => {
  const { synthParams, setSynthParams, panic } = useSynthContext();
  const [panelRotation, setPanelRotation] = useState([0, 0, 0]);
  
  // Toggle panel tilt for better viewing angle
  const togglePanelTilt = () => {
    if (panelRotation[0] === 0) {
      setPanelRotation([-Math.PI / 8, 0, 0]); // Tilt forward
    } else {
      setPanelRotation([0, 0, 0]); // Reset tilt
    }
  };

  // Create oscillator section controls
  const oscillatorControls = [
    {
      id: 'osc1-type',
      label: 'Wave 1',
      value: synthParams.oscillator1.type === 'sawtooth' ? 0 :
             synthParams.oscillator1.type === 'square' ? 0.33 :
             synthParams.oscillator1.type === 'triangle' ? 0.66 : 1,
      min: 0,
      max: 1,
      onChange: (value) => {
        const type = value <= 0.25 ? 'sawtooth' :
                    value <= 0.5 ? 'square' :
                    value <= 0.75 ? 'triangle' : 'sine';
        setSynthParams({
          ...synthParams,
          oscillator1: { ...synthParams.oscillator1, type }
        });
      },
      valueFormatter: (val) => {
        return val <= 0.25 ? 'Saw' :
               val <= 0.5 ? 'Square' :
               val <= 0.75 ? 'Tri' : 'Sine';
      },
      color: '#61dafb'
    },
    {
      id: 'osc1-detune',
      label: 'Detune 1',
      value: synthParams.oscillator1.detune,
      min: -100,
      max: 100,
      onChange: (value) => setSynthParams({
        ...synthParams,
        oscillator1: { ...synthParams.oscillator1, detune: value }
      }),
      valueFormatter: (val) => `${val.toFixed(1)}`,
      color: '#61dafb'
    },
    {
      id: 'osc1-mix',
      label: 'Mix 1',
      value: synthParams.oscillator1.mix,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        oscillator1: { ...synthParams.oscillator1, mix: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#61dafb'
    },
    {
      id: 'osc2-type',
      label: 'Wave 2',
      value: synthParams.oscillator2.type === 'sawtooth' ? 0 :
             synthParams.oscillator2.type === 'square' ? 0.33 :
             synthParams.oscillator2.type === 'triangle' ? 0.66 : 1,
      min: 0,
      max: 1,
      onChange: (value) => {
        const type = value <= 0.25 ? 'sawtooth' :
                    value <= 0.5 ? 'square' :
                    value <= 0.75 ? 'triangle' : 'sine';
        setSynthParams({
          ...synthParams,
          oscillator2: { ...synthParams.oscillator2, type }
        });
      },
      valueFormatter: (val) => {
        return val <= 0.25 ? 'Saw' :
               val <= 0.5 ? 'Square' :
               val <= 0.75 ? 'Tri' : 'Sine';
      },
      color: '#f58742'
    },
    {
      id: 'osc2-detune',
      label: 'Detune 2',
      value: synthParams.oscillator2.detune,
      min: -100,
      max: 100,
      onChange: (value) => setSynthParams({
        ...synthParams,
        oscillator2: { ...synthParams.oscillator2, detune: value }
      }),
      valueFormatter: (val) => `${val.toFixed(1)}`,
      color: '#f58742'
    },
    {
      id: 'osc2-mix',
      label: 'Mix 2',
      value: synthParams.oscillator2.mix,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        oscillator2: { ...synthParams.oscillator2, mix: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#f58742'
    }
  ];

  // Create filter section controls
  const filterControls = [
    {
      id: 'filter-type',
      label: 'Filter Type',
      value: synthParams.filter.type === 'lowpass' ? 0 :
             synthParams.filter.type === 'highpass' ? 0.5 : 1,
      min: 0,
      max: 1,
      onChange: (value) => {
        const type = value <= 0.33 ? 'lowpass' :
                    value <= 0.66 ? 'highpass' : 'bandpass';
        setSynthParams({
          ...synthParams,
          filter: { ...synthParams.filter, type }
        });
      },
      valueFormatter: (val) => {
        return val <= 0.33 ? 'LP' :
               val <= 0.66 ? 'HP' : 'BP';
      },
      color: '#8bc34a'
    },
    {
      id: 'filter-cutoff',
      label: 'Cutoff',
      value: synthParams.filter.frequency,
      min: 20,
      max: 20000,
      onChange: (value) => setSynthParams({
        ...synthParams,
        filter: { ...synthParams.filter, frequency: value }
      }),
      valueFormatter: (val) => {
        return val < 1000 ? `${val.toFixed(0)}Hz` : `${(val/1000).toFixed(1)}kHz`;
      },
      color: '#8bc34a'
    },
    {
      id: 'filter-resonance',
      label: 'Resonance',
      value: synthParams.filter.Q,
      min: 0.1,
      max: 20,
      onChange: (value) => setSynthParams({
        ...synthParams,
        filter: { ...synthParams.filter, Q: value }
      }),
      valueFormatter: (val) => `${val.toFixed(1)}`,
      color: '#8bc34a'
    },
    {
      id: 'filter-env-amount',
      label: 'Env Amt',
      value: synthParams.filter.envelopeAmount,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        filter: { ...synthParams.filter, envelopeAmount: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#8bc34a'
    }
  ];

  // Create envelope section controls
  const envelopeControls = [
    {
      id: 'attack',
      label: 'Attack',
      value: synthParams.envelope.attack,
      min: 0.001,
      max: 2,
      onChange: (value) => setSynthParams({
        ...synthParams,
        envelope: { ...synthParams.envelope, attack: value }
      }),
      valueFormatter: (val) => `${val.toFixed(2)}s`,
      color: '#ff5722'
    },
    {
      id: 'decay',
      label: 'Decay',
      value: synthParams.envelope.decay,
      min: 0.001,
      max: 2,
      onChange: (value) => setSynthParams({
        ...synthParams,
        envelope: { ...synthParams.envelope, decay: value }
      }),
      valueFormatter: (val) => `${val.toFixed(2)}s`,
      color: '#ff5722'
    },
    {
      id: 'sustain',
      label: 'Sustain',
      value: synthParams.envelope.sustain,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        envelope: { ...synthParams.envelope, sustain: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff5722'
    },
    {
      id: 'release',
      label: 'Release',
      value: synthParams.envelope.release,
      min: 0.001,
      max: 5,
      onChange: (value) => setSynthParams({
        ...synthParams,
        envelope: { ...synthParams.envelope, release: value }
      }),
      valueFormatter: (val) => `${val.toFixed(2)}s`,
      color: '#ff5722'
    }
  ];

  // Create effects section controls
  const effectsControls = [
    {
      id: 'delay-time',
      label: 'Delay Time',
      value: synthParams.effects.delay.time,
      min: 0.05,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        effects: { 
          ...synthParams.effects, 
          delay: { ...synthParams.effects.delay, time: value }
        }
      }),
      valueFormatter: (val) => `${val.toFixed(2)}s`,
      color: '#9c27b0'
    },
    {
      id: 'delay-feedback',
      label: 'Feedback',
      value: synthParams.effects.delay.feedback,
      min: 0,
      max: 0.9,
      onChange: (value) => setSynthParams({
        ...synthParams,
        effects: { 
          ...synthParams.effects, 
          delay: { ...synthParams.effects.delay, feedback: value }
        }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#9c27b0'
    },
    {
      id: 'reverb-size',
      label: 'Reverb Size',
      value: synthParams.effects.reverb.size,
      min: 0.1,
      max: 0.9,
      onChange: (value) => setSynthParams({
        ...synthParams,
        effects: { 
          ...synthParams.effects, 
          reverb: { ...synthParams.effects.reverb, size: value }
        }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#9c27b0'
    },
    {
      id: 'master-volume',
      label: 'Volume',
      value: synthParams.master.volume,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        master: { ...synthParams.master, volume: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#e91e63'
    }
  ];

  // Create filter slider controls for vertical presentation
  const filterSliderControls = [
    {
      id: 'filter-cutoff-slider',
      label: 'Cutoff',
      value: (synthParams.filter.frequency - 20) / 19980, // Scale 20-20000 Hz to 0-1
      min: 0,
      max: 1,
      onChange: (value) => {
        // Convert 0-1 to frequency range (20Hz-20kHz, logarithmic)
        const frequency = 20 * Math.pow(1000, value);
        setSynthParams({
          ...synthParams,
          filter: { ...synthParams.filter, frequency }
        });
      },
      valueFormatter: (val) => {
        const freq = 20 * Math.pow(1000, val);
        return freq < 1000 
          ? `${Math.round(freq)}Hz` 
          : `${(freq/1000).toFixed(1)}kHz`;
      },
      color: '#8bc34a'
    },
    {
      id: 'filter-resonance-slider',
      label: 'Resonance',
      value: synthParams.filter.Q,
      min: 0.1,
      max: 20,
      onChange: (value) => setSynthParams({
        ...synthParams,
        filter: { ...synthParams.filter, Q: value }
      }),
      valueFormatter: (val) => val.toFixed(1),
      color: '#8bc34a'
    },
    {
      id: 'filter-env-amount',
      label: 'Env Amt',
      value: synthParams.filter.envelopeAmount,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        filter: { ...synthParams.filter, envelopeAmount: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#8bc34a'
    }
  ];
  
  // Create modulation slider controls for horizontal presentation
  const modulationSliderControls = [
    {
      id: 'osc1-mix-slider',
      label: 'Osc 1 Mix',
      value: synthParams.oscillator1.mix,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        oscillator1: { ...synthParams.oscillator1, mix: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    },
    {
      id: 'osc2-mix-slider',
      label: 'Osc 2 Mix',
      value: synthParams.oscillator2.mix,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        oscillator2: { ...synthParams.oscillator2, mix: value }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    },
    {
      id: 'delay-mix-slider',
      label: 'Delay Mix',
      value: synthParams.effects.delay.mix,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        effects: { 
          ...synthParams.effects, 
          delay: { ...synthParams.effects.delay, mix: value }
        }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    },
    {
      id: 'reverb-mix-slider',
      label: 'Reverb Mix',
      value: synthParams.effects.reverb.mix,
      min: 0,
      max: 1,
      onChange: (value) => setSynthParams({
        ...synthParams,
        effects: { 
          ...synthParams.effects, 
          reverb: { ...synthParams.effects.reverb, mix: value }
        }
      }),
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    }
  ];

  // Create interactive panic button
  const PanicButton = () => {
    const [isPressed, setIsPressed] = useState(false);
    
    const handlePanic = () => {
      setIsPressed(true);
      panic();
      setTimeout(() => setIsPressed(false), 300);
    };
    
    return (
      <group position={[0, -4, 0.1]} onClick={handlePanic}>
        <mesh position={[0, 0, 0.05]} scale={isPressed ? 0.95 : 1}>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 32]} />
          <meshStandardMaterial color={isPressed ? '#cc0000' : '#ff0000'} roughness={0.7} />
        </mesh>
        <Text
          position={[0, 0, 0.25]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          PANIC
        </Text>
      </group>
    );
  };

  // Return the complete synth panel with all control sections
  return (
    <group rotation={panelRotation}>
      {/* Main panel background */}
      <Panel 
        width={24} 
        height={12} 
        depth={0.5}
        title="SYNTHESIZER AGGREGATREX"
        color="#111111"
        borderColor="#333333"
        useMaterial={true}
      >
        {/* Control panels arranged inside the main panel */}
        <group>
          {/* Oscillator section */}
          <KnobPanel
            controls={oscillatorControls}
            title="OSCILLATORS"
            rows={2}
            cols={3}
            spacing={1.5}
            position={[-8, 2, 0.1]}
            knobColor="#61dafb"
            panelColor="#1a1a1a"
          />
          
          {/* Filter section */}
          <KnobPanel
            controls={filterControls}
            title="FILTER"
            rows={1}
            cols={4}
            spacing={1.5}
            position={[3, 2, 0.1]}
            knobColor="#8bc34a"
            panelColor="#1a1a1a"
          />
          
          {/* Envelope section */}
          <KnobPanel
            controls={envelopeControls}
            title="ENVELOPE"
            rows={1}
            cols={4}
            spacing={1.5}
            position={[-8, -1.5, 0.1]}
            knobColor="#ff5722"
            panelColor="#1a1a1a"
          />
          
          {/* Effects section */}
          <KnobPanel
            controls={effectsControls}
            title="EFFECTS & MASTER"
            rows={1}
            cols={4}
            spacing={1.5}
            position={[3, -1.5, 0.1]}
            knobColor="#9c27b0"
            panelColor="#1a1a1a"
          />
          
          {/* Filter slider section */}
          <SliderPanel
            controls={filterSliderControls}
            title="FILTER SLIDERS"
            rows={3}
            cols={1}
            spacing={1.5}
            position={[-12, 2, 0.1]}
            sliderColor="#8bc34a"
            panelColor="#1a1a1a"
            orientation="vertical"
          />
          
          {/* Modulation slider section */}
          <SliderPanel
            controls={modulationSliderControls}
            title="MODULATION SLIDERS"
            rows={1}
            cols={4}
            spacing={1.5}
            position={[-12, -1.5, 0.1]}
            sliderColor="#ff9800"
            panelColor="#1a1a1a"
            orientation="horizontal"
          />
          
          {/* Filter sliders - vertical orientation */}
          <SliderPanel
            controls={filterSliderControls}
            title="FILTER CONTROLS"
            orientation="vertical"
            width={3}
            height={6}
            position={[-3, 0, 0.1]}
            color="#1a1a1a"
            sliderLength={3}
            sliderThickness={0.15}
          />
          
          {/* Modulation mix sliders - horizontal orientation */}
          <SliderPanel
            controls={modulationSliderControls}
            title="MIX CONTROLS"
            orientation="horizontal"
            width={16}
            height={2.5}
            position={[0, -4.5, 0.1]}
            color="#1a1a1a"
            sliderLength={2}
            sliderThickness={0.12}
          />
          
          {/* Panic button */}
          <PanicButton />
          
          {/* View angle toggle button */}
          <group 
            position={[10.5, -4, 0.1]} 
            onClick={togglePanelTilt}
          >
            <mesh position={[0, 0, 0.05]}>
              <boxGeometry args={[1.2, 0.5, 0.2]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
            <Text
              position={[0, 0, 0.2]}
              fontSize={0.15}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              VIEW
            </Text>
          </group>
        </group>
      </Panel>
    </group>
  );
};

export default SynthPanel3D;
