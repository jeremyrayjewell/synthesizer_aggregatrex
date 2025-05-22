import React, { useState } from 'react';
import KnobPanel from './KnobPanel';

const FilterPanel = () => {
  const [cutoff, setCutoff] = useState(0.5);
  const [resonance, setResonance] = useState(0.4);

  const controls = [
    { id: 'cutoff', label: 'Cutoff', value: cutoff, min: 0, max: 1, onChange: setCutoff },
    { id: 'resonance', label: 'Resonance', value: resonance, min: 0, max: 1, onChange: setResonance },
  ];

  return <KnobPanel title="Filter" controls={controls} />;
};

export default FilterPanel;
