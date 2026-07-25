import React, { useEffect, useRef } from 'react';

/**
 * SpectrumBars — an audio-equalizer field made of dots. Columns of tiny warm
 * dots rise and fall in smooth traveling waves, echoing the reference video's
 * hero spectrum. Canvas-based, DPR-aware, freezes to a calm static frame when
 * the user prefers reduced motion.
 */
export default function SpectrumBars({ height = 64, align = 'center', className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let running = true;
    let visible = true;
    let width = 0;
    let dpr = 1;

    const PITCH = 9;        // column spacing
    const DOT = 5;          // vertical dot pitch
    const R = 1.6;          // dot radius

    function resize() {
      width = canvas.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function amplitudeAt(i, t) {
      // layered sines → organic equalizer motion
      const a =
        0.42 +
        0.3 * Math.sin(i * 0.31 + t * 1.9) +
        0.2 * Math.sin(i * 0.11 - t * 1.15) +
        0.12 * Math.sin(i * 0.53 + t * 3.1);
      return Math.max(0.06, Math.min(1, a));
    }

    function draw(now) {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (!visible || !width) return;

      const t = reducedMotion ? 1.35 : now / 1000;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.floor(width / PITCH);
      const maxDots = Math.floor(height / DOT);

      for (let i = 0; i < cols; i++) {
        const amp = amplitudeAt(i, t);
        const dots = Math.max(1, Math.round(amp * maxDots));
        const x = i * PITCH + PITCH / 2;
        for (let d = 0; d < dots; d++) {
          const frac = dots === 1 ? 1 : d / (dots - 1);
          let y;
          if (align === 'bottom') {
            y = height - d * DOT - DOT / 2;
          } else {
            // mirrored from vertical center
            const half = (dots * DOT) / 2;
            y = height / 2 - half + d * DOT + DOT / 2;
          }
          const alpha = 0.18 + 0.62 * (align === 'bottom' ? 1 - frac * 0.7 : 1 - Math.abs(frac - 0.5));
          ctx.fillStyle = `rgba(250, 247, 242, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, R, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (reducedMotion) running = false; // single calm frame
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [height, align]);

  return (
    <div className={`k-spectrum ${className}`} style={{ height }} aria-hidden="true">
      <canvas ref={canvasRef} className="k-spectrum-canvas" style={{ height }} />
    </div>
  );
}
