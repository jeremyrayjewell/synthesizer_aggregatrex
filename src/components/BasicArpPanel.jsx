import React from 'react';
import { Text } from '@react-three/drei';
import Knob from './Knob';
import ToggleSwitch from './ToggleSwitch';
import { useSynthContext } from '../hooks/useSynth';

// Basic version of the ArpeggiatorPanel with minimal controls
const BasicArpPanel = ({ 
  position = [0, 0, 0],
  width = 3,
  height = 2,
  depth = 0.2
}) => {  const { synthParams, setSynthParams, synth } = useSynthContext();
  
  console.log("🎹 BasicArpPanel rendering attempt");
  console.log("Position:", position);
  console.log("synthParams:", synthParams);
  
  // Early return if no synth params
  if (!synthParams || !synthParams.arpeggiator) {
    console.log("Missing synthParams or arpeggiator state in BasicArpPanel");
    return null;
  }
  
  const arpeggiator = synthParams.arpeggiator;
  const knobZ = depth + 0.01;
    // Hardcoded constants to avoid import issues
  const ARP_RATE_MIN = 60;
  const ARP_RATE_MAX = 300;
  
  return (
    <group position={position}>
      {/* Panel background */}
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color="#330033" 
          roughness={0.7}
          metalness={0.2}
          emissive={arpeggiator.enabled ? "#220022" : "#000000"}
        />      </mesh>

      {/* Title */}
      <Text
        position={[0, height/2 - 0.3, knobZ]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ARPEGGIATOR
      </Text>      {/* On/Off Toggle */}      <group position={[-width/4, 0, knobZ]}>        <ToggleSwitch
          value={arpeggiator.enabled}
          onChange={(enabled) => {
            // When changing the arpeggiator state, we need special handling
            console.log(`Setting arpeggiator enabled: ${enabled}`);
            
            // Setup everything in the correct order
            if (!enabled && arpeggiator.enabled) {
              if (synth) {
                // 1. Update state first - this is important so the engine knows it should be disabled
                setSynthParams(prev => ({
                  ...prev,
                  arpeggiator: { ...prev.arpeggiator, enabled: false }
                }));
                
                // 2. Use our emergency function to kill all notes
                console.log("EMERGENCY: Killing all arpeggiator notes");
                if (typeof synth.voiceManager?.emergencyReleaseAll === 'function') {
                  synth.voiceManager.emergencyReleaseAll();
                }
                  // 3. Trigger a forced silence using brute force
                if (synth.masterGain && synth.audioContext) {
                  try {
                    // Temporarily disconnect the main output for instant silence
                    synth.masterGain.disconnect();
                    
                    // Give time for any notes to be cleaned up
                    setTimeout(() => {
                      if (synth.masterGain && synth.audioContext) {
                        synth.masterGain.connect(synth.audioContext.destination);
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
          size={0.25}
          onColor="#e91e63"
          offColor="#666666"
        />
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          ON/OFF
        </Text>
      </group>

      {/* Rate Knob */}
      <group position={[width/4, 0, knobZ]}>
        <Knob
          size={0.25}
          value={(arpeggiator.rate - ARP_RATE_MIN) / (ARP_RATE_MAX - ARP_RATE_MIN)}
          min={0}
          max={1}
          onChange={(value) => {
            const rate = value * (ARP_RATE_MAX - ARP_RATE_MIN) + ARP_RATE_MIN;
            setSynthParams(prev => ({
              ...prev,
              arpeggiator: { ...prev.arpeggiator, rate }
            }));
          }}
          label="RATE"
          color="#e91e63"
          valueFormatter={(val) => {
            const rate = val * (ARP_RATE_MAX - ARP_RATE_MIN) + ARP_RATE_MIN;
            return `${rate.toFixed(0)}`;
          }}
        />
      </group>
    </group>
  );
};

export default BasicArpPanel;
