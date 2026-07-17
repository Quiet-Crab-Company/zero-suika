import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import ScoreBoard from './components/ScoreBoard';
import MergeChart from './components/MergeChart';
import { Volume2, VolumeX, ShieldAlert, Award, Star } from 'lucide-react';

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('t9suika_highscore')) || 0;
  });
  
  // Start with a random index from 0 to 4 (tiers 1 to 5)
  const [nextMascotIndex, setNextMascotIndex] = useState(() => {
    return Math.floor(Math.random() * 5);
  });
  const [currentTier, setCurrentTier] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [muted, setMuted] = useState(() => {
    return localStorage.getItem('t9suika_muted') === 'true';
  });
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Sound generator utilizing Web Audio API (completely client-side synthesized, no asset dependencies)
  const playSound = (type, tier = 0) => {
    if (muted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'merge') {
        // High frequency upward chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        const baseFreq = 160 + tier * 45;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, ctx.currentTime + 0.16);
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.16);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'drop') {
        // Short subtle high pluck
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.07);
        
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'gameover') {
        // Detuned heavy low pitch sweep
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        osc1.frequency.setValueAtTime(110, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(35, ctx.currentTime + 0.7);
        osc2.frequency.setValueAtTime(108, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(34, ctx.currentTime + 0.7);
        
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.75);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.78);
        osc2.stop(ctx.currentTime + 0.78);
      }
    } catch (e) {
      console.warn('AudioContext failed to trigger:', e);
    }
  };

  const handleMergeEvent = (tier) => {
    playSound('merge', tier);
  };

  const handleDropEvent = () => {
    playSound('drop');
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsOverflowing(false);
    playSound('gameover');
  };

  const handleRestart = () => {
    setScore(0);
    setCurrentTier(0);
    setIsGameOver(false);
    setIsOverflowing(false);
    setNextMascotIndex(Math.floor(Math.random() * 5));
    setResetTrigger(prev => prev + 1);
  };

  const toggleMute = () => {
    setMuted(prev => {
      const nextMuted = !prev;
      localStorage.setItem('t9suika_muted', String(nextMuted));
      return nextMuted;
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Screen Red Glow on Overflow */}
      {isOverflowing && <div className="screen-glow-red" />}

      {/* Top Tribe Nine Warning Tape Banner */}
      <div className={`warning-tape-container ${isOverflowing ? 'warning-tape-overflow' : ''}`}>
        <div className="warning-tape-content">
          {isOverflowing ? (
            <>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
            </>
          ) : (
            <>
              <span>TRIBE NINE</span>
              <span>EXTREME BASEBALL</span>
              <span>SYSTEM ACTIVE</span>
              <span>TRIBE NINE</span>
              <span>EXTREME BASEBALL</span>
              <span>SYSTEM ACTIVE</span>
              <span>TRIBE NINE</span>
              <span>EXTREME BASEBALL</span>
              <span>SYSTEM ACTIVE</span>
            </>
          )}
        </div>
      </div>

      {/* Main Header / HUD bar */}
      <header className="game-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '1.5rem 1rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Star color="var(--neon-purple)" fill="var(--neon-purple)" size={24} style={{ filter: 'drop-shadow(0 0 8px var(--neon-purple))' }} />
          <h1 className="game-title neon-text-purple" style={{ fontSize: '2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            TRIBE NINE
          </h1>
        </div>

        {/* Audio Mute HUD button */}
        <button 
          onClick={toggleMute}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-neon)',
            color: '#fff',
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: 'var(--hud)',
            fontSize: '0.8rem',
            letterSpacing: '1px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--neon-purple)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-neon)'}
        >
          {muted ? <VolumeX size={16} color="var(--neon-magenta)" /> : <Volume2 size={16} color="var(--neon-blue)" />}
          <span>{muted ? "AUDIO OFF" : "AUDIO ON"}</span>
        </button>
      </header>

      {/* Primary Layout Grid */}
      <main className="game-container">
        
        {/* Left Side: Score Board / High Score / Settings */}
        <section className="grid-sidebar-left" style={{ width: '100%' }}>
          <ScoreBoard 
            score={score} 
            highScore={highScore} 
            nextMascotIndex={nextMascotIndex} 
            onRestart={handleRestart}
          />
        </section>

        {/* Center: Drop Canvas Container */}
        <section className="grid-canvas-center" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'center' }}>
            <GameCanvas 
              score={score} 
              setScore={setScore}
              highScore={highScore}
              setHighScore={setHighScore}
              nextMascotIndex={nextMascotIndex}
              setNextMascotIndex={setNextMascotIndex}
              isGameOver={isGameOver}
              onGameOver={handleGameOver}
              resetTrigger={resetTrigger}
              setCurrentTier={setCurrentTier} 
              onMerge={handleMergeEvent}
              onDrop={handleDropEvent}
              setIsOverflowing={setIsOverflowing}
            />

            {/* Game Over Screen Overlay */}
            {isGameOver && (
              <div 
                className="glass-panel" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(10, 5, 20, 0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '2rem',
                  zIndex: 25,
                  animation: 'fade-in 0.4s ease-out',
                  border: '2px solid var(--neon-magenta)',
                  boxShadow: '0 0 30px rgba(236, 72, 153, 0.3)'
                }}
              >
                <ShieldAlert size={64} color="var(--neon-magenta)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 12px var(--neon-magenta))' }} />
                
                <h2 style={{
                  fontFamily: 'var(--hud)',
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: '#fff',
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '2px',
                  textShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
                }}>
                  STAGE FAILURE
                </h2>
                
                <p style={{ color: '#64748b', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
                  The box overflowed the boundary limit!
                </p>

                <div 
                  className="glass-panel-blue"
                  style={{
                    padding: '1rem 2rem',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    minWidth: '220px'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--neon-blue)', fontFamily: 'var(--hud)', letterSpacing: '1px' }}>
                    FINAL SCORE
                  </div>
                  <div style={{ fontSize: '2.2rem', fontFamily: 'var(--hud)', fontWeight: '900', color: '#fff' }}>
                    {score}
                  </div>
                </div>

                <button 
                  className="neon-btn neon-btn-blue"
                  onClick={handleRestart}
                  style={{
                    padding: '1rem 2.5rem',
                    fontSize: '1rem',
                    width: '100%',
                    maxWidth: '280px'
                  }}
                >
                  RE-INITIALIZE MATCH
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Evolution Merge Chart */}
        <section className="grid-sidebar-right" style={{ width: '100%' }}>
          <MergeChart currentTier={currentTier} />
        </section>
      </main>

      {/* Bottom Tribe Nine Reverse Tape Banner */}
      <div className={`warning-tape-container ${isOverflowing ? 'warning-tape-overflow' : 'warning-tape-blue'}`} style={{ marginTop: 'auto' }}>
        <div className="warning-tape-content">
          {isOverflowing ? (
            <>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
              <span>DANGER!</span>
              <span>CAUTION</span>
            </>
          ) : (
            <>
              <span>TRIBE NINE</span>
              <span>EXTREME BASEBALL</span>
              <span>GAME ONGOING</span>
              <span>TRIBE NINE</span>
              <span>EXTREME BASEBALL</span>
              <span>GAME ONGOING</span>
              <span>TRIBE NINE</span>
              <span>EXTREME BASEBALL</span>
              <span>GAME ONGOING</span>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
