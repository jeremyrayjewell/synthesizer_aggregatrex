import React, { useState } from 'react';
import SliderPanel from './SliderPanel';

const VolumePanel = () => {
  const [volume, setVolume] = useState(0.75);

  const controls = [
    { id: 'volume', label: 'Volume', value: volume, min: 0, max: 1, onChange: setVolume },
  ];

  return <SliderPanel title="Volume" controls={controls} />;
};

export default VolumePanel;
