import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { createPortal } from 'react-dom';

const ZoomControls = ({ 
  minZoom = 0.5,
  maxZoom = 3,
  zoomStep = 0.2,
  pinchSensitivity = 0.01
}) => {  
  const { camera, gl } = useThree();
  const touchDistanceRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeoutRef = useRef(null);
  
  // Keep track of current zoom level
  const currentZoom = useRef(1);
    // Create a DOM element for the portal
  const [container] = useState(() => {
    // First, remove any existing container to prevent duplicates
    const existingContainer = document.getElementById('zoom-controls-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const div = document.createElement('div');
    div.id = 'zoom-controls-container';
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.zIndex = '10000'; // Very high z-index to be on top
    div.style.pointerEvents = 'none';
    div.style.display = 'block';
    document.body.appendChild(div);
    
    // Add styles
    const styleId = 'zoom-controls-style';
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes zoomFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 0.9; transform: translateY(0); }
        }
        
        #zoom-controls-container {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          z-index: 10000 !important;
          pointer-events: none;
          display: block !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return div;
  });
  
  // Handle camera zoom with limits
  const handleZoom = (delta) => {
    const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom.current + delta));
    if (newZoom !== currentZoom.current) {
      camera.zoom = newZoom;
      camera.updateProjectionMatrix();
      currentZoom.current = newZoom;
      
      // Update zoom level state and show indicator
      setZoomLevel(Math.round(newZoom * 100) / 100);
      setShowZoomIndicator(true);
      
      // Hide zoom indicator after 1.5 seconds
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
      zoomIndicatorTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 1500);
      
      return true;
    }
    return false;
  };
    // Clean up timeout and portal container on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }

      // We keep the container in DOM to prevent flickering if component re-renders
      // If you want to fully clean up, uncomment the following:
      // const controlsContainer = document.getElementById('zoom-controls-container');
      // if (controlsContainer) {
      //   controlsContainer.remove();
      // }
    };
  }, []);
  
  useEffect(() => {
    // Set initial zoom level
    camera.zoom = currentZoom.current;
    camera.updateProjectionMatrix();
    
    // Handle wheel events for zooming
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * zoomStep;
      handleZoom(delta);
    };
    
    // Touch events for pinch zooming
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        touchDistanceRef.current = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const newDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        const delta = (newDistance - touchDistanceRef.current) * pinchSensitivity;
        if (handleZoom(delta)) {
          touchDistanceRef.current = newDistance;
        }
      }
    };
    
    const handleTouchEnd = () => {
      touchDistanceRef.current = null;
    };
    
    // Add event listeners
    const canvas = gl.domElement;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      // Remove event listeners
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [camera, gl, minZoom, maxZoom, zoomStep, pinchSensitivity]);  // Define the controls that will be rendered via portal
  const controls = (
    <>
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          pointerEvents: 'auto',
          zIndex: 10000
        }}
      >
        <button 
          onClick={() => handleZoom(zoomStep)}
          style={{
            width: '45px',
            height: '45px',
            fontSize: '24px',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            color: '#8bc34a',
            border: '1px solid #444',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.15s ease',
            outline: 'none',
            pointerEvents: 'auto'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          onClick={() => handleZoom(-zoomStep)}
          style={{
            width: '45px',
            height: '45px',
            fontSize: '28px',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            color: '#8bc34a',
            border: '1px solid #444',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.15s ease',
            outline: 'none',
            pointerEvents: 'auto'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
      
      {/* Zoom level indicator */}
      {showZoomIndicator && (
        <div style={{
            position: 'absolute',
            bottom: '110px',
            right: '0',
            backgroundColor: 'rgba(30, 30, 30, 0.8)',
            color: '#8bc34a',
            padding: '8px 12px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: '0.9',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            animation: 'zoomFadeIn 0.2s ease-out',
            zIndex: 10000,
            whiteSpace: 'nowrap'
          }}
        >
          {Math.round(zoomLevel * 100)}%
        </div>
      )}
    </>
  );
  // Use React portals to render the controls directly in the body AND return an empty group for Three.js
  // We need to return both the portal and the group, otherwise the portal won't render
  
  // Add debug log
  useEffect(() => {
    console.log("ZoomControls mounted, container:", container);
  }, [container]);
  
  return (
    <>
      {createPortal(controls, container)}
      <group />
    </>
  );
};

export default ZoomControls;