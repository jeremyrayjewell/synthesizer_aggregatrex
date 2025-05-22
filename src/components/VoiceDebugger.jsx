import React, { useState, useEffect } from 'react';
import voiceMonitor from '../utils/voiceMonitor';

const VoiceDebugger = () => {
  const [stats, setStats] = useState(voiceMonitor.getStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update stats every second
    const interval = setInterval(() => {
      setStats(voiceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate how full the voice capacity is (as a percentage)
  const voiceCapacityPercent = Math.min(100, Math.round((stats.currentVoiceCount / 32) * 100));
  
  // Determine color based on usage
  const getBarColor = (percent) => {
    if (percent < 50) return '#4CAF50'; // Green
    if (percent < 75) return '#FFC107'; // Yellow/Orange
    return '#F44336'; // Red
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        Show Voice Monitor
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: '0' }}>Voice Monitor</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <div style={{ marginBottom: '5px' }}>
          Voice Usage: {stats.currentVoiceCount} / 32 ({voiceCapacityPercent}%)
        </div>
        <div style={{ 
          width: '100%', 
          height: '20px', 
          backgroundColor: '#555',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${voiceCapacityPercent}%`, 
            height: '100%', 
            backgroundColor: getBarColor(voiceCapacityPercent),
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
      
      <div style={{ fontSize: '12px' }}>
        <div>Max Voices Ever: {stats.maxVoicesEver}</div>
        <div>Voice Steals: {stats.voiceSteals}</div>
        <div>Voice Releases: {stats.voiceReleases}</div>
        <div>Voice Creations: {stats.voiceCreations}</div>
        <div>Emergency Cleanups: {stats.emergencyCleanups}</div>
        <div>Last Polyphony Choke: {stats.lastPolyphonyChoke ? 
          new Date(stats.lastPolyphonyChoke).toLocaleTimeString() : 'None'}
        </div>
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => voiceMonitor.resetStats()}
          style={{
            background: '#2196F3',
            border: 'none',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset Stats
        </button>
        <button 
          onClick={() => {
            // Trigger all notes off on any synth instances
            const event = new CustomEvent('synth-panic');
            window.dispatchEvent(event);
          }}
          style={{
            background: '#F44336',
            border: 'none',
            color: 'white',
            padding: '3px 8px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          PANIC
        </button>
      </div>
    </div>
  );
};

export default VoiceDebugger;
