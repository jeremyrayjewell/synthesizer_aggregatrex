import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import Keyboard3D from '../components/Keyboard3D';
import Panel from '../components/Panel';
import Knob from '../components/Knob';
import FilterPanel from '../components/FilterPanel';
import ADSREnvelopePanel from '../components/ADSREnvelopePanel';
import OscillatorPanel from '../components/OscillatorPanel';
import ArpeggiatorPanel from '../components/ArpeggiatorPanel';
import EffectsPanel from '../components/EffectsPanel';
import { useSynthContext } from '../hooks/useSynth';
import { DEFAULT_MASTER_VOLUME } from '../constants/synth';

const SceneManager = ({ activeNotes, onNoteOn, onNoteOff }) => {
  const { camera } = useThree();
  const groupRef = useRef();
  const { synthParams, setSynthParams, synth } = useSynthContext();
  const [filterEnabled, setFilterEnabled] = useState(true);
  const [filterType, setFilterType] = useState(synthParams?.filter?.type || 'lowpass');
  const [filterFreq, setFilterFreq] = useState(synthParams?.filter?.frequency || 2000);
  const [filterQ, setFilterQ] = useState(synthParams?.filter?.Q || 1);

  useEffect(() => {
    if (groupRef.current) {
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  const handleNoteOn = useCallback((note, velocity) => {
    if (onNoteOn) {
      onNoteOn(note, velocity);
    }
  }, [onNoteOn]);

  const handleNoteOff = useCallback((note) => {
    if (onNoteOff) {
      onNoteOff(note);
    }
  }, [onNoteOff]);

  return (
    <group ref={groupRef}>
      <group position={[0, 2, -2.5]}>        <Panel
          width={12}
          height={6}
          depth={0.5}
          color="#1a1a1a"
          border={true}
          borderColor="#333333"
          title="SYNTH CONTROLS"        >          <OscillatorPanel />
          <ADSREnvelopePanel />
          <FilterPanel
            filterEnabled={filterEnabled}
            filterType={filterType}
            filterFreq={filterFreq}
            filterQ={filterQ}
            depth={0.2}
            onFilterTypeChange={(newType, newEnabled) => {
              setFilterEnabled(newEnabled);
              setFilterType(newType);
              setSynthParams((prevParams) => ({
                ...prevParams,
                filter: {
                  ...prevParams.filter,
                  type: newType,
                  enabled: newEnabled
                }
              }));
              if (synth && synth.setFilter) {
                if (newEnabled) {
                  synth.setFilter(newType, filterFreq, filterQ);
                } else {
                  if (synth.bypassFilter) {
                    synth.bypassFilter();
                  } else {
                    const bypassFreq = newType === 'lowpass' ? 20000 : 20;
                    synth.setFilter(newType, bypassFreq, 0.1);
                  }
                }
              }
            }}
            onFilterFreqChange={(frequency) => {
              setFilterFreq(frequency);
              setSynthParams((prevParams) => ({
                ...prevParams,
                filter: { ...prevParams.filter, frequency }
              }));
              if (synth && synth.setFilter && filterEnabled) {
                synth.setFilter(filterType, frequency, filterQ);
              }
            }}            onFilterQChange={(newQ) => {
              setFilterQ(newQ);
              setSynthParams((prevParams) => ({
                ...prevParams,          filter: { ...prevParams.filter, Q: newQ }              }));              if (synth && synth.setFilter && filterEnabled) {                synth.setFilter(filterType, filterFreq, newQ);          }            }}          />
            {/* Arpeggiator Panel */}
          <ArpeggiatorPanel />
          
          <group position={[0, 0, 0.1]}>
            <Knob
              size={1.2}
              value={synthParams?.master?.volume ?? DEFAULT_MASTER_VOLUME}
              min={0}
              max={1}
              onChange={(value) => {
                setSynthParams((prevParams) => ({
                  ...prevParams,
                  master: {
                    ...prevParams.master,
                    volume: value,
                    isMuted: value === 0
                  }
                }));
                if (synth && synth.masterGain) {
                  const scaledVolume = value * value;
                  synth.masterGain.gain.setValueAtTime(
                    scaledVolume,
                    synth.audioContext.currentTime
                  );
                }
              }}
              label="MASTER VOL"
              color={synthParams?.master?.volume === 0 ? "#ff0000" : "#e91e63"}
              valueFormatter={(val) => {
                if (val === 0) return "MUTE";
                return `${Math.round(val * 100)}%`;
              }}
            />
          </group>        </Panel>
      </group>        {/* Effects Panel */}
      <group position={[8, 2, -2.5]}>
        <EffectsPanel />
      </group>
      
      <group position={[0, -2, 0]}>
        <Keyboard3D
          startNote={36}
          endNote={96}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          activeNotes={activeNotes || new Set()}
        />
      </group>
    </group>
  );
};

export default SceneManager;
