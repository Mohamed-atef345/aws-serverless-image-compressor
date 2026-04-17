import React, { useEffect, useRef } from 'react';

export const StaticBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    type ShapeType = 'circle' | 'square' | 'triangle';
    
    type BgShape = {
      type: ShapeType;
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      rotation: number;
      rotSpeed: number;
      opacity: number;
      isGold: boolean;
      depth: number; // For parallax speed scaling
    };

    const shapes: BgShape[] = [];
    const SHAPE_COUNT = 20;

    for (let i = 0; i < SHAPE_COUNT; i++) {
      const types: ShapeType[] = ['circle', 'square', 'triangle'];
      const depth = 0.5 + Math.random() * 1.5;
      shapes.push({
        type: types[Math.floor(Math.random() * types.length)],
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4 * depth,
        vy: (Math.random() - 0.5) * 0.4 * depth,
        size: (10 + Math.random() * 40) * depth,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        opacity: (0.02 + Math.random() * 0.08) * depth, // Very subtle opacity
        isGold: Math.random() > 0.4,
        depth,
      });
    }

    function drawPolygon(cx: number, cy: number, sides: number, radius: number, rotation: number) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = rotation + (i * Math.PI * 2) / sides;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        
        // Move
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;

        // Wrap around screen
        if (s.x > w + s.size) s.x = -s.size;
        else if (s.x < -s.size) s.x = w + s.size;
        
        if (s.y > h + s.size) s.y = -s.size;
        else if (s.y < -s.size) s.y = h + s.size;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        // Fill style based on type
        if (s.isGold) {
          ctx.fillStyle = `rgba(218, 165, 32, ${s.opacity})`;
          ctx.strokeStyle = `rgba(218, 165, 32, ${s.opacity * 1.5})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity * 0.5})`;
          ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity * 0.8})`;
        }

        if (s.type === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, s.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.type === 'square') {
          drawPolygon(0, 0, 4, s.size, Math.PI/4);
          if (s.isGold) {
            ctx.shadowColor = `rgba(218, 165, 32, ${s.opacity * 2})`;
            ctx.shadowBlur = 15;
          }
          ctx.fill();
        } else if (s.type === 'triangle') {
          drawPolygon(0, 0, 3, s.size, -Math.PI/2);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050505]">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#050505]" />

      {/* Large gradient orbs - subtle gold and dark grey */}
      <div
        className="absolute top-[-30%] right-[-20%] w-[900px] h-[900px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 40%, transparent 70%)' }}
      />
      <div
        className="absolute top-[10%] left-[-25%] w-[800px] h-[800px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.02) 40%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-20%] right-[10%] w-[700px] h-[700px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(184, 134, 11, 0.15) 0%, rgba(184, 134, 11, 0.05) 40%, transparent 70%)' }}
      />

      {/* Canvas for animated background geometry */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-80"
        style={{ pointerEvents: 'none' }}
      />

      {/* Subtle dot pattern grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 215, 0, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};
