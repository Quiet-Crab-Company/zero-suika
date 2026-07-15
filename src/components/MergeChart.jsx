import React from 'react';

const MASCOTS = [
  { tier: 0, name: "Mascot 1", filename: "mascot_01.webp", radius: 16, color: "#a855f7" },
  { tier: 1, name: "Mascot 2", filename: "mascot_02.webp", radius: 22, color: "#c084fc" },
  { tier: 2, name: "Mascot 3", filename: "mascot_03.webp", radius: 28, color: "#22c55e" },
  { tier: 3, name: "Mascot 4", filename: "mascot_04.webp", radius: 35, color: "#4ade80" },
  { tier: 4, name: "Mascot 5", filename: "mascot_05.webp", radius: 42, color: "#06b6d4" },
  { tier: 5, name: "Mascot 6", filename: "mascot_06.webp", radius: 50, color: "#38bdf8" },
  { tier: 6, name: "Mascot 7", filename: "mascot_07.webp", radius: 58, color: "#eab308" },
  { tier: 7, name: "Mascot 8", filename: "mascot_08.webp", radius: 66, color: "#facc15" },
  { tier: 8, name: "Mascot 9", filename: "mascot_09.webp", radius: 74, color: "#f97316" },
  { tier: 9, name: "Mascot 10", filename: "mascot_10.webp", radius: 82, color: "#fb923c" },
  { tier: 10, name: "Mascot 11", filename: "mascot_11.webp", radius: 90, color: "#ef4444" },
  { tier: 11, name: "Mascot 12", filename: "mascot_12.webp", radius: 98, color: "#f87171" },
  { tier: 12, name: "Mascot 13", filename: "mascot_13.webp", radius: 108, color: "#ec4899" }
];

export default function MergeChart({ currentTier }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%' }}>
      <div style={{
        fontFamily: 'var(--hud)',
        fontSize: '1.25rem',
        fontWeight: 'bold',
        letterSpacing: '1px',
        borderBottom: '1px solid var(--border-neon)',
        paddingBottom: '0.75rem',
        marginBottom: '1rem',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>EVOLUTION CHAIN</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--neon-purple)' }}>13 TIERS</span>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxHeight: '480px',
        overflowY: 'auto',
        paddingRight: '0.25rem'
      }}>
        {MASCOTS.map((m) => {
          const isActive = currentTier === m.tier;
          return (
            <div 
              key={m.tier}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: isActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                border: isActive ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: isActive ? `0 0 10px ${m.color}44` : 'none',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                fontFamily: 'var(--hud)',
                fontSize: '0.9rem',
                width: '24px',
                color: isActive ? m.color : '#64748b',
                fontWeight: 'bold'
              }}>
                {String(m.tier + 1).padStart(2, '0')}
              </div>
              
              <div style={{
                position: 'relative',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: `2px solid ${m.color}`,
                boxShadow: `0 0 8px ${m.color}66`,
                overflow: 'hidden',
                background: '#1a102f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={`/assets/${m.filename}`} 
                  alt={m.name} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    // Fallback visual if image fails to load
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  color: isActive ? '#fff' : '#cbd5e1' 
                }}>
                  {m.tier === 12 ? '⚾ CROWNED CHAMP' : `Tier ${m.tier + 1}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Radius: {m.radius}px
                </div>
              </div>

              {m.tier < 12 && (
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
