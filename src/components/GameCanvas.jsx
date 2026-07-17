import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';

const MASCOTS = [
  { tier: 0, name: "Mascot 1", filename: "mascot_01.webp", radius: 18, color: "#a855f7", score: 2 },
  { tier: 1, name: "Mascot 2", filename: "mascot_02.webp", radius: 24, color: "#c084fc", score: 4 },
  { tier: 2, name: "Mascot 3", filename: "mascot_03.webp", radius: 30, color: "#326aa5", score: 8 },
  { tier: 3, name: "Mascot 4", filename: "mascot_04.webp", radius: 37, color: "#60a5fa", score: 16 },
  { tier: 4, name: "Mascot 5", filename: "mascot_05.webp", radius: 44, color: "#06b6d4", score: 32 },
  { tier: 5, name: "Mascot 6", filename: "mascot_06.webp", radius: 52, color: "#38bdf8", score: 64 },
  { tier: 6, name: "Mascot 7", filename: "mascot_07.webp", radius: 60, color: "#eab308", score: 128 },
  { tier: 7, name: "Mascot 8", filename: "mascot_08.webp", radius: 68, color: "#facc15", score: 256 },
  { tier: 8, name: "Mascot 9", filename: "mascot_09.webp", radius: 76, color: "#f97316", score: 512 }
];

