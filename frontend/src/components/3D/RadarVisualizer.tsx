import React, { useEffect, useRef, useState } from 'react';
import { Merchant } from '../../types';

interface RadarProps {
  merchants: Merchant[];
  onSelectMerchant?: (m: Merchant) => void;
}

interface Particle {
  id: string;
  name: string;
  angle: number;
  radius: number;
  speed: number;
  size: number;
  score: number;
  band: string;
  merchant: Merchant;
}

export const RadarVisualizer: React.FC<RadarProps> = ({ merchants, onSelectMerchant }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredMerchant, setHoveredMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) - 30;

    // Convert merchants into radar particles
    const particles: Particle[] = merchants.map((m) => {
      // Radius scaled by risk score (higher score = further out)
      const radRatio = (m.current_risk_score / 100) * 0.85 + 0.1;
      const radius = radRatio * maxRadius;
      return {
        id: m.id,
        name: m.name,
        angle: Math.random() * Math.PI * 2,
        radius: radius,
        speed: (Math.random() * 0.002 + 0.0005) * (m.current_risk_score > 70 ? 2 : 1),
        size: m.current_risk_score > 70 ? 6 : m.current_risk_score > 40 ? 4.5 : 3.5,
        score: m.current_risk_score,
        band: m.risk_band,
        merchant: m
      };
    });

    let sweepAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Radar Background Grid Rings
      const ringRatios = [0.25, 0.5, 0.75, 1.0];
      ringRatios.forEach((r, idx) => {
        const ringRad = maxRadius * r;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRad, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 3 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 245, 212, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash(idx === 3 ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring Labels
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${r * 100}% Risk`, centerX + 6, centerY - ringRad + 12);
      });

      // 2. Crosshair Lines
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.stroke();

      // 3. Rotating Radar Sweep Beam
      sweepAngle += 0.015;
      if (sweepAngle > Math.PI * 2) sweepAngle = 0;

      const sweepGradient = ctx.createConicGradient(sweepAngle, centerX, centerY);
      sweepGradient.addColorStop(0, 'rgba(0, 245, 212, 0.25)');
      sweepGradient.addColorStop(0.12, 'rgba(0, 245, 212, 0.03)');
      sweepGradient.addColorStop(0.25, 'transparent');
      sweepGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // 4. Render Merchant Particles
      particles.forEach((p) => {
        p.angle += p.speed;
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;

        let color = '#10B981'; // Emerald Healthy
        let glowColor = 'rgba(16, 185, 129, 0.4)';

        if (p.band === 'Watchlist') {
          color = '#F59E0B'; // Amber
          glowColor = 'rgba(245, 158, 11, 0.5)';
        } else if (p.band === 'Critical') {
          color = '#EF4444'; // Crimson
          glowColor = 'rgba(239, 68, 68, 0.8)';
        }

        // Particle Glow
        ctx.beginPath();
        ctx.arc(x, y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Core Particle Dot
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Pulsing Ring for Critical
        if (p.band === 'Critical') {
          ctx.beginPath();
          ctx.arc(x, y, p.size + 4 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Hover Interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found: Merchant | null = null;
      particles.forEach((p) => {
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;
        const dist = Math.hypot(mouseX - x, mouseY - y);
        if (dist < 12) {
          found = p.merchant;
        }
      });
      setHoveredMerchant(found);
    };

    const handleClick = () => {
      if (hoveredMerchant && onSelectMerchant) {
        onSelectMerchant(hoveredMerchant);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [merchants, onSelectMerchant]);

  return (
    <div className="relative w-full h-[450px] glass-panel rounded-2xl p-4 overflow-hidden border border-slate-800">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Financial Stress Radar</h3>
          <p className="text-xs text-slate-400 font-mono">Visual Risk Map • {merchants.length} Merchants Tracked</p>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-400">Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-400">Watchlist</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="text-slate-400">Critical</span>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />

      {hoveredMerchant && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass-panel-glow px-4 py-2.5 rounded-xl text-xs flex items-center gap-4 pointer-events-none animate-fade-in border border-teal-500/40">
          <div>
            <div className="font-semibold text-slate-100">{hoveredMerchant.name}</div>
            <div className="text-slate-400 font-mono">{hoveredMerchant.id} • {hoveredMerchant.sector}</div>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div>
            <div className="text-slate-400">Risk Score</div>
            <div className={`font-mono font-bold ${hoveredMerchant.current_risk_score > 70 ? 'text-rose-400' : hoveredMerchant.current_risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {hoveredMerchant.current_risk_score} / 100
            </div>
          </div>
          <div className="text-teal-400 font-mono text-[11px] underline">Click to inspect 360° →</div>
        </div>
      )}
    </div>
  );
};
