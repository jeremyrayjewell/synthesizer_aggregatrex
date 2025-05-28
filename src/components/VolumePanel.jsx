import React from 'react';
import Panel from './Panel';
import Slider from './Slider';
import { useSynthContext } from '../hooks/useSynth';

const VolumePanel = () => {
  const { synthParams, setSynthParams, synth } = useSynthContext();

  const handleVolumeChange = (value) => {
    setSynthParams({
      ...synthParams,
      master: { 
        ...synthParams.master, 
        volume: value,
        isMuted: value === 0
      }
    });
    
    if (synth && synth.masterGain) {
      synth.masterGain.gain.setValueAtTime(
        value,
        synth.audioContext.currentTime
      );
    }
  };

  return (
    <Panel title="Volume" width={3} height={1.5} depth={0.2}>
      <group position={[0, 0, 0.1]}>
        <Slider 
          value={synthParams?.master?.volume || 0}
          min={0}
          max={1}
          onChange={handleVolumeChange}
          label="Volume"
          valueFormatter={(val) => {
            if (val === 0) return "MUTE";
            return `${(val * 100).toFixed(0)}%`;
          }}
          color={synthParams?.master?.volume === 0 ? "#ff0000" : "#e91e63"}
        />
      </group>
    </Panel>
  );
};

export default VolumePanel;
