import React, { useEffect, useRef } from 'react';

export const ProcessingAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;

    // Particle system for premium dust
    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      life: number; maxLife: number;
      isGold: boolean;
    };

    const particles: Particle[] = [];

    function spawnParticle() {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 40;
      particles.push({
        x: CX + Math.cos(angle) * dist,
        y: CY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.8,
        size: 0.5 + Math.random() * 1.5,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        isGold: Math.random() > 0.4,
      });
    }

    let t = 0;

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

    function draw() {
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      // ── Ambient Glows ──────────────────────────────────────────────
      const glowGrp = ctx.createRadialGradient(CX, CY, 10, CX, CY, 80);
      glowGrp.addColorStop(0, 'rgba(218, 165, 32, 0.15)');
      glowGrp.addColorStop(1, 'rgba(218, 165, 32, 0)');
      ctx.fillStyle = glowGrp;
      ctx.fillRect(0, 0, W, H);

      // ── Premium Rings ──────────────────────────────────────────────
      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(t * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 65, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12, 20, 12]);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(-t * 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      ctx.setLineDash([30, 20]);
      ctx.stroke();
      ctx.restore();

      // ── Geometric Blocks ───────────────────────────────────────────

      // 1. White Circle (Back layer)
      ctx.save();
      const circleY = CY + Math.sin(t * 2.2) * 12;
      const circleX = CX - 25 + Math.cos(t * 1.5) * 5;
      ctx.beginPath();
      ctx.arc(circleX, circleY, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      // 2. Solid Gold Square (Middle layer)
      ctx.save();
      const sqY = CY - 10 + Math.sin(t * 1.8 + Math.PI/2) * 10;
      const sqX = CX + 25 + Math.cos(t * 2) * 4;
      ctx.translate(sqX, sqY);
      ctx.rotate(t * 1.2);
      drawPolygon(0, 0, 4, 18, Math.PI/4); // square is a 4-sided polygon rotated by 45deg
      const goldGrd = ctx.createLinearGradient(-15, -15, 15, 15);
      goldGrd.addColorStop(0, '#FFF8DC'); // Cornsilk light
      goldGrd.addColorStop(0.3, '#FFD700'); // Gold
      goldGrd.addColorStop(1, '#B8860B'); // Darker gold
      ctx.fillStyle = goldGrd;
      ctx.shadowColor = 'rgba(218, 165, 32, 0.4)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();

      // 3. Dark/Copper Triangle (Front layer)
      ctx.save();
      const triY = CY + 15 + Math.sin(t * 2.5 + Math.PI) * 8;
      const triX = CX + Math.cos(t * 1.1) * 3;
      ctx.translate(triX, triY);
      ctx.rotate(-t * 0.9);
      drawPolygon(0, 0, 3, 22, -Math.PI/2);
      ctx.fillStyle = '#1A1A1A'; // Dark carbon
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#D4AF37'; // Gold border
      ctx.stroke();
      ctx.restore();

      // ── Particles ────────────────────────────────────────────────────
      if (Math.random() < 0.4) spawnParticle();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
        const alpha = (1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold 
          ? `rgba(255, 215, 0, ${alpha * 0.8})` 
          : `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="select-none"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

