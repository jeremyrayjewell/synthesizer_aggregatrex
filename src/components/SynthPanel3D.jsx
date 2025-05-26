import React, { useState, useCallback, useRef, useEffect } from 'react';
import KnobPanel from './KnobPanel';
import Panel from './Panel';
import SliderPanel from './SliderPanel';
import Knob from './Knob';
import { useSynthContext } from '../hooks/useSynth';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced interactive panic button component
 */
const PanicButton = ({ panic }) => {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef();
  
  const handlePanic = useCallback((e) => {
    e.stopPropagation();
    setIsPressed(true);
    if (panic) panic();
    setTimeout(() => setIsPressed(false), 300);
  }, [panic]);
  
  return (
    <group position={[0, -4, 0.1]} ref={buttonRef}>
      <mesh 
        position={[0, 0, 0.05]} 
        scale={isPressed ? 0.95 : 1}
        onPointerDown={handlePanic}
        onPointerUp={() => setIsPressed(false)}
        onPointerOut={() => setIsPressed(false)}
      >
        <cylinderGeometry args={[0.8, 0.8, 0.3, 32]} />
        <meshStandardMaterial 
          color={isPressed ? '#cc0000' : '#ff0000'} 
          roughness={0.7}
          emissive={isPressed ? '#550000' : '#330000'} 
          emissiveIntensity={0.5}
        />
      </mesh>
      <Text
        position={[0, 0, 0.25]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/textures/fonts/bold.ttf"
      >
        PANIC
      </Text>
    </group>
  );
};

/**
 * A component that creates a simplified 3D synthesizer control panel
 * focused on filter knobs and envelope sliders.
 */
const SynthPanel3D = () => {
  console.log('SynthPanel3D: Starting render');
  
  // All hooks must be called at the top level
  const { synthParams, setSynthParams, panic, synth } = useSynthContext();
  const [panelRotation, setPanelRotation] = useState([0, 0, 0]);
  const panelRef = useRef();

  // Memoize event handlers to prevent unnecessary rerenders
  const togglePanelTilt = useCallback((e) => {
    e.stopPropagation();
    setPanelRotation(prev => prev[0] === 0 ? [-Math.PI / 8, 0, 0] : [0, 0, 0]);
  }, []);
  
  console.log('SynthPanel3D: Got synth context', { synthParams: !!synthParams, synth: !!synth });
  
  // Early return check after all hooks
  if (!synthParams) {
    console.log('SynthPanel3D: No synthParams, rendering fallback');
    return (
      <mesh>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }
  
  try {

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
        if (synth) {
          synth.setParam('oscillator1Type', type);
        }
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
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          oscillator1: { ...synthParams.oscillator1, detune: value }
        });
        if (synth) {
          synth.setParam('oscillator1Detune', value);
        }
      },
      valueFormatter: (val) => `${val.toFixed(1)}`,
      color: '#61dafb'
    },
    {
      id: 'osc1-mix',
      label: 'Mix 1',
      value: synthParams.oscillator1.mix,
      min: 0,
      max: 1,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          oscillator1: { ...synthParams.oscillator1, mix: value }
        });
        if (synth) {
          synth.setParam('oscillator1Mix', value);
        }
      },
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
        if (synth) {
          synth.setParam('oscillator2Type', type);
        }
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
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          oscillator2: { ...synthParams.oscillator2, detune: value }
        });
        if (synth) {
          synth.setParam('oscillator2Detune', value);
        }
      },
      valueFormatter: (val) => `${val.toFixed(1)}`,
      color: '#f58742'
    },
    {
      id: 'osc2-mix',
      label: 'Mix 2',
      value: synthParams.oscillator2.mix,
      min: 0,
      max: 1,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          oscillator2: { ...synthParams.oscillator2, mix: value }
        });
        if (synth) {
          synth.setParam('oscillator2Mix', value);
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#f58742'
    }
  ];

  // Enhanced filter knob controls
  const filterKnobControls = [
    {
      id: 'filter-type',
      label: 'Type',
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
          // Update the synth engine directly to ensure immediate change
        if (synth) {
          synth.setFilter(type, synthParams.filter.frequency, synthParams.filter.Q);
        }
      },
      valueFormatter: (val) => {
        return val <= 0.33 ? 'LOW-PASS' :
               val <= 0.66 ? 'HIGH-PASS' : 'BAND-PASS';
      },
      color: '#8bc34a',
      sensitivity: 0.02 // Make it less sensitive for easier selection
    },
    {
      id: 'filter-cutoff',
      label: 'Cutoff',
      value: (Math.log(synthParams.filter.frequency) - Math.log(20)) / (Math.log(20000) - Math.log(20)), // Log scale for frequency
      min: 0,
      max: 1,
      onChange: (value) => {
        // Convert from normalized 0-1 to frequency range (20Hz-20kHz, logarithmic)
        const frequency = Math.exp(Math.log(20) + value * (Math.log(20000) - Math.log(20)));
        setSynthParams({
          ...synthParams,
          filter: { ...synthParams.filter, frequency }
        });
          // Update the synth engine directly
        if (synth) {
          synth.setFilter(synthParams.filter.type, frequency, synthParams.filter.Q);
        }
      },
      valueFormatter: (val) => {
        const freq = Math.exp(Math.log(20) + val * (Math.log(20000) - Math.log(20)));
        return freq < 1000 ? `${Math.round(freq)}Hz` : `${(freq/1000).toFixed(1)}kHz`;
      },
      color: '#8bc34a'
    },
    {
      id: 'filter-resonance',
      label: 'Resonance',
      value: (synthParams.filter.Q - 0.1) / 19.9, // Normalize 0.1-20 to 0-1
      min: 0,
      max: 1,
      onChange: (value) => {
        // Convert from normalized 0-1 to Q range (0.1-20)
        const Q = 0.1 + value * 19.9;
        setSynthParams({
          ...synthParams,
          filter: { ...synthParams.filter, Q }
        });
          // Update the synth engine directly
        if (synth) {
          synth.setFilter(synthParams.filter.type, synthParams.filter.frequency, Q);
        }
      },
      valueFormatter: (val) => {
        const Q = 0.1 + val * 19.9;
        return Q.toFixed(1);
      },
      color: '#8bc34a'
    },
  ];

  // Enhanced envelope slider controls with direct synth engine connection
  const envelopeSliderControls = [
    {
      id: 'attack-slider',
      label: 'Attack',
      value: synthParams.envelope.attack / 2, // Normalize 0-2s to 0-1
      min: 0,
      max: 1,
      onChange: (value) => {
        const attack = value * 2; // Convert back to 0-2s range
        setSynthParams({
          ...synthParams,
          envelope: { ...synthParams.envelope, attack }
        });
          // Update synth engine directly
        if (synth) {
          synth.setEnvelope(
            attack,
            synthParams.envelope.decay,
            synthParams.envelope.sustain,
            synthParams.envelope.release
          );
        }
      },
      valueFormatter: (val) => `${(val * 2).toFixed(2)}s`,
      color: '#ff5722'
    },
    {
      id: 'decay-slider',
      label: 'Decay',
      value: synthParams.envelope.decay / 2, // Normalize 0-2s to 0-1
      min: 0,
      max: 1,
      onChange: (value) => {
        const decay = value * 2; // Convert back to 0-2s range
        setSynthParams({
          ...synthParams,
          envelope: { ...synthParams.envelope, decay }
        });
          // Update synth engine directly
        if (synth) {
          synth.setEnvelope(
            synthParams.envelope.attack,
            decay,
            synthParams.envelope.sustain,
            synthParams.envelope.release
          );
        }
      },
      valueFormatter: (val) => `${(val * 2).toFixed(2)}s`,
      color: '#ff5722'
    },
    {
      id: 'sustain-slider',
      label: 'Sustain',
      value: synthParams.envelope.sustain,
      min: 0,
      max: 1,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          envelope: { ...synthParams.envelope, sustain: value }
        });
          // Update synth engine directly
        if (synth) {
          synth.setEnvelope(
            synthParams.envelope.attack,
            synthParams.envelope.decay,
            value,
            synthParams.envelope.release
          );
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff5722'
    },
    {
      id: 'release-slider',
      label: 'Release',
      value: synthParams.envelope.release / 5, // Normalize 0-5s to 0-1
      min: 0,
      max: 1,
      onChange: (value) => {
        const release = value * 5; // Convert back to 0-5s range
        setSynthParams({
          ...synthParams,
          envelope: { ...synthParams.envelope, release }
        });
          // Update synth engine directly
        if (synth) {
          synth.setEnvelope(
            synthParams.envelope.attack,
            synthParams.envelope.decay,
            synthParams.envelope.sustain,
            release
          );
        }
      },
      valueFormatter: (val) => `${(val * 5).toFixed(2)}s`,
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
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          effects: { 
            ...synthParams.effects, 
            delay: { ...synthParams.effects.delay, time: value }
          }
        });
        if (synth) {
          synth.setParam('delayTime', value);
        }
      },
      valueFormatter: (val) => `${val.toFixed(2)}s`,
      color: '#9c27b0'
    },
    {
      id: 'delay-feedback',
      label: 'Feedback',
      value: synthParams.effects.delay.feedback,
      min: 0,
      max: 0.9,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          effects: { 
            ...synthParams.effects, 
            delay: { ...synthParams.effects.delay, feedback: value }
          }
        });
        if (synth) {
          synth.setParam('delayFeedback', value);
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#9c27b0'
    },
    {
      id: 'reverb-size',
      label: 'Reverb Size',
      value: synthParams.effects.reverb.size,
      min: 0.1,
      max: 0.9,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          effects: { 
            ...synthParams.effects, 
            reverb: { ...synthParams.effects.reverb, size: value }
          }
        });
        if (synth) {
          synth.setParam('reverbSize', value);
        }
      },
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
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          oscillator1: { ...synthParams.oscillator1, mix: value }
        });
        if (synth) {
          synth.setParam('oscillator1Mix', value);
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    },
    {
      id: 'osc2-mix-slider',
      label: 'Osc 2 Mix',
      value: synthParams.oscillator2.mix,
      min: 0,
      max: 1,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          oscillator2: { ...synthParams.oscillator2, mix: value }
        });
        if (synth) {
          synth.setParam('oscillator2Mix', value);
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    },
    {
      id: 'delay-mix-slider',
      label: 'Delay Mix',
      value: synthParams.effects.delay.mix,
      min: 0,
      max: 1,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          effects: { 
            ...synthParams.effects, 
            delay: { ...synthParams.effects.delay, mix: value }
          }
        });
        if (synth) {
          synth.setParam('delayMix', value);
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    },
    {
      id: 'reverb-mix-slider',
      label: 'Reverb Mix',
      value: synthParams.effects.reverb.mix,
      min: 0,
      max: 1,
      onChange: (value) => {
        setSynthParams({
          ...synthParams,
          effects: { 
            ...synthParams.effects, 
            reverb: { ...synthParams.effects.reverb, mix: value }
          }
        });
        if (synth) {
          synth.setParam('reverbMix', value);
        }
      },
      valueFormatter: (val) => `${(val * 100).toFixed(0)}%`,
      color: '#ff9800'
    }  ];

  // Create master volume control
  const masterVolumeControl = {
    id: 'master-volume',
    label: 'Volume',
    value: synthParams.master.volume,
    min: 0,
    max: 1,
    onChange: (value) => {
      setSynthParams({
        ...synthParams,
        master: { ...synthParams.master, volume: value }
      });
      
      // Update master gain directly for immediate effect
      if (synth && synth.masterGain) {
        synth.masterGain.gain.setValueAtTime(
          value,
          synth.audioContext.currentTime
        );
      }
    },
    valueFormatter: (val) => `${Math.round(val * 100)}%`,
    color: '#e91e63'
  };
  console.log('SynthPanel3D: Rendering complete panel');

  // Return the complete synth panel with simplified controls focused on filters and envelopes
  return (
    <group rotation={panelRotation} ref={panelRef}>
      {/* Main panel background */}
      <Panel 
        width={16} 
        height={10} 
        depth={0.5}
        title="SYNTHESIZER AGGREGATREX"
        color="#111111"
        borderColor="#333333"
        useMaterial={true}
      >
        <group>          {/* Filter knob section */}
          <KnobPanel
            controls={filterKnobControls}
            title="FILTER KNOBS"
            rows={1}
            cols={3}
            spacing={1.5}
            position={[0, 2, 0.1]}
            knobColor="#8bc34a"
            panelColor="#1a1a1a"
          />
            {/* Simple test volume knob - right next to filter knobs */}
          <group position={[3.5, 2, 0.1]}>
            <Knob
              value={synthParams.master.volume}
              min={0}
              max={1}
              onChange={(value) => {
                console.log('Volume changed:', value);
                setSynthParams({
                  ...synthParams,
                  master: { ...synthParams.master, volume: value }
                });
              }}
              label="VOLUME"
              color="#8bc34a"
              size={1}
            />
          </group>
          
          {/* Debug cube to verify positioning */}
          <mesh position={[5, 2, 0.1]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="red" />
          </mesh>
          
          {/* Envelope slider section */}
          <SliderPanel
            controls={envelopeSliderControls}
            title="ENVELOPE"
            orientation="horizontal"
            width={12}
            height={3}
            position={[0, -2, 0.1]}
            color="#1a1a1a"
            sliderLength={2}
            sliderThickness={0.12}
          />          {/* Master volume knob - Direct implementation */}
          <group position={[4, 2, 0.1]}>
            <Knob
              value={synthParams.master.volume}
              min={0}
              max={1}
              onChange={(value) => {
                setSynthParams({
                  ...synthParams,
                  master: { ...synthParams.master, volume: value }
                });
                
                // Update master gain directly for immediate effect
                if (synth && synth.masterGain) {
                  synth.masterGain.gain.setValueAtTime(
                    value,
                    synth.audioContext.currentTime
                  );
                }
              }}
              label="MASTER VOL"
              color="#e91e63"
              size={1.2}
              valueFormatter={(val) => `${Math.round(val * 100)}%`}
            />
            
            {/* Volume label above knob */}
            <Text
              position={[0, 1.8, 0]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              MASTER VOLUME
            </Text>
          </group>
            {/* Panic button */}
          <PanicButton panic={panic} />
          
          {/* View angle toggle button */}
          <group 
            position={[6.5, -4, 0.1]} 
            onPointerDown={togglePanelTilt}
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
          </group>        </group>
      </Panel>
    </group>
  );
  } catch (error) {
    console.error('SynthPanel3D: Error during render:', error);
    return (
      <mesh>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
};

export default SynthPanel3D;
