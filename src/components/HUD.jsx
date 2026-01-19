import React from 'react';
import './HUD.css';

function HUD({ gameState }) {
  const {
    autopilot,
    shields,
    boost,
    survivalTime,
    evadeCount,
    altitude,
    velocity,
    pid
  } = gameState;

  return (
    <>
      {/* Top Left - Status */}
      <div className="hud hud-top-left">
        <h1 className="hud-title">UAP-51</h1>
        <div className="hud-status">AUTONOMOUS FLIGHT SYSTEM</div>
        <div className="hud-status">
          SHIELDS: <span style={{ 
            color: shields < 30 ? '#ff0044' : shields < 60 ? '#ffaa00' : '#00ff88' 
          }}>
            {Math.round(shields)}%
          </span>
        </div>
        
        <div className={`mode-badge ${autopilot ? 'auto' : 'manual'}`}>
          {autopilot ? 'AUTOPILOT' : 'MANUAL'}
        </div>
        
        <div className="hud-score">
          TIME: {Math.floor(survivalTime)}s
        </div>
        
        {/* Boost Bar */}
        <div className="bar-container">
          <div className="bar-label">BOOST</div>
          <div className="bar-bg">
            <div 
              className="bar-fill boost" 
              style={{ width: `${boost}%` }}
            />
          </div>
        </div>
        
        {/* PID Panel (only in autopilot) */}
        {autopilot && (
          <div className="pid-panel">
            <div className="pid-title">PID EVASION SYSTEM</div>
            <div className="pid-row">
              <span className="pid-label">P</span>
              <div className="pid-bar-bg">
                <div className="pid-bar" style={{ width: `${Math.min(100, pid.p * 2)}%` }} />
              </div>
            </div>
            <div className="pid-row">
              <span className="pid-label">I</span>
              <div className="pid-bar-bg">
                <div className="pid-bar" style={{ width: `${Math.min(100, pid.i * 5)}%` }} />
              </div>
            </div>
            <div className="pid-row">
              <span className="pid-label">D</span>
              <div className="pid-bar-bg">
                <div className="pid-bar" style={{ width: `${Math.min(100, pid.d * 3)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Top Right - Telemetry */}
      <div className="hud hud-top-right">
        <div className="telemetry-row">
          <span className="telemetry-label">ALT</span>
          <span className="telemetry-value">{altitude.toFixed(1)}m</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">VEL</span>
          <span className="telemetry-value">{velocity.toFixed(1)}m/s</span>
        </div>
        <div className="telemetry-row">
          <span className="telemetry-label">EVADES</span>
          <span className="telemetry-value">{evadeCount}</span>
        </div>
      </div>
      
      {/* Bottom Left - Controls */}
      <div className="hud hud-bottom-left">
        <div className="controls-title">CONTROLS</div>
        <div className="control-row">
          <Key>WASD</Key> MOVE
        </div>
        <div className="control-row">
          <Key>SPACE</Key> UP <Key>SHIFT</Key> DOWN
        </div>
        <div className="control-row">
          <Key>E</Key> BOOST <Key>TAB</Key> AUTO
        </div>
        <div className="control-row">
          <Key>ESC</Key> PAUSE
        </div>
      </div>
    </>
  );
}

function Key({ children }) {
  return <span className="key">{children}</span>;
}

export default HUD;
