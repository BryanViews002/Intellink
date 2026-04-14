"use client";

import { useEffect, useRef } from "react";

function CanvasParticles({ variant }: { variant: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;

    const initSize = () => {
      if (canvas.parentElement) {
        w = canvas.width = canvas.parentElement.offsetWidth;
        h = canvas.height = canvas.parentElement.offsetHeight;
      }
    };
    initSize();

    // Adjust particle count depending on section impact
    const particleCount = variant === "hero" ? 70 : variant === "cta" ? 50 : 30;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        // Slow drifting
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around borders for continuous flow instead of bouncing
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Slightly glowing dots
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    const drawLines = () => {
      // Create distance threshold for connecting lines
      const maxDist = 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            // Opacity fades as distance increases
            const opacity = 0.2 * (1 - dist / maxDist);
            ctx.strokeStyle = `rgba(122, 182, 255, ${opacity})`; // Ice blue networks
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const render = () => {
      // Trailing effect for smooth motion (optional, replace with clearRect if too blurry)
      ctx.clearRect(0, 0, w, h);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Setup Resize Observer to watch parent element natively
    const resizeObserver = new ResizeObserver(() => {
        initSize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-10 pointer-events-none" 
    />
  );
}

export function AmbientBackdrop({
  variant = "hero",
}: {
  variant?: "hero" | "pricing" | "dashboard" | "cta";
}) {
  if (variant === "pricing") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <CanvasParticles variant={variant} />
        <div className="motion-grid opacity-20" />
        <div className="spotlight" style={{ top: "-20%", right: "-10%" }} />
        <div
          className="motion-orb motion-orb-gold orb-drift blur-3xl opacity-40"
          style={{ top: "10%", right: "12%", width: 300, height: 300 }}
        />
        <div
          className="motion-orb motion-orb-ice orb-drift-alt blur-3xl opacity-30"
          style={{ bottom: "18%", left: "8%", width: 250, height: 250 }}
        />
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="motion-grid opacity-10" />
        <div
          className="motion-orb motion-orb-mint orb-drift blur-2xl opacity-20"
          style={{ top: "20%", right: "14%", width: 200, height: 200 }}
        />
        <div
          className="motion-orb motion-orb-gold orb-drift-alt blur-2xl opacity-20"
          style={{ bottom: "15%", left: "10%", width: 180, height: 180 }}
        />
      </div>
    );
  }

  if (variant === "cta") {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <CanvasParticles variant={variant} />
        <div className="motion-grid opacity-30" />
        <div className="spotlight" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
        <div
          className="motion-orb motion-orb-gold orb-drift blur-3xl"
          style={{ top: "5%", left: "10%", width: 350, height: 350, opacity: 0.5 }}
        />
        <div
          className="motion-orb motion-orb-ice orb-drift-alt blur-3xl"
          style={{ bottom: "5%", right: "10%", width: 280, height: 280, opacity: 0.4 }}
        />
        <div
          className="motion-orb motion-orb-mint orb-drift blur-3xl"
          style={{ top: "40%", left: "60%", width: 250, height: 250, opacity: 0.4 }}
        />
      </div>
    );
  }

  // Hero variant (default)
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <CanvasParticles variant="hero" />
      <div className="motion-grid opacity-40 mix-blend-screen" />
      <div className="spotlight" style={{ top: "-30%", left: "60%" }} />
      
      {/* Background Nebulas */}
      <div
        className="motion-orb motion-orb-gold orb-drift blur-3xl opacity-30"
        style={{ top: "0%", right: "-10%", width: 500, height: 500 }}
      />
      <div
        className="motion-orb motion-orb-ice orb-drift-alt blur-3xl opacity-20"
        style={{ bottom: "0%", left: "-10%", width: 450, height: 450 }}
      />
      <div
        className="motion-orb motion-orb-mint orb-drift blur-3xl opacity-20"
        style={{ bottom: "20%", right: "15%", width: 300, height: 300 }}
      />
    </div>
  );
}
