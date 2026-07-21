import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';

import { MASCOTS } from '../config/mascots';

const WARNING_LINE_Y = 120;
const DROP_COOLDOWN = 600; 
const WALL_WIDTH = 12;

export default function GameCanvas({ 
  score, 
  setScore, 
  highScore, 
  setHighScore, 
  nextMascotIndex, 
  setNextMascotIndex,
  onGameOver,
  isGameOver,
  resetTrigger,
  setCurrentTier,
  onMerge,
  onDrop,
  setIsOverflowing,
  images,
  savedGame
}) {
  const canvasRef = useRef(null);

  const [currentMascotIndex, setCurrentMascotIndex] = useState(() => {
    if (savedGame && typeof savedGame.currentMascotIndex === 'number') {
      return savedGame.currentMascotIndex;
    }
    return 0;
  });
  const [canDrop, setCanDrop] = useState(true);
  const [mouseX, setMouseX] = useState(240);
  const [warningTimer, setWarningTimer] = useState(0); 

  const engineRef = useRef(null);
  const loopRef = useRef(null);
  const mergesQueueRef = useRef([]);
  const particlesRef = useRef([]);
  const bodiesToDeleteRef = useRef(new Set());
  const warnTimeAccumulatorRef = useRef(0);
  const savedGameRef = useRef(savedGame);
  const savedGameRestoredRef = useRef(false);

  const mouseXRef = useRef(mouseX);
  const currentMascotIndexRef = useRef(currentMascotIndex);
  const canDropRef = useRef(canDrop);
  const isGameOverRef = useRef(isGameOver);
  const nextMascotIndexRef = useRef(nextMascotIndex);
  const warningTimerRef = useRef(0);
  const scoreRef = useRef(score);
  const imagesRef = useRef(images);

  useEffect(() => { mouseXRef.current = mouseX; }, [mouseX]);
  useEffect(() => { currentMascotIndexRef.current = currentMascotIndex; }, [currentMascotIndex]);
  useEffect(() => { canDropRef.current = canDrop; }, [canDrop]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { nextMascotIndexRef.current = nextMascotIndex; }, [nextMascotIndex]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { imagesRef.current = images; }, [images]);

  useEffect(() => {
    if (resetTrigger > 0) {
      savedGameRef.current = null;
      setCurrentMascotIndex(0);
      savedGameRestoredRef.current = true;
    }
  }, [resetTrigger]);

  const saveGameState = () => {
    if (!engineRef.current || isGameOverRef.current || !savedGameRestoredRef.current) return;
    try {
      const allBodies = Matter.Composite.allBodies(engineRef.current.world);
      const mascotBodies = allBodies
        .filter(b => b.isMascot && !b.toBeDeleted && !b.isStatic)
        .map(b => ({
          tier: b.tier,
          x: Math.round(b.position.x * 100) / 100,
          y: Math.round(b.position.y * 100) / 100,
          vx: Math.round(b.velocity.x * 1000) / 1000,
          vy: Math.round(b.velocity.y * 1000) / 1000,
          angle: Math.round(b.angle * 1000) / 1000,
          angularVelocity: Math.round(b.angularVelocity * 1000) / 1000
        }));

      const data = {
        score: scoreRef.current,
        currentMascotIndex: currentMascotIndexRef.current,
        nextMascotIndex: nextMascotIndexRef.current,
        bodies: mascotBodies,
        isGameOver: false
      };
      console.log('[T9Suika] saveGameState saving data:', data);
      localStorage.setItem('t9suika_saved_game', JSON.stringify(data));
    } catch (e) {
      console.warn('[T9Suika] Failed to save game state:', e);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGameState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const autoSaveInterval = setInterval(() => {
      if (!isGameOverRef.current) {
        saveGameState();
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(autoSaveInterval);
    };
  }, []);

  const currentMascot = MASCOTS[currentMascotIndex];

  const getClampedX = (rawX, radius) => {
    const leftLimit = WALL_WIDTH + radius;
    const rightLimit = 480 - WALL_WIDTH - radius;
    return Math.max(leftLimit, Math.min(rightLimit, rawX));
  };

  useEffect(() => {
    warnTimeAccumulatorRef.current = 0;
    warningTimerRef.current = 0;
    setWarningTimer(0);

    const engine = Matter.Engine.create({
      gravity: { y: 1.0, scale: 0.001 }
    });
    engineRef.current = engine;

    const floor = Matter.Bodies.rectangle(240, 768, 480, 200, {
      isStatic: true,
      friction: 0.1
    });
    const leftWall = Matter.Bodies.rectangle(WALL_WIDTH - 100, 340, 200, 680, {
      isStatic: true,
      friction: 0.1
    });
    const rightWall = Matter.Bodies.rectangle(480 - WALL_WIDTH + 100, 340, 200, 680, {
      isStatic: true,
      friction: 0.1
    });

    Matter.Composite.add(engine.world, [floor, leftWall, rightWall]);

    if (savedGameRef.current && Array.isArray(savedGameRef.current.bodies) && savedGameRef.current.bodies.length > 0) {
      console.log('[T9Suika] Restoring saved bodies count:', savedGameRef.current.bodies.length, savedGameRef.current.bodies);
      let maxTier = 0;
      savedGameRef.current.bodies.forEach((b, idx) => {
        if (typeof b.tier === 'number' && MASCOTS[b.tier]) {
          const mascotDef = MASCOTS[b.tier];
          if (b.tier > maxTier) maxTier = b.tier;

          const posX = Number.isFinite(b.x) ? b.x : 240;
          const posY = Number.isFinite(b.y) ? b.y : 500;

          const clampedX = getClampedX(posX, mascotDef.radius);
          const clampedY = Math.min(Math.max(mascotDef.radius, posY), 668 - mascotDef.radius);

          const body = Matter.Bodies.circle(clampedX, clampedY, mascotDef.radius, {
            restitution: 0.15,
            friction: 0.08,
            density: 0.001,
            label: 'mascot',
            isMascot: true,
            tier: b.tier,
            radius: mascotDef.radius
          });
          if (typeof b.angle === 'number' && Number.isFinite(b.angle)) {
            Matter.Body.setAngle(body, b.angle);
          }
          if (typeof b.vx === 'number' && Number.isFinite(b.vx) && typeof b.vy === 'number' && Number.isFinite(b.vy)) {
            Matter.Body.setVelocity(body, { x: b.vx, y: b.vy });
          }
          if (typeof b.angularVelocity === 'number' && Number.isFinite(b.angularVelocity)) {
            Matter.Body.setAngularVelocity(body, b.angularVelocity);
          }
          Matter.Composite.add(engine.world, body);
          console.log(`[T9Suika] Restored body #${idx}: tier=${b.tier}, pos=(${clampedX}, ${clampedY})`);
        }
      });
      if (setCurrentTier) setCurrentTier(maxTier);
    }
    savedGameRestoredRef.current = true;

    const handleCollision = (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if (
          bodyA.isMascot &&
          bodyB.isMascot &&
          bodyA.tier === bodyB.tier &&
          !bodiesToDeleteRef.current.has(bodyA.id) &&
          !bodiesToDeleteRef.current.has(bodyB.id)
        ) {
          bodiesToDeleteRef.current.add(bodyA.id);
          bodiesToDeleteRef.current.add(bodyB.id);

          bodyA.toBeDeleted = true;
          bodyB.toBeDeleted = true;

          const x = (bodyA.position.x + bodyB.position.x) / 2;
          const y = (bodyA.position.y + bodyB.position.y) / 2;
          const tier = bodyA.tier;

          mergesQueueRef.current.push({ x, y, tier });
        }
      });
    };

    Matter.Events.on(engine, 'collisionStart', handleCollision);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const gameLoop = (time) => {
      const dt = time - lastTime;
      lastTime = time;

      const clampedDt = Math.min(dt, 32);

      Matter.Engine.update(engine, clampedDt);

      const merges = mergesQueueRef.current;
      mergesQueueRef.current = [];

      merges.forEach(({ x, y, tier }) => {
        const allBodies = Matter.Composite.allBodies(engine.world);
        const toRemove = allBodies.filter(b => b.toBeDeleted);
        
        if (toRemove.length > 0) {
          Matter.Composite.remove(engine.world, toRemove);
        }

        if (tier + 1 < MASCOTS.length) {
          const nextTier = tier + 1;
          const newMascotDef = MASCOTS[nextTier];
          const newBody = Matter.Bodies.circle(x, y, newMascotDef.radius, {
            restitution: 0.15,
            friction: 0.08,
            density: 0.001,
            label: 'mascot',
            isMascot: true,
            tier: nextTier,
            radius: newMascotDef.radius
          });
          
          Matter.Composite.add(engine.world, newBody);

          setCurrentTier(nextTier);
          if (onMerge) onMerge(nextTier);

          if (!isGameOverRef.current) {
            const addedScore = newMascotDef.score;
            setScore(prev => {
              const nextScore = prev + addedScore;
              if (nextScore > highScore) {
                setHighScore(nextScore);
                localStorage.setItem('t9suika_highscore', String(nextScore));
              }
              return nextScore;
            });
          }

          if (nextTier === 8) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#a855f7', '#ec4899', '#326aa5', '#06b6d4']
            });
          }

          createMergeParticles(x, y, newMascotDef.color);
        } else {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f97316', '#a855f7', '#ec4899', '#326aa5', '#06b6d4']
          });

          if (!isGameOverRef.current) {
            setScore(prev => {
              const nextScore = prev + 1000;
              if (nextScore > highScore) {
                setHighScore(nextScore);
                localStorage.setItem('t9suika_highscore', String(nextScore));
              }
              return nextScore;
            });
          }

          if (onMerge) onMerge(8);
          createMergeParticles(x, y, '#f97316');
        }
      });

      if (merges.length > 0) {
        saveGameState();
      }

      const allActiveBodies = Matter.Composite.allBodies(engine.world);
      const activeIds = new Set(allActiveBodies.map(b => b.id));
      for (const id of bodiesToDeleteRef.current) {
        if (!activeIds.has(id)) {
          bodiesToDeleteRef.current.delete(id);
        }
      }

      updateParticles();

      ctx.clearRect(0, 0, 480, 680);
      drawBackgroundGrid(ctx);
      drawWarningLine(ctx);
      drawGlassBox(ctx);

      allActiveBodies.forEach((body) => {
        if (body.isMascot) {
          drawMascotBody(ctx, body);
        }
      });

      checkGameOverLine(allActiveBodies, clampedDt);

      if (canDropRef.current && !isGameOverRef.current) {
        const activeMascot = MASCOTS[currentMascotIndexRef.current];
        const clampedX = getClampedX(mouseXRef.current, activeMascot.radius);

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 8]);
        ctx.moveTo(clampedX, 80);
        ctx.lineTo(clampedX, 668);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(clampedX, 80);
        const imgs = imagesRef.current;
        const currentImg = imgs ? imgs[currentMascotIndexRef.current] : null;
        if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
          ctx.drawImage(currentImg, -activeMascot.radius, -activeMascot.radius, activeMascot.radius * 2, activeMascot.radius * 2);
        }
        ctx.restore();
      }

      drawParticles(ctx);

      loopRef.current = requestAnimationFrame(gameLoop);
    };

    loopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
      cancelAnimationFrame(loopRef.current);
      Matter.Events.off(engine, 'collisionStart', handleCollision);
      Matter.Composite.clear(engine.world);
      Matter.Engine.clear(engine);
    };
  }, [resetTrigger]);

  const createMergeParticles = (x, y, color) => {
    const list = particlesRef.current;
    for (let i = 0; i < 26; i++) {
      list.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,   
        vy: (Math.random() - 0.5) * 9 - 3,
        size: Math.floor(Math.random() * 6) + 4, 
        color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012
      });
    }
  };

  const updateParticles = () => {
    const list = particlesRef.current;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; 
      p.alpha -= p.decay;
    }
    particlesRef.current = list.filter(p => p.alpha > 0);
  };

  const drawParticles = (ctx) => {
    const list = particlesRef.current;
    list.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5; 

      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });
  };

  const drawBackgroundGrid = (ctx) => {
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 30; x < 480; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 680);
      ctx.stroke();
    }
    for (let y = 30; y < 680; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(480, y);
      ctx.stroke();
    }
  };

  const drawWarningLine = (ctx) => {
    const timeTicking = warningTimerRef.current > 0 && !isGameOverRef.current;

    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([10, 5]);
    ctx.moveTo(WALL_WIDTH, WARNING_LINE_Y);
    ctx.lineTo(480 - WALL_WIDTH, WARNING_LINE_Y);
    
    ctx.strokeStyle = timeTicking ? '#ef4444' : 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 2;
    if (timeTicking) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.restore();

    if (timeTicking) {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 12px Orbitron';
      ctx.textAlign = 'right';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      const remainingTime = Math.max(0, (2000 - warningTimerRef.current) / 1000);
      ctx.fillText(`WARNING! OVERFLOW DETECTED: ${remainingTime.toFixed(1)}s`, 480 - WALL_WIDTH - 10, WARNING_LINE_Y - 8);
      ctx.restore();
    }
  };

  const drawGlassBox = (ctx) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const floorY = 680 - WALL_WIDTH;

    ctx.beginPath();
    ctx.rect(0, floorY, 480, WALL_WIDTH);
    ctx.fill();

    ctx.beginPath();
    ctx.rect(0, 0, WALL_WIDTH, floorY);
    ctx.fill();

    ctx.beginPath();
    ctx.rect(480 - WALL_WIDTH, 0, WALL_WIDTH, floorY);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(WALL_WIDTH, 0);
    ctx.lineTo(WALL_WIDTH, floorY);
    ctx.moveTo(0, floorY);
    ctx.lineTo(480, floorY);
    ctx.moveTo(480 - WALL_WIDTH, 0);
    ctx.lineTo(480 - WALL_WIDTH, floorY);
    ctx.stroke();

    ctx.restore();
  };

  const drawMascotBody = (ctx, body) => {
    const { radius, tier } = body;
    const mascotDef = MASCOTS[tier] || MASCOTS[0];
    const imgs = imagesRef.current;
    const img = imgs ? imgs[tier] : null;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = mascotDef ? mascotDef.color : '#a855f7';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
    ctx.restore();
  };

  const checkGameOverLine = (bodies, dt) => {
    if (isGameOverRef.current) return;

    let isViolating = false;
    
    bodies.forEach(body => {
      if (body.isStatic || !body.isMascot) return;
      
      const topOfBody = body.position.y - body.radius;
      
      if (topOfBody < WARNING_LINE_Y && body.velocity.y < 0.12 && body.position.y > 100) {
        isViolating = true;
      }
    });

    if (isViolating) {
      warnTimeAccumulatorRef.current += dt;
      const currentWarnTime = Math.min(2000, warnTimeAccumulatorRef.current);
      warningTimerRef.current = currentWarnTime;
      setWarningTimer(currentWarnTime);
      if (setIsOverflowing) setIsOverflowing(true);
      
      if (currentWarnTime >= 2000) {
        onGameOver();
        if (setIsOverflowing) setIsOverflowing(false);
      }
    } else {
      warnTimeAccumulatorRef.current = Math.max(0, warnTimeAccumulatorRef.current - dt * 1.5);
      const roundedTime = Math.round(warnTimeAccumulatorRef.current);
      warningTimerRef.current = roundedTime;
      setWarningTimer(roundedTime);
      if (roundedTime === 0 && setIsOverflowing) {
        setIsOverflowing(false);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current || isGameOverRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const scaleX = 480 / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    setMouseX(x);
  };

  const handleTouchMove = (e) => {
    if (!canvasRef.current || isGameOverRef.current || e.touches.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const scaleX = 480 / rect.width;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    setMouseX(x);
  };

  const handleTouchStart = (e) => {
    if (!canvasRef.current || isGameOverRef.current || e.touches.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const scaleX = 480 / rect.width;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    setMouseX(x);
  };

  const dropTimeoutRef = useRef(null);

  const handleDrop = () => {
    if (!canDropRef.current || isGameOverRef.current || !engineRef.current) return;

    canDropRef.current = false;
    setCanDrop(false);

    const activeMascot = MASCOTS[currentMascotIndexRef.current];
    const clampedX = getClampedX(mouseXRef.current, activeMascot.radius);
    
    const body = Matter.Bodies.circle(clampedX, 80, activeMascot.radius, {
      restitution: 0.15,
      friction: 0.08,
      density: 0.001,
      label: 'mascot',
      isMascot: true,
      tier: currentMascotIndexRef.current,
      radius: activeMascot.radius
    });

    Matter.Composite.add(engineRef.current.world, body);
    saveGameState();

    if (onDrop) onDrop();

    if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current);
    dropTimeoutRef.current = setTimeout(() => {
      if (isGameOverRef.current) return;
      setCurrentMascotIndex(nextMascotIndexRef.current);
      const nextRandomIndex = Math.floor(Math.random() * 5);
      setNextMascotIndex(nextRandomIndex);
      setCanDrop(true);
      saveGameState();
    }, DROP_COOLDOWN);
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        margin: '0 auto',
        maxWidth: '520px'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          aspectRatio: '480 / 680',
          background: 'rgba(10, 5, 20, 0.82)',
          borderLeft: '1px solid rgba(168, 85, 247, 0.35)',
          borderRight: '1px solid rgba(168, 85, 247, 0.35)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 0 15px rgba(168, 85, 247, 0.15), 0 0 30px rgba(168, 85, 247, 0.08), inset 0 0 20px rgba(168, 85, 247, 0.03)',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          cursor: isGameOver ? 'default' : 'crosshair',
          touchAction: 'none'
        }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onClick={handleDrop}
      >
        <canvas 
          ref={canvasRef} 
          width={480} 
          height={680}
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        />

        {warningTimer > 0 && !isGameOver && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            boxShadow: `inset 0 0 ${20 + (warningTimer / 100)}px rgba(239, 68, 68, ${0.15 + (warningTimer / 3000)})`,
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'flash-border 0.5s infinite alternate'
          }}/>
        )}
      </div>

      <style>{`
        @shadow-flash {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
