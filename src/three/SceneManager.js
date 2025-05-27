import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import Keyboard3D from '../components/Keyboard3D';
import Panel from '../components/Panel';
import Knob from '../components/Knob';
import SliderPanel from '../components/SliderPanel';
import FilterPanel from '../components/FilterPanel';
import ADSREnvelopePanel from '../components/ADSREnvelopePanel';
import { useSynthContext } from '../hooks/useSynth';

const SceneManager = ({ activeNotes, onNoteOn, onNoteOff }) => {
  const { camera } = useThree();
  const groupRef = useRef();
  const { synthParams, setSynthParams, synth } = useSynthContext();
    // Add state to track filter settings for more control
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [filterType, setFilterType] = useState(synthParams?.filter?.type || 'lowpass');
  const [filterFreq, setFilterFreq] = useState(synthParams?.filter?.frequency || 2000);
  const [filterQ, setFilterQ] = useState(synthParams?.filter?.Q || 1);
  
  // Handle scene initialization
  useEffect(() => {
    if (groupRef.current) {
      // Ensure scene is visible to camera
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  // Memoize note handlers to prevent unnecessary rerenders
  const handleNoteOn = useCallback((note, velocity) => {
    if (onNoteOn) {
      onNoteOn(note, velocity);
    }
  }, [onNoteOn]);

  const handleNoteOff = useCallback((note) => {
    if (onNoteOff) {
      onNoteOff(note);
    }
  }, [onNoteOff]);  return (
    <group ref={groupRef}>
      {/* Main panel with controls */}
      <group position={[0, 2, -2.5]}>
        <Panel
          width={12}
          height={6}
          depth={0.5}
          color="#1a1a1a"
          border={true}
          borderColor="#333333"
          title="SYNTH CONTROLS"
        >          {/* Integrated Filter Panel */}          {/* ADSR Envelope Panel */}
          <group position={[3.75, 0, 0.1]}>
            <ADSREnvelopePanel
              width={4}
              height={3.5}
              depth={0.2}
              sliderColor="#8bc34a"
            />
          </group>
          
          {/* Filter Panel */}
          <group position={[-4.75, -2.25, 0.1]}>
            <FilterPanel
              filterEnabled={filterEnabled}
              filterType={filterType}
              filterFreq={filterFreq}
              filterQ={filterQ}
              width={2}
              height={1}
              depth={0.2}
              knobColor="#8bc34a"
              onFilterTypeChange={(newType, newEnabled) => {
                console.log('Filter setting changed:', newType, newEnabled);
                
                // Update local state
                setFilterEnabled(newEnabled);
                setFilterType(newType);
                
                // Update filter settings in synthParams
                setSynthParams((prevParams) => ({
                  ...prevParams,
                  filter: { 
                    ...prevParams.filter, 
                    type: newType,
                    enabled: newEnabled
                  }
                }));
                
                // Update synth engine directly if available
                if (synth && synth.setFilter) {
                  if (newEnabled) {
                    // Normal filter setting
                    synth.setFilter(newType, filterFreq, filterQ);
                  } else {
                    // Bypass filter
                    if (synth.bypassFilter) {
                      synth.bypassFilter();
                    } else {
                      // Fallback: set an extreme frequency that effectively bypasses the filter
                      const bypassFreq = newType === 'lowpass' ? 20000 : 20;
                      synth.setFilter(newType, bypassFreq, 0.1);
                    }
                  }
                }
              }}
              onFilterFreqChange={(frequency) => {
                console.log('Filter frequency changed:', frequency);
                
                // Update local state
                setFilterFreq(frequency);
                
                // Update the synthParams state
                setSynthParams((prevParams) => ({
                  ...prevParams,
                  filter: { ...prevParams.filter, frequency }
                }));
                
                // Update synth filter directly for immediate effect
                if (synth && synth.setFilter && filterEnabled) {
                  synth.setFilter(filterType, frequency, filterQ);
                }
              }}
              onFilterQChange={(newQ) => {
                console.log('Filter resonance changed:', newQ);
                
                // Update local state
                setFilterQ(newQ);
                
                // Update the synthParams state
                setSynthParams((prevParams) => ({
                  ...prevParams,
                  filter: { ...prevParams.filter, Q: newQ }
                }));
                
                // Update filter directly if enabled
                if (synth && synth.setFilter && filterEnabled) {
                  synth.setFilter(filterType, filterFreq, newQ);
                }
              }}
            />
          </group>
          
          {/* Master volume knob */}
          <group position={[0, 0, 0.1]}>
            <Knob
              size={1.2} // Standard size to match other knobs
              value={synthParams?.master?.volume ?? 0.75}
              min={0}
              max={1}
              onChange={(value) => {
                console.log('Master volume changed:', value);
                // Store original volume value (not the scaled one) in synthParams
                setSynthParams((prevParams) => ({
                  ...prevParams,
                  master: { 
                    ...prevParams.master, 
                    volume: value,
                    // Store a flag to remember if volume is zero
                    isMuted: value === 0
                  }
                }));
                
                // Update master gain directly for immediate effect
                if (synth && synth.masterGain) {
                  // Use exponential scaling for more natural volume control
                  const scaledVolume = value * value; // Square for better low-volume control
                  synth.masterGain.gain.setValueAtTime(
                    scaledVolume,
                    synth.audioContext.currentTime
                  );
                }              }}              
              label="MASTER VOL"
              color={synthParams?.master?.volume === 0 ? "#ff0000" : "#e91e63"} // Red when muted, pink otherwise
              valueFormatter={(val) => {
                if (val === 0) return "MUTE";
                return                `${Math.round(val * 100)}%`;
              }}            />
          </group>
            {/* Additional controls can be added here if needed */}
        </Panel>
      </group>

      {/* Keyboard below panel */}
      <group position={[0, -2, 0]}>
        <Keyboard3D
          startNote={36} // C2
          endNote={96}   // C7
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          activeNotes={activeNotes || new Set()}
        />
      </group>
    </group>
  );
};

export default SceneManager;
