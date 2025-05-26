import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * CameraAnimationIndicator - Shows a small indicator when the camera animation is enabled/disabled
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.enabled - Whether camera animation is enabled
 */
const CameraAnimationIndicator = ({ enabled }) => {
  const [visible, setVisible] = useState(false);
  
  // Show the indicator briefly when the enabled state changes
  useEffect(() => {
    setVisible(true);
    const timeout = setTimeout(() => {
      setVisible(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [enabled]);
  
  // Create a DOM element for the indicator
  const containerEl = document.getElementById('camera-animation-indicator') || (() => {
    const div = document.createElement('div');
    div.id = 'camera-animation-indicator';
    document.body.appendChild(div);
    return div;
  })();
  
  // Don't render anything if not visible
  if (!visible) return null;
  
  // Create the indicator UI
  const indicator = (
    <div
      style={{
        position: 'fixed',
        bottom: '150px',
        right: '20px',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        color: enabled ? '#8bc34a' : '#ff5252',
        padding: '8px 12px',
        borderRadius: '16px',
        fontSize: '14px',
        fontWeight: 'bold',
        opacity: '0.9',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.2s ease-out, fadeOut 0.5s ease-in 1.5s forwards',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none'
      }}
    >
      <span style={{ 
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: enabled ? '#8bc34a' : '#ff5252'
      }}/>
      Camera Motion {enabled ? 'Enabled' : 'Disabled'}
    </div>
  );
  
  return createPortal(indicator, containerEl);
};

export default CameraAnimationIndicator;
