import React from 'react';
import Panel from './Panel';
import Knob from './Knob';

const KnobPanel = ({ controls = [], title = 'Knobs', rows = 1, spacing = 1.2 }) => {
  const cols = Math.ceil(controls.length / rows);

  return (
    <group>
      <Panel width={cols * spacing + 1} height={rows * spacing + 1} title={title}>
        {controls.map((ctrl, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = (col - (cols - 1) / 2) * spacing;
          const y = -((row - (rows - 1) / 2) * spacing);

          return (
            <group key={ctrl.id} position={[x, y, 0.1]}>
              <Knob
                value={ctrl.value}
                min={ctrl.min}
                max={ctrl.max}
                onChange={ctrl.onChange}
                label={ctrl.label}
              />
            </group>
          );
        })}
      </Panel>
    </group>
  );
};

export default KnobPanel;
