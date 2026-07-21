import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { ScorePanel, UpcomingDrop, RestartButton, HowToPlay, DailyScores } from './components/ScoreBoard';
import MergeChart from './components/MergeChart';
import { Volume2, VolumeX, ShieldAlert, Award } from 'lucide-react';
import { MASCOTS } from './config/mascots';

const SAVED_GAME_KEY = 't9suika_saved_game';

const getInitialSavedGame = () => {
  try {
    const saved = localStorage.getItem(SAVED_GAME_KEY);
    console.log('[T9Suika] getInitialSavedGame raw saved game from localStorage:', saved);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !parsed.isGameOver && Array.isArray(parsed.bodies)) {
        console.log('[T9Suika] getInitialSavedGame valid parsed game:', parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[T9Suika] Failed to parse saved game state:', e);
  }
  return null;
};

export default function App() {
  const [initialSavedGame] = useState(getInitialSavedGame);
  const [score, setScore] = useState(() => initialSavedGame?.score ?? 0);
  const scoreRef = useRef(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('t9suika_highscore')) || 0;
  });

  const [nextMascotIndex, setNextMascotIndex] = useState(() => {
    return (initialSavedGame && typeof initialSavedGame.nextMascotIndex === 'number')
      ? initialSavedGame.nextMascotIndex
      : Math.floor(Math.random() * 5);
  });
  const [currentTier, setCurrentTier] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [muted, setMuted] = useState(() => {
    return localStorage.getItem('t9suika_muted') === 'true';
  });
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('t9suika_lang') || 'en';
  });
  const [dailyScores, setDailyScores] = useState(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const savedData = localStorage.getItem('t9suika_daily_scores');
      if (savedData) {
        const { date, scores } = JSON.parse(savedData);
        if (date === todayStr) {
          return scores.slice(0, 3);
        }
      }
    } catch (e) {
      console.warn('Failed to parse daily scores:', e);
    }
    return [];
  });
  const [loadedCount, setLoadedCount] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState({});
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    let count = 0;
    const imgs = {};
    MASCOTS.forEach((m, index) => {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}assets/${m.filename}`;
      img.onload = () => {
        imgs[index] = img;
        count++;
        setLoadedCount(count);
        if (count === MASCOTS.length) {
          setPreloadedImages(imgs);
          setIsAssetsLoaded(true);
        }
      };
      img.onerror = () => {
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(64, 64, 55, 0, Math.PI * 2);
        ctx.fill();
        
        const fallbackImg = new Image();
        fallbackImg.src = canvas.toDataURL();
        fallbackImg.onload = () => {
          imgs[index] = fallbackImg;
          count++;
          setLoadedCount(count);
          if (count === MASCOTS.length) {
            setPreloadedImages(imgs);
            setIsAssetsLoaded(true);
          }
        };
      };
    });
  }, []);

  const bgmRef = useRef(null);
  const sfxContextRef = useRef(null);
  const gameOverAudioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}すやすやタイム.mp3`);
    audio.loop = true;
    audio.volume = 0.25; 
    bgmRef.current = audio;

    const goAudio = new Audio(`${import.meta.env.BASE_URL}game-over.mp3`);
    goAudio.volume = 0.35;
    gameOverAudioRef.current = goAudio;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sfxContextRef.current = new AudioContextClass();
    }

    return () => {
      audio.pause();
      audio.src = '';
      bgmRef.current = null;

      goAudio.src = '';
      gameOverAudioRef.current = null;

      if (sfxContextRef.current && sfxContextRef.current.state !== 'closed') {
        sfxContextRef.current.close();
        sfxContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!bgmRef.current || !gameStarted) return;

    let isSubscribed = true;

    const startAudio = () => {
      if (isSubscribed && bgmRef.current && !muted) {
        bgmRef.current.play().catch(e => console.log('BGM play failed:', e));
      }
      window.removeEventListener('click', startAudio);
      window.removeEventListener('touchstart', startAudio);
    };

    if (muted) {
      bgmRef.current.pause();
    } else {
      bgmRef.current.play().catch(() => {
        
        window.addEventListener('click', startAudio);
        window.addEventListener('touchstart', startAudio);
      });
    }

    return () => {
      isSubscribed = false;
      window.removeEventListener('click', startAudio);
      window.removeEventListener('touchstart', startAudio);
    };
  }, [muted, gameStarted]);

  const playSound = (type, tier = 0) => {
    if (muted) return;
    try {
      if (type === 'gameover') {
        const goAudio = gameOverAudioRef.current;
        if (goAudio) {
          goAudio.currentTime = 0;
          goAudio.play().catch(e => console.log('Game Over SFX play failed:', e));
        }
        return;
      }

      const ctx = sfxContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'merge') {
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

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsOverflowing(false);
    localStorage.removeItem(SAVED_GAME_KEY);
    playSound('gameover');

    const currentScore = scoreRef.current;
    if (currentScore > 0) {
      setDailyScores(prev => {
        const todayStr = new Date().toISOString().split('T')[0];
        const newScores = [...prev, currentScore];
        newScores.sort((a, b) => b - a);
        const top3 = newScores.slice(0, 3);
        localStorage.setItem('t9suika_daily_scores', JSON.stringify({
          date: todayStr,
          scores: top3
        }));
        return top3;
      });
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(SAVED_GAME_KEY);
    const currentScore = scoreRef.current;
    if (currentScore > 0 && !isGameOver) {
      setDailyScores(prev => {
        const todayStr = new Date().toISOString().split('T')[0];
        const newScores = [...prev, currentScore];
        newScores.sort((a, b) => b - a);
        const top3 = newScores.slice(0, 3);
        localStorage.setItem('t9suika_daily_scores', JSON.stringify({
          date: todayStr,
          scores: top3
        }));
        return top3;
      });
    }
    setScore(0);
    setCurrentTier(0);
    setIsGameOver(false);
    setIsOverflowing(false);
    setNextMascotIndex(Math.floor(Math.random() * 5));
    setResetTrigger(prev => prev + 1);
  };

  const toggleLang = () => {
    setLang(prev => {
      const nextLang = prev === 'en' ? 'jp' : 'en';
      localStorage.setItem('t9suika_lang', nextLang);
      return nextLang;
    });
  };

  const toggleMute = () => {
    setMuted(prev => {
      const nextMuted = !prev;
      localStorage.setItem('t9suika_muted', String(nextMuted));
      return nextMuted;
    });
  };

  if (!gameStarted) {
    const isJp = lang === 'jp';
    const progressPercent = Math.round((loadedCount / MASCOTS.length) * 100);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at center, #0f0728 0%, #05020a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '2rem'
      }}>
        
        <div 
          className="glass-panel" 
          style={{
            padding: '3rem 2rem',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.1)'
          }}
        >
          
          <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '2rem' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100px',
              height: '100px',
              border: '4px solid rgba(168, 85, 247, 0.1)',
              borderTop: '4px solid var(--neon-purple)',
              borderRadius: '50%',
              animation: 'spin 1.5s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '80px',
              height: '80px',
              border: '4px solid rgba(236, 72, 153, 0.05)',
              borderBottom: '4px solid var(--neon-magenta)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite reverse'
            }} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--hud)',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {progressPercent}%
            </div>
          </div>

          <h1 style={{
            fontFamily: 'var(--hud)',
            fontSize: '1.8rem',
            fontWeight: '900',
            letterSpacing: '3px',
            color: '#fff',
            margin: '0 0 0.5rem 0',
            textShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
          }}>
            {isJp ? 'ゼロのスイカ' : 'Zero no Suika'}
          </h1>
          <p style={{
            fontFamily: 'var(--hud)',
            fontSize: '0.8rem',
            letterSpacing: '2px',
            color: 'var(--neon-blue)',
            margin: '0 0 2rem 0',
            textTransform: 'uppercase'
          }}>
            {isJp ? 'トライブナイン ファンメイド スイカゲーム' : 'Tribe Nine fanmade Suika game'}
          </p>

          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '2.5rem' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--neon-purple), var(--neon-magenta))',
              transition: 'width 0.2s ease-out',
              boxShadow: '0 0 8px var(--neon-purple)'
            }} />
          </div>

          {isAssetsLoaded ? (
            <button
              className="neon-btn"
              onClick={() => {
                setGameStarted(true);
                if (!muted && bgmRef.current) {
                  bgmRef.current.play().catch(err => console.warn('BGM play failed:', err));
                }
              }}
              style={{
                padding: '1rem 3rem',
                fontSize: '1.1rem',
                width: '100%',
                maxWidth: '240px',
                animation: 'pulse 1.5s infinite alternate ease-in-out'
              }}
            >
              {isJp ? (initialSavedGame ? 'ゲーム再開' : 'ゲーム開始') : (initialSavedGame ? 'RESUME GAME' : 'START GAME')}
            </button>
          ) : (
            <div style={{
              fontFamily: 'var(--hud)',
              fontSize: '0.85rem',
              color: '#64748b',
              letterSpacing: '1px'
            }}>
              {isJp ? 'システムアセットをロード中...' : 'LOADING ASSETS...'}
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { transform: scale(0.98); box-shadow: 0 0 10px rgba(168, 85, 247, 0.2); }
            100% { transform: scale(1.04); box-shadow: 0 0 25px rgba(168, 85, 247, 0.5); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {isOverflowing && <div className="screen-glow-red" />}

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

      <header className="game-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="game-title neon-text-purple" style={{ fontSize: '2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {lang === 'jp' ? 'ゼロのスイカ' : 'Zero no Suika'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-neon)',
            borderRadius: '20px',
            padding: '2px',
            position: 'relative',
            cursor: 'pointer',
            userSelect: 'none',
            width: '76px',
            height: '32px'
          }} onClick={toggleLang}>
            
            <div style={{
              position: 'absolute',
              top: '1px',
              bottom: '1px',
              left: lang === 'en' ? '1px' : '39px',
              width: '34px',
              borderRadius: '18px',
              background: 'var(--neon-purple)',
              boxShadow: '0 0 8px var(--neon-purple)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1
            }} />

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--hud)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: lang === 'en' ? '#fff' : '#64748b',
              zIndex: 2,
              transition: 'color 0.2s'
            }}>
              EN
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--hud)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: lang === 'jp' ? '#fff' : '#64748b',
              zIndex: 2,
              transition: 'color 0.2s'
            }}>
              JP
            </div>
          </div>

          <button
            onClick={toggleMute}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-neon)',
              color: '#fff',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--neon-purple)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-neon)'}
            title={muted ? (lang === 'jp' ? "音声 オン" : "Audio On") : (lang === 'jp' ? "音声 オフ" : "Audio Off")}
          >
            {muted ? <VolumeX size={18} color="var(--neon-magenta)" /> : <Volume2 size={18} color="var(--neon-blue)" />}
          </button>
        </div>
      </header>

      <main className="game-container">

        <section className="grid-sidebar-left" style={{ width: '100%' }}>
          <div className="scoreboard-container">
            <div className="desktop-score-panel">
              <ScorePanel score={score} highScore={highScore} lang={lang} />
            </div>
            <DailyScores dailyScores={dailyScores} lang={lang} />
            <HowToPlay lang={lang} />
            <RestartButton onRestart={handleRestart} lang={lang} />
          </div>
        </section>

        <section className="grid-canvas-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <div className="mobile-score-hud">
              <div className="mobile-score-card">
                <span className="label">{lang === 'jp' ? 'スコア' : 'SCORE'}</span>
                <span className="value">{score}</span>
              </div>
              <div className="mobile-score-card" style={{ borderColor: 'var(--border-neon-blue)' }}>
                <span className="label" style={{ color: 'var(--neon-blue)' }}>{lang === 'jp' ? 'ベスト' : 'BEST'}</span>
                <span className="value" style={{ textShadow: '0 0 10px rgba(29, 90, 227, 0.4)' }}>{highScore}</span>
              </div>
            </div>

            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
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
                images={preloadedImages}
                savedGame={initialSavedGame}
              />

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
                    margin: '0 0 1.5rem 0',
                    letterSpacing: '2px',
                    textShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
                  }}>
                    {lang === 'jp' ? 'ゲームオーバー' : 'GAME OVER'}
                  </h2>

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
                      {lang === 'jp' ? '最終スコア' : 'FINAL SCORE'}
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
                    {lang === 'jp' ? 'ゲームリスタート' : 'RESTART GAME'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid-sidebar-right" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <UpcomingDrop nextMascotIndex={nextMascotIndex} lang={lang} />
          <MergeChart currentTier={currentTier} lang={lang} />
        </section>
      </main>

      <footer style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', marginTop: 'auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontFamily: 'var(--hud)',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <span>created by Nisie | カニシズ</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <a 
            href="https://x.com/qkz_iroiro" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#64748b',
              transition: 'color 0.2s',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </div>
        <p style={{
          fontFamily: 'var(--hud)',
          fontSize: '0.65rem',
          color: '#475569',
          textAlign: 'center',
          lineHeight: '1.5',
          margin: 0,
          padding: '0 0.5rem'
        }}>
          This is a non-profit fanmade game for the series Tribe Nine. Both Tribe Nine and Suika game belongs to their respective owner.
        </p>
      </footer>

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