const WARNING_LINE_Y = 120;
const DROP_COOLDOWN = 600; // ms
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
  setIsOverflowing
}) {
  const canvasRef = useRef(null);
  
  // Game states
  const [images, setImages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMascotIndex, setCurrentMascotIndex] = useState(0);
  const [canDrop, setCanDrop] = useState(true);
  const [mouseX, setMouseX] = useState(240);
  const [warningTimer, setWarningTimer] = useState(0); // 0 to 2000 ms

  // Refs for physics engine access and loop persistence
  const engineRef = useRef(null);
  const loopRef = useRef(null);
  const mergesQueueRef = useRef([]);
  const particlesRef = useRef([]);
  const bodiesToDeleteRef = useRef(new Set());
  const warnTimeAccumulatorRef = useRef(0);

  // Refs to prevent stale closures and avoid rebuilding engine on state changes
  const mouseXRef = useRef(mouseX);
  const currentMascotIndexRef = useRef(currentMascotIndex);
  const canDropRef = useRef(canDrop);
  const isGameOverRef = useRef(isGameOver);
  const nextMascotIndexRef = useRef(nextMascotIndex);
  const warningTimerRef = useRef(0);

  // Sync refs to avoid re-triggering main useEffect
  useEffect(() => { mouseXRef.current = mouseX; }, [mouseX]);
  useEffect(() => { currentMascotIndexRef.current = currentMascotIndex; }, [currentMascotIndex]);
  useEffect(() => { canDropRef.current = canDrop; }, [canDrop]);
  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { nextMascotIndexRef.current = nextMascotIndex; }, [nextMascotIndex]);

  const currentMascot = MASCOTS[currentMascotIndex];

  // Helper to clamp mouse X coordinate
  const getClampedX = (rawX, radius) => {
    const leftLimit = WALL_WIDTH + radius;
    const rightLimit = 480 - WALL_WIDTH - radius;
    return Math.max(leftLimit, Math.min(rightLimit, rawX));
  };

  // Pre-load images
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages = {};
    
    MASCOTS.forEach((m, index) => {
      const img = new Image();
      img.src = `${import.meta.env.BASE_URL}assets/${m.filename}`;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === MASCOTS.length) {
          setImages(loadedImages);
          setLoading(false);
        }
      };
      img.onerror = () => {
        // High quality fallback vector canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
        grad.addColorStop(0, '#1b0e2f');
        grad.addColorStop(1, '#080312');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 8;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(index + 1), 128, 128);
        
        const fallbackImg = new Image();
        fallbackImg.src = canvas.toDataURL();
        fallbackImg.onload = () => {
          loadedImages[index] = fallbackImg;
          loadedCount++;
          if (loadedCount === MASCOTS.length) {
            setImages(loadedImages);
            setLoading(false);
          }
        };
      };
    });
  }, []);

  // Initialize Matter.js engine exactly ONCE (or on reset)
  useEffect(() => {
    if (loading || !images) return;

    // Reset local warning timers
    warnTimeAccumulatorRef.current = 0;
    warningTimerRef.current = 0;
    setWarningTimer(0);

    // 1. Create Engine
    const engine = Matter.Engine.create({
      gravity: { y: 1.0, scale: 0.001 }
    });
    engineRef.current = engine;

    // 2. Create Static boundaries (rendered in CSS, invisible in canvas but static)
    // Thickened to 200px to completely prevent mascot tunneling during initial load or lag spikes
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

    // 3. Collision Events (merging)
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

    // 4. Custom Render and Physics Loop
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const gameLoop = (time) => {
      const dt = time - lastTime;
      lastTime = time;

      const clampedDt = Math.min(dt, 32);

      // A. Update Physics World
      Matter.Engine.update(engine, clampedDt);

      // B. Process Merge Queue
      const merges = mergesQueueRef.current;
      mergesQueueRef.current = [];

      merges.forEach(({ x, y, tier }) => {
        const allBodies = Matter.Composite.allBodies(engine.world);
        const toRemove = allBodies.filter(b => b.toBeDeleted);
        
        if (toRemove.length > 0) {
          Matter.Composite.remove(engine.world, toRemove);
        }

        const nextTier = tier + 1;
        if (nextTier < MASCOTS.length) {
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

          // Update current max tier highlight in sidebar UI
          setCurrentTier(nextTier);
          if (onMerge) onMerge(nextTier);

          // Award score
          const addedScore = newMascotDef.score;
          setScore(prev => {
            const nextScore = prev + addedScore;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('t9suika_highscore', String(nextScore));
            }
            return nextScore;
          });

          // Canvas confetti celebration
          if (nextTier === 8) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#a855f7', '#ec4899', '#326aa5', '#06b6d4']
            });
          }

          createMergeParticles(x, y, newMascotDef.color);
        }
      });

      // Clear deleted bodies from tracker
      const allActiveBodies = Matter.Composite.allBodies(engine.world);
      const activeIds = new Set(allActiveBodies.map(b => b.id));
      for (const id of bodiesToDeleteRef.current) {
        if (!activeIds.has(id)) {
          bodiesToDeleteRef.current.delete(id);
        }
      }

      // C. Render Particles
      updateParticles();

      // D. Draw Elements
      ctx.clearRect(0, 0, 480, 680);
      drawBackgroundGrid(ctx);
      drawWarningLine(ctx);

      // Draw all bodies
      allActiveBodies.forEach((body) => {
        if (body.isStatic) {
          // Draw static boundaries
          ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
          ctx.beginPath();
          if (body.vertices.length > 0) {
            ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
            body.vertices.forEach(v => ctx.lineTo(v.x, v.y));
            ctx.closePath();
            ctx.fill();
          }
        } else if (body.isMascot) {
          drawMascotBody(ctx, body);
        }
      });

      // E. Check safety warning overflow line
      checkGameOverLine(allActiveBodies, clampedDt);

      // F. Render active drop cursor guide and preview mascot
      if (canDropRef.current && !isGameOverRef.current) {
        const activeMascot = MASCOTS[currentMascotIndexRef.current];
        const clampedX = getClampedX(mouseXRef.current, activeMascot.radius);

        // Aim line
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 8]);
        ctx.moveTo(clampedX, 80);
        ctx.lineTo(clampedX, 668);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Dropper hovering preview
        ctx.save();
        ctx.translate(clampedX, 80);
        if (images[currentMascotIndexRef.current]) {
          ctx.drawImage(images[currentMascotIndexRef.current], -activeMascot.radius, -activeMascot.radius, activeMascot.radius * 2, activeMascot.radius * 2);
        }
        ctx.restore();
      }

      // Draw merge particles on top
      drawParticles(ctx);

      loopRef.current = requestAnimationFrame(gameLoop);
    };

    loopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(loopRef.current);
      Matter.Events.off(engine, 'collisionStart', handleCollision);
      Matter.Composite.clear(engine.world);
      Matter.Engine.clear(engine);
    };
  }, [loading, images, resetTrigger]);

  // Particle updates
  const createMergeParticles = (x, y, color) => {
    const list = particlesRef.current;
    for (let i = 0; i < 26; i++) {
      list.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,   // Slightly faster speed
        vy: (Math.random() - 0.5) * 9 - 3,
        size: Math.floor(Math.random() * 6) + 4, // 4px to 9px square blocks
        color,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012
      });
    }
  };

  const updateParticles = () => {
    const list = particlesRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity pull on squares
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        list.splice(i, 1);
      }
    }
  };

  const drawParticles = (ctx) => {
    const list = particlesRef.current;
    list.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5; // Subtle glow for pixel-art clarity
      
      // Draw as square block
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });
  };

  // Background visual drawings
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

    // Always draw the red dashed warning line
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

    // Only draw the countdown text label during active overflow
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

  const drawMascotBody = (ctx, body) => {
    const { radius, tier } = body;
    const img = images[tier];

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    
    if (img) {
      ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
    }
    ctx.restore();
  };

  // Game over line monitoring
  const checkGameOverLine = (bodies, dt) => {
    if (isGameOverRef.current) return;

    let isViolating = false;
    
    bodies.forEach(body => {
      if (body.isStatic || !body.isMascot) return;
      
      const topOfBody = body.position.y - body.radius;
      // Ensure the body has fallen past the initial spawn point before testing violation
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

  // Mouse / Touch movement handlers
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

  // Mouse / Touch click drops
  const handleDrop = () => {
    if (!canDropRef.current || isGameOverRef.current || loading || !images || !engineRef.current) return;

    // Synchronously lock dropper immediately to prevent overlapping duplicate spawns
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
    
    // Trigger drop audio
    if (onDrop) onDrop();

    setTimeout(() => {
      if (isGameOverRef.current) return;
      setCurrentMascotIndex(nextMascotIndexRef.current);
      const nextRandomIndex = Math.floor(Math.random() * 5);
      setNextMascotIndex(nextRandomIndex);
      setCanDrop(true);
    }, DROP_COOLDOWN);
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        width: '480px',
        margin: '0 auto',
        maxWidth: '100%'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          aspectRatio: '480 / 680',
          background: 'rgba(5, 2, 10, 0.85)',
          borderLeft: '4px solid rgba(168, 85, 247, 0.4)',
          borderRight: '4px solid rgba(168, 85, 247, 0.4)',
          borderBottom: '12px solid #a855f7',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.15), inset 0 0 25px rgba(0, 0, 0, 0.8)',
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
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-darker)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 30
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(168, 85, 247, 0.1)',
              borderTop: '4px solid var(--neon-purple)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}/>
            <div style={{
              marginTop: '1.5rem',
              fontFamily: 'var(--hud)',
              color: '#fff',
              letterSpacing: '3px',
              fontSize: '0.9rem'
            }}>
              LOADING MASCOTS...
            </div>
          </div>
        )}

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
