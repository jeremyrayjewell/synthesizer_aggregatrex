import React, { useState, useCallback, useRef, useEffect } from 'react';
import Panel from './Panel';
import Knob from './Knob';
import ADSREnvelopePanel from './ADSREnvelopePanel';
import { useSynthContext } from '../hooks/useSynth';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { COMMON_SPACING } from '../constants/spacing';

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

const SynthPanel3D = () => {
  const { synthParams, setSynthParams, panic, synth } = useSynthContext();
  const [panelRotation, setPanelRotation] = useState([0, 0, 0]);
  const panelRef = useRef();

  const togglePanelTilt = useCallback((e) => {
    e.stopPropagation();
    setPanelRotation(prev => prev[0] === 0 ? [-Math.PI / 8, 0, 0] : [0, 0, 0]);
  }, []);

  if (!synthParams) {
    return (
      <mesh>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }

  try {

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
    }
  ];

  return (
    <group rotation={panelRotation} ref={panelRef}>
      <Panel 
        width={16} 
        height={10} 
        depth={0.5}
        title="SYNTHESIZER AGGREGATREX"
        color="#111111"
        borderColor="#333333"
        useMaterial={true}
      >
        <group>
          <ADSREnvelopePanel
            width={12}
            height={3}
            depth={0.2}
            position={[0, -2, 0.1]}
            color="#1a1a1a"
            sliderColor="#ff5722"
          />
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
                if (synth && synth.masterGain) {
                  synth.masterGain.gain.setValueAtTime(
                    value,
                    synth.audioContext.currentTime
                  );
                }
              }}              label="MASTER VOL"
              color="#e91e63"
              size={COMMON_SPACING.MASTER_KNOB_SIZE}
              valueFormatter={(val) => `${Math.round(val * 100)}%`}
            />
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
          <PanicButton panic={panic} />
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
          </group>
        </group>
      </Panel>
    </group>
  );
  } catch (error) {
    return (
      <mesh>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
};

export default SynthPanel3D;
