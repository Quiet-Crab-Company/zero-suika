import React, { useState } from 'react';
import { MASCOTS } from '../config/mascots';

export default function MergeChart({ currentTier, lang }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const centerMascot = MASCOTS[8];
  const surroundingMascots = MASCOTS.slice(0, 8);

  const containerSize = 300;
  const centerCoord = containerSize / 2;
  const radius = 98;

  const isJp = lang === 'jp';

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        fontFamily: 'var(--hud)',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        letterSpacing: '1px',
        borderBottom: '1px solid var(--border-neon)',
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
        color: '#fff',
        width: '100%'
      }}>
        <span>{isJp ? '進化の輪' : 'EVOLUTION WHEEL'}</span>
      </div>

      {/* Wheel Area */}
      <div style={{
        position: 'relative',
        width: `${containerSize}px`,
        height: `${containerSize}px`
      }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {/* Circular track showing flow from tier 1 (top, index 0) clockwise */}
          <circle cx={centerCoord} cy={centerCoord} r={radius} fill="none" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="4" />
          <circle cx={centerCoord} cy={centerCoord} r={radius} fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" strokeDasharray="6,8" />
        </svg>

        {/* Center Element: Top Tier 9 */}
        {(() => {
          const isCenterActive = currentTier === 8;
          const isCenterHovered = hoveredIndex === 8;
          const centerSize = 90;

          return (
            <div
              onMouseEnter={() => setHoveredIndex(8)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'absolute',
                width: `${centerSize}px`,
                height: `${centerSize}px`,
                left: `${centerCoord - centerSize / 2}px`,
                top: `${centerCoord - centerSize / 2}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isCenterHovered ? 'scale(1.15)' : 'scale(1)',
                zIndex: 10
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/${centerMascot.filename}`}
                alt={centerMascot.name.en}
                style={{
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  filter: isCenterActive || isCenterHovered 
                    ? `drop-shadow(0 0 8px ${centerMascot.color})` 
                    : 'grayscale(80%) opacity(40%)',
                  transition: 'all 0.2s'
                }}
              />
            </div>
          );
        })()}

        {/* Surrounding Elements (Tiers 1 to 8) */}
        {surroundingMascots.map((m, index) => {
          const angle = -Math.PI / 2 + index * (Math.PI / 4); // Start at top, go clockwise
          const x = centerCoord + radius * Math.cos(angle);
          const y = centerCoord + radius * Math.sin(angle);
          const isItemActive = currentTier >= m.tier;
          const isItemCurrentlyHighlighted = currentTier === m.tier;
          const isItemHovered = hoveredIndex === index;
          const size = 48;
          const left = x - size / 2;
          const top = y - size / 2;

          return (
            <div
              key={m.tier}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}px`,
                top: `${top}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isItemHovered ? 'scale(1.2)' : (isItemCurrentlyHighlighted ? 'scale(1.1)' : 'scale(1)'),
                zIndex: 5
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/${m.filename}`}
                alt={m.name.en}
                style={{
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  filter: isItemCurrentlyHighlighted || isItemHovered
                    ? `drop-shadow(0 0 6px ${m.color})`
                    : (isItemActive ? 'none' : 'grayscale(100%) opacity(20%)'),
                  transition: 'all 0.2s'
                }}
              />
              {/* Active check dot */}
              {isItemCurrentlyHighlighted && (
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: m.color,
                  boxShadow: `0 0 6px ${m.color}`
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
