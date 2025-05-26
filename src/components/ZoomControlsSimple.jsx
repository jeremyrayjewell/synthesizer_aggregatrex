import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';

const ZoomControlsSimple = ({ 
  minZoom = 0.5,
  maxZoom = 3,
  zoomStep = 0.2,
  pinchSensitivity = 0.01
}) => {  
  const { camera, gl } = useThree();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeoutRef = useRef(null);
  const currentZoom = useRef(1);
    // Handle camera zoom with limits
  const handleZoom = (delta) => {
    const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom.current + delta));
    if (newZoom !== currentZoom.current) {
      camera.zoom = newZoom;
      camera.updateProjectionMatrix();
      currentZoom.current = newZoom;
      setZoomLevel(Math.round(newZoom * 100) / 100);
      
      // Show zoom indicator and set timeout to hide it
      setShowZoomIndicator(true);
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
    // Create and add the zoom indicator element
  useEffect(() => {
    // Add a style for the zoom indicator animation
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
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up timeout when component unmounts
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, []);
  
  // Create and update zoom indicator based on state
  useEffect(() => {
    let indicatorElement = document.getElementById('zoom-indicator');
    
    if (showZoomIndicator) {
      if (!indicatorElement) {
        indicatorElement = document.createElement('div');
        indicatorElement.id = 'zoom-indicator';
        document.body.appendChild(indicatorElement);
      }
      
      indicatorElement.style.position = 'fixed';
      indicatorElement.style.bottom = '110px';
      indicatorElement.style.right = '20px';
      indicatorElement.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
      indicatorElement.style.color = '#8bc34a';
      indicatorElement.style.padding = '8px 12px';
      indicatorElement.style.borderRadius = '16px';
      indicatorElement.style.fontSize = '14px';
      indicatorElement.style.fontWeight = 'bold';
      indicatorElement.style.opacity = '0.9';
      indicatorElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      indicatorElement.style.animation = 'zoomFadeIn 0.2s ease-out';
      indicatorElement.style.zIndex = '10000';
      
      indicatorElement.textContent = `${Math.round(zoomLevel * 100)}%`;
      indicatorElement.style.display = 'block';
    } else if (indicatorElement) {
      indicatorElement.style.display = 'none';
    }
    
    return () => {
      // Cleanup function not removing the element to prevent flicker on re-renders
    };
  }, [showZoomIndicator, zoomLevel]);
    useEffect(() => {
    // Add buttons directly to DOM
    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = '+';
    zoomInBtn.style.position = 'fixed';
    zoomInBtn.style.bottom = '80px';
    zoomInBtn.style.right = '20px';
    zoomInBtn.style.width = '45px';
    zoomInBtn.style.height = '45px';
    zoomInBtn.style.fontSize = '24px';
    zoomInBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
    zoomInBtn.style.color = '#8bc34a';
    zoomInBtn.style.border = '1px solid #444';
    zoomInBtn.style.borderRadius = '50%';
    zoomInBtn.style.cursor = 'pointer';
    zoomInBtn.style.zIndex = '10000';
    zoomInBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)'; // Add shadow for better visibility
    zoomInBtn.style.transition = 'all 0.15s ease';
    
    // Add hover effects
    zoomInBtn.onmouseover = () => {
      zoomInBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
      zoomInBtn.style.transform = 'scale(1.05)';
    };
    zoomInBtn.onmouseout = () => {
      zoomInBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
      zoomInBtn.style.transform = 'scale(1)';
    };
    
    zoomInBtn.onclick = () => handleZoom(zoomStep);
    document.body.appendChild(zoomInBtn);
    
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = '−';
    zoomOutBtn.style.position = 'fixed';
    zoomOutBtn.style.bottom = '20px';
    zoomOutBtn.style.right = '20px';
    zoomOutBtn.style.width = '45px';
    zoomOutBtn.style.height = '45px';
    zoomOutBtn.style.fontSize = '24px';
    zoomOutBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
    zoomOutBtn.style.color = '#8bc34a';
    zoomOutBtn.style.border = '1px solid #444';
    zoomOutBtn.style.borderRadius = '50%';    zoomOutBtn.style.cursor = 'pointer';
    zoomOutBtn.style.zIndex = '10000';
    zoomOutBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)'; // Add shadow for better visibility
    zoomOutBtn.style.transition = 'all 0.15s ease';
    
    // Add hover effects
    zoomOutBtn.onmouseover = () => {
      zoomOutBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
      zoomOutBtn.style.transform = 'scale(1.05)';
    };
    zoomOutBtn.onmouseout = () => {
      zoomOutBtn.style.backgroundColor = 'rgba(30, 30, 30, 0.8)';
      zoomOutBtn.style.transform = 'scale(1)';
    };
    
    zoomOutBtn.onclick = () => handleZoom(-zoomStep);
    document.body.appendChild(zoomOutBtn);
    
    // Handle wheel events for zooming
    const handleWheel = (e) => {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * zoomStep;
      handleZoom(delta);
    };
    
    // Touch events for pinch zooming
    const touchDistanceRef = { current: null };
    
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
        e.preventDefault(); // Prevent scrolling during pinch
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
    canvas.addEventListener('wheel', handleWheel, { passive: false });    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      // Remove event listeners and DOM elements
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      zoomInBtn.remove();
      zoomOutBtn.remove();
      
      // Clean up zoom indicator
      const indicator = document.getElementById('zoom-indicator');
      if (indicator) indicator.remove();
      
      // Clear any pending timeouts
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, [camera, gl, minZoom, maxZoom, zoomStep]);
  
  // Return empty group in the scene
  return null;
};

export default ZoomControlsSimple;
