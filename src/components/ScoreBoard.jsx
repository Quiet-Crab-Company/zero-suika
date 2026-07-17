import React from 'react';
import { RotateCcw, Trophy, ArrowRight, Eye } from 'lucide-react';

const MASCOTS = [
  { tier: 0, name: "Mascot 1", filename: "mascot_01.webp", color: "#a855f7" },
  { tier: 1, name: "Mascot 2", filename: "mascot_02.webp", color: "#c084fc" },
  { tier: 2, name: "Mascot 3", filename: "mascot_03.webp", color: "#326aa5" },
  { tier: 3, name: "Mascot 4", filename: "mascot_04.webp", color: "#60a5fa" },
  { tier: 4, name: "Mascot 5", filename: "mascot_05.webp", color: "#06b6d4" },
  { tier: 5, name: "Mascot 6", filename: "mascot_06.webp", color: "#38bdf8" },
  { tier: 6, name: "Mascot 7", filename: "mascot_07.webp", color: "#eab308" },
  { tier: 7, name: "Mascot 8", filename: "mascot_08.webp", color: "#facc15" },
  { tier: 8, name: "Mascot 9", filename: "mascot_09.webp", color: "#f97316" }
];

export default function ScoreBoard({ score, highScore, nextMascotIndex, onRestart }) {
  const nextMascot = MASCOTS[nextMascotIndex] || MASCOTS[0];

  return (
    <div className="scoreboard-container">
      {/* Score Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--hud)', fontSize: '0.9rem', color: 'var(--neon-purple)', letterSpacing: '2px', marginBottom: '0.25rem' }}>
          SCORE
        </div>
        <div style={{ fontFamily: 'var(--hud)', fontSize: '3rem', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(168, 85, 247, 0.6)', margin: '0.25rem 0' }}>
          {score}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
          <Trophy size={16} color="var(--neon-blue)" />
          <span style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>High Score:</span>
          <span style={{ fontFamily: 'var(--hud)', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{highScore}</span>
        </div>
      </div>

      {/* Next Preview Panel */}
      <div className="glass-panel-blue" style={{ padding: '1.25rem', textAlign: 'center' }}>
        <div style={{ 
          fontFamily: 'var(--hud)', 
          fontSize: '0.85rem', 
          color: 'var(--neon-blue)', 
          letterSpacing: '2px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Eye size={14} />
          <span>UPCOMING DROP</span>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 0'
        }}>
          <div style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '8px',
            border: `3px solid ${nextMascot.color}`,
            boxShadow: `0 0 15px ${nextMascot.color}88`,
            overflow: 'hidden',
            background: '#1a102f',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite alternate'
          }}>
            <img 
              src={`${import.meta.env.BASE_URL}assets/${nextMascot.filename}`} 
              alt={nextMascot.name} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
          <div style={{ 
            fontFamily: 'var(--hud)', 
            fontWeight: '700', 
            fontSize: '0.9rem',
            color: '#fff',
            textTransform: 'uppercase'
          }}>
            Tier {nextMascotIndex + 1}
          </div>
        </div>
      </div>

      {/* Restart Button */}
      <button 
        className="neon-btn" 
        onClick={onRestart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          width: '100%',
          padding: '1rem'
        }}
      >
        <RotateCcw size={18} />
        <span>RESTART SESSION</span>
      </button>

      {/* Game instructions */}
      <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'left', lineHeight: '1.4' }}>
        <div style={{ fontFamily: 'var(--hud)', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', fontSize: '0.9rem' }}>HOW TO PLAY:</div>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>Move cursor/finger horizontally over the box to aim.</li>
          <li>Click or tap to drop the mascot.</li>
          <li>Match two identical mascots to merge them into a larger one!</li>
          <li>Avoid crossing the upper warning line for more than 2 seconds.</li>
        </ul>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.96); box-shadow: 0 0 10px rgba(50, 106, 165, 0.4); }
          100% { transform: scale(1.04); box-shadow: 0 0 20px rgba(50, 106, 165, 0.8); }
        }
      `}</style>
    </div>
  );
}
