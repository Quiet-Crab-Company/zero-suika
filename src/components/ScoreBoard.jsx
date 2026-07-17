import React from 'react';
import { RotateCcw, Trophy, Eye } from 'lucide-react';
import { MASCOTS } from '../config/mascots';

export function ScorePanel({ score, highScore, lang }) {
  const isJp = lang === 'jp';
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--hud)', fontSize: '0.9rem', color: '#ffffff', letterSpacing: '2px', marginBottom: '0.25rem' }}>
        {isJp ? 'スコア' : 'SCORE'}
      </div>
      <div style={{ fontFamily: 'var(--hud)', fontSize: '3rem', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(168, 85, 247, 0.6)', margin: '0.25rem 0' }}>
        {score}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
        <Trophy size={16} color="var(--neon-blue)" />
        <span style={{ fontSize: '0.85rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isJp ? 'ハイスコア:' : 'High Score:'}
        </span>
        <span style={{ fontFamily: 'var(--hud)', fontWeight: 'bold', color: '#ffffff' }}>{highScore}</span>
      </div>
    </div>
  );
}

export function UpcomingDrop({ nextMascotIndex, lang }) {
  const nextMascot = MASCOTS[nextMascotIndex] || MASCOTS[0];
  const isJp = lang === 'jp';
  return (
    <div className="glass-panel-blue" style={{ padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ 
        fontFamily: 'var(--hud)', 
        fontSize: '0.85rem', 
        color: '#ec4899', 
        letterSpacing: '2px', 
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <Eye size={14} />
        <span>{isJp ? '次のドロップ' : 'UPCOMING DROP'}</span>
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
          marginBottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scale-pulse 2s infinite alternate ease-in-out'
        }}>
          <img 
            src={`${import.meta.env.BASE_URL}assets/${nextMascot.filename}`} 
            alt={nextMascot.name.en} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function RestartButton({ onRestart, lang }) {
  const isJp = lang === 'jp';
  return (
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
      <span>{isJp ? 'ゲームリスタート' : 'RESTART GAME'}</span>
    </button>
  );
}

export function HowToPlay({ lang }) {
  const isJp = lang === 'jp';
  return (
    <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.85rem', color: '#ffffff', textAlign: 'left', lineHeight: '1.4' }}>
      <div style={{ fontFamily: 'var(--hud)', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        {isJp ? 'プレイ方法:' : 'HOW TO PLAY:'}
      </div>
      <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {isJp ? (
          <>
            <li>ボックスの上で指やカーソルを左右に動かして狙います。</li>
            <li>クリックまたはタップしてマスコットを落とします。</li>
            <li>同じマスコットを2つ合わせると、より大きなマスコットに進化します！</li>
            <li>上部の警告ラインを2秒以上超えないようにしてください。</li>
          </>
        ) : (
          <>
            <li>Move cursor/finger horizontally over the box to aim.</li>
            <li>Click or tap to drop the mascot.</li>
            <li>Match two identical mascots to merge them into a larger one!</li>
            <li>Avoid crossing the upper warning line for more than 2 seconds.</li>
          </>
        )}
      </ul>
    </div>
  );
}

export function DailyScores({ dailyScores, lang }) {
  const isJp = lang === 'jp';
  return (
    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--hud)',
        fontSize: '0.85rem',
        color: '#ffffff',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '0.5rem'
      }}>
        {isJp ? '本日のトップ3' : 'DAILY TOP 3'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {dailyScores.map((s, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            fontFamily: 'var(--hud)',
            color: index === 0 ? 'var(--neon-blue)' : '#ffffff',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '0.35rem 1rem',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.03)'
          }}>
            <span style={{ opacity: 0.6 }}>#{index + 1}</span>
            <span style={{ fontWeight: 'bold' }}>{s}</span>
          </div>
        ))}
        {dailyScores.length === 0 && (
          <div style={{
            fontSize: '0.85rem',
            color: '#64748b',
            textAlign: 'center',
            fontStyle: 'italic',
            padding: '0.5rem'
          }}>
            {isJp ? '本日まだ記録がありません' : 'No scores logged today'}
          </div>
        )}
      </div>
    </div>
  );
}
