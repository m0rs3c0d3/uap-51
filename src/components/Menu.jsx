import React from 'react';
import './Menu.css';

function Menu({ gameState, onStart, onResume, onRestart, onQuit }) {
  const { gameStarted, gamePaused, gameOver, survivalTime, evadeCount } = gameState;

  // Start Menu
  if (!gameStarted) {
    return (
      <div className="menu-overlay">
        <h1 className="menu-title">UAP-51</h1>
        <p className="menu-subtitle">AUTONOMOUS FLIGHT SIMULATOR</p>
        
        <button className="menu-btn auto" onClick={() => onStart(true)}>
          🤖 AUTOPILOT DEMO
        </button>
        <button className="menu-btn" onClick={() => onStart(false)}>
          🎮 MANUAL CONTROL
        </button>
        
        <div className="menu-info">
          Watch the UAP autonomously evade alien lasers using PID control<br />
          Or take manual control and fly through the neon city<br /><br />
          Press <strong>TAB</strong> to toggle modes • <strong>ESC</strong> to pause
        </div>
      </div>
    );
  }

  // Pause Menu
  if (gamePaused && !gameOver) {
    return (
      <div className="menu-overlay">
        <h1 className="menu-title pause">PAUSED</h1>
        
        <button className="menu-btn" onClick={onResume}>
          RESUME
        </button>
        <button className="menu-btn" onClick={onRestart}>
          RESTART
        </button>
        <button className="menu-btn quit" onClick={onQuit}>
          QUIT
        </button>
        
        <p className="menu-hint">Press ESC to resume</p>
      </div>
    );
  }

  // Game Over
  if (gameOver) {
    return (
      <div className="menu-overlay">
        <h1 className="menu-title gameover">GAME OVER</h1>
        
        <div className="final-score">
          SURVIVED: {Math.floor(survivalTime)}s<br />
          EVADES: {evadeCount}
        </div>
        
        <button className="menu-btn" onClick={onRestart}>
          TRY AGAIN
        </button>
        <button className="menu-btn quit" onClick={onQuit}>
          QUIT
        </button>
      </div>
    );
  }

  return null;
}

export default Menu;
