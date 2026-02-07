import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import HUD from './HUD';
import Menu from './Menu';
import './Game.css';

function Game() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  
  const [gameState, setGameState] = useState({
    gameStarted: false,
    gamePaused: false,
    gameOver: false,
    autopilot: true,
    shields: 100,
    boost: 100,
    survivalTime: 0,
    evadeCount: 0,
    altitude: 0,
    velocity: 0,
    pid: { p: 0, i: 0, d: 0 }
  });

  // Initialize game engine
  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;
    
    const engine = new GameEngine(canvasRef.current, setGameState);
    engineRef.current = engine;
    engine.init();
    
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!engineRef.current) return;
      
      if (e.code === 'Escape') {
        engineRef.current.togglePause();
      }
      
      if (e.code === 'Tab' && gameState.gameStarted && !gameState.gamePaused) {
        e.preventDefault();
        engineRef.current.toggleAutopilot();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStarted, gameState.gamePaused]);

  const handleStart = useCallback((isAutopilot) => {
    engineRef.current?.start(isAutopilot);
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restart();
  }, []);

  const handleQuit = useCallback(() => {
    engineRef.current?.quit();
  }, []);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      
      {/* Menus */}
      <Menu
        gameState={gameState}
        onStart={handleStart}
        onResume={handleResume}
        onRestart={handleRestart}
        onQuit={handleQuit}
      />
      
      {/* HUD */}
      {gameState.gameStarted && !gameState.gameOver && (
        <HUD gameState={gameState} />
      )}
      
      {/* Crosshair */}
      {gameState.gameStarted && !gameState.gamePaused && !gameState.gameOver && (
        <div className="crosshair" />
      )}
      
      {/* Scanlines effect */}
      <div className="scanlines" />
    </div>
  );
}

export default Game;
