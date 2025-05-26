import React from 'react';
import Panel from './Panel';
import Knob from './Knob';
import { Text } from '@react-three/drei';

const KnobPanel = ({ 
  controls = [], 
  title = 'Controls', 
  rows = 1, 
  cols = null,
  spacing = 1.2,
  panelWidth = null,
  panelHeight = null,
  width = null,
  height = null,
  panelColor = '#222222',
  knobSize = 1,
  knobColor = '#61dafb',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  showValues = false
}) => {
  // Calculate columns if not specified
  const calculatedCols = cols || Math.ceil(controls.length / rows);
  
  // Calculate panel dimensions if not specified
  const panelWidth2 = width || panelWidth || (calculatedCols * spacing + 1);
  const panelHeight2 = height || panelHeight || (rows * spacing + 1);

  return (
    <group position={position} rotation={rotation}>
      <Panel 
        width={panelWidth2} 
        height={panelHeight2} 
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
              
              {/* Show larger value display when showValues is true */}
              {showValues && (                <Text
                  position={[0, -knobSize * 0.75, 0]}
                  fontSize={0.06}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                  outlineWidth={1}
                  outlineColor="#000000"
                >
                  {ctrl.valueFormatter ? ctrl.valueFormatter(ctrl.value) : ctrl.value.toFixed(2)}
                </Text>
              )}
            </group>
          );
        })}
      </Panel>
    </group>
  );
};

export default KnobPanel;
