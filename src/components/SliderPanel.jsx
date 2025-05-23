import React from 'react';
import Panel from './Panel';
import Slider from './Slider';

/**
 * A panel containing multiple sliders arranged vertically or horizontally
 */
const SliderPanel = ({ 
  controls = [], 
  title = 'Sliders', 
  spacing = 0.6, 
  orientation = 'vertical',
  width = 4,
  height = 0, // Will be calculated based on controls if 0
  color = '#444444',
  sliderLength = 2.5,
  sliderThickness = 0.12
}) => {
  // Calculate panel dimensions based on orientation and number of controls
  const calculatedHeight = orientation === 'vertical' 
    ? (height > 0 ? height : controls.length * spacing + 1) 
    : (height > 0 ? height : 2.5);
    
  const calculatedWidth = orientation === 'horizontal' 
    ? (width > 0 ? width : controls.length * spacing + 1) 
    : (width > 0 ? width : 4);

  return (
    <group>
      <Panel 
        width={calculatedWidth} 
        height={calculatedHeight} 
        title={title}
        color={color}
        depth={0.3}
      >
        {controls.map((ctrl, i) => {
          // Position sliders based on orientation
          const position = orientation === 'vertical'
            ? [0, -((i - (controls.length - 1) / 2) * spacing), 0.1]
            : [(i - (controls.length - 1) / 2) * spacing, 0, 0.1];
            
          return (
            <group key={ctrl.id || `slider-${i}`} position={position}>
              <Slider
                value={ctrl.value}
                min={ctrl.min}
                max={ctrl.max}
                onChange={ctrl.onChange}
                label={ctrl.label}
                color={ctrl.color || '#61dafb'}
                valueFormatter={ctrl.valueFormatter || (val => val.toFixed(2))}
                length={sliderLength}
                thickness={sliderThickness}
                orientation={orientation === 'vertical' ? 'horizontal' : 'vertical'}
              />
            </group>
          );
        })}
      </Panel>    </group>
  );
};

export default SliderPanel;
