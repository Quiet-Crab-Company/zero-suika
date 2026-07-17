import React from 'react';

const MASCOTS = [
  { tier: 0, name: "Mascot 1", filename: "mascot_01.webp", radius: 18, color: "#a855f7" },
  { tier: 1, name: "Mascot 2", filename: "mascot_02.webp", radius: 24, color: "#c084fc" },
  { tier: 2, name: "Mascot 3", filename: "mascot_03.webp", radius: 30, color: "#326aa5" },
  { tier: 3, name: "Mascot 4", filename: "mascot_04.webp", radius: 37, color: "#60a5fa" },
  { tier: 4, name: "Mascot 5", filename: "mascot_05.webp", radius: 44, color: "#06b6d4" },
  { tier: 5, name: "Mascot 6", filename: "mascot_06.webp", radius: 52, color: "#38bdf8" },
  { tier: 6, name: "Mascot 7", filename: "mascot_07.webp", radius: 60, color: "#eab308" },
  { tier: 7, name: "Mascot 8", filename: "mascot_08.webp", radius: 68, color: "#facc15" },
  { tier: 8, name: "Mascot 9", filename: "mascot_09.webp", radius: 76, color: "#f97316" }
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
        <span style={{ fontSize: '0.8rem', color: 'var(--neon-purple)' }}>9 TIERS</span>
      </div>
      
      <div className="mergechart-list">
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
                borderRadius: '6px',
                border: `2px solid ${m.color}`,
                boxShadow: `0 0 8px ${m.color}66`,
                overflow: 'hidden',
                background: '#1a102f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={`${import.meta.env.BASE_URL}assets/${m.filename}`} 
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
                  {m.tier === 8 ? '⚾ CROWNED CHAMP' : `Tier ${m.tier + 1}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Radius: {m.radius}px
                </div>
              </div>

              {m.tier < 8 && (
                <div className="mergechart-arrow" style={{ fontSize: '0.8rem', color: '#475569' }}>
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
