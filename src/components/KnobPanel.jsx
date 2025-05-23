import React from 'react';
import Panel from './Panel';
import Knob from './Knob';

const KnobPanel = ({ 
  controls = [], 
  title = 'Controls', 
  rows = 1, 
  cols = null,
  spacing = 1.2,
  panelWidth = null,
  panelHeight = null,
  panelColor = '#222222',
  knobSize = 1,
  knobColor = '#61dafb',
  position = [0, 0, 0],
  rotation = [0, 0, 0]
}) => {
  // Calculate columns if not specified
  const calculatedCols = cols || Math.ceil(controls.length / rows);
  
  // Calculate panel dimensions if not specified
  const width = panelWidth || (calculatedCols * spacing + 1);
  const height = panelHeight || (rows * spacing + 1);

  return (
    <group position={position} rotation={rotation}>
      <Panel 
        width={width} 
        height={height} 
        title={title}
        color={panelColor}
      >
        {controls.map((ctrl, i) => {
          const col = i % calculatedCols;
          const row = Math.floor(i / calculatedCols);
          
          // Calculate positions to center knobs in the panel
          const x = (col - (calculatedCols - 1) / 2) * spacing;
          const y = -((row - (rows - 1) / 2) * spacing);

          return (
            <group key={ctrl.id || `knob-${i}`} position={[x, y, 0.1]}>
              <Knob
                value={ctrl.value}
                min={ctrl.min !== undefined ? ctrl.min : 0}
                max={ctrl.max !== undefined ? ctrl.max : 1}
                onChange={ctrl.onChange}
                label={ctrl.label || `Knob ${i+1}`}
                size={knobSize}
                color={ctrl.color || knobColor}
                valueFormatter={ctrl.valueFormatter}
                sensitivity={ctrl.sensitivity || 0.01}
              />
            </group>
          );
        })}
      </Panel>
    </group>
  );
};

export default KnobPanel;
