import React, { useEffect, useRef } from 'react';

/**
 * DotMatrixMarquee — huge scrolling text where every glyph is built from
 * LED-style dots (the reference video's signature motif), monochrome krypton.
 *
 * Scroll-interactive: page scroll velocity drives the marquee — scrolling
 * down sweeps it left, scrolling up sweeps it back, idle keeps a gentle
 * drift. Static when the user prefers reduced motion.
 */
export default function DotMatrixMarquee({ text, speed = 26, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text) return undefined;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let running = true;
    let visible = true;
    let columns = [];      // [{x, ys: [rowIndex...]}]
    let loopWidth = 0;
    let cell = 7;          // dot pitch in CSS px
    let rows = 0;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let offset = 0;
    let last = performance.now();
    let lastScrollY = window.scrollY;
    let scrollVel = 0;

    const DOT_COLOR = [250, 247, 242];

    function sampleText() {
      // Rasterize the marquee string once, then sample filled cells.
      height = canvas.clientHeight;
      width = canvas.clientWidth;
      if (!width || !height) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cell = Math.max(5, Math.round(height / 13));
      rows = Math.floor(height / cell);

      const fontSize = rows * cell * 0.92;
      const font = `600 ${fontSize}px "Clash Display", "Outfit Variable", sans-serif`;

      const off = document.createElement('canvas');
      const offCtx = off.getContext('2d', { willReadFrequently: true });
      offCtx.font = font;
      const gap = fontSize * 0.9;
      const textWidth = Math.ceil(offCtx.measureText(text).width);
      off.width = textWidth + gap;
      off.height = rows * cell;
      offCtx.font = font;
      offCtx.fillStyle = '#fff';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(text, 0, off.height / 2 + fontSize * 0.04);

      const img = offCtx.getImageData(0, 0, off.width, off.height).data;
      const cols = Math.floor(off.width / cell);
      columns = [];
      for (let c = 0; c < cols; c++) {
        const ys = [];
        for (let r = 0; r < rows; r++) {
          const px = Math.min(off.width - 1, Math.round((c + 0.5) * cell));
          const py = Math.min(off.height - 1, Math.round((r + 0.5) * cell));
          const alpha = img[(py * off.width + px) * 4 + 3];
          if (alpha > 128) ys.push(r);
        }
        if (ys.length) columns.push({ x: c * cell, ys });
      }
      loopWidth = cols * cell;
    }

    function draw(now) {
      if (!running) return;
      raf = requestAnimationFrame(draw);
      if (!visible || !columns.length) return;

      const dt = Math.min(64, now - last);
      last = now;

      // Scroll coupling: velocity of the page scroll scrubs the marquee.
      const sy = window.scrollY;
      const dy = sy - lastScrollY;
      lastScrollY = sy;
      scrollVel += (dy - scrollVel) * 0.14;

      if (!reducedMotion) {
        offset += (speed * dt) / 1000 + scrollVel * 0.85;
        offset = ((offset % loopWidth) + loopWidth) % loopWidth;
      }

      ctx.clearRect(0, 0, width, height);
      const t = now / 1000;
      const energy = Math.min(1, Math.abs(scrollVel) / 26);
      const baseR = cell * (0.3 + 0.1 * energy);

      for (let rep = -1; rep * loopWidth < width + loopWidth; rep++) {
        const shift = rep * loopWidth - offset;
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          const x = col.x + shift + cell / 2;
          if (x < -cell || x > width + cell) continue;
          // soft wave traveling through the field, energized by scroll
          const pulse = reducedMotion
            ? 1
            : 0.78 + (0.22 + 0.34 * energy) * Math.sin(x * 0.016 + t * 2.1) * Math.sin(t * 0.7 + col.x * 0.002);
          const r = Math.max(0.8, baseR * pulse);
          const alpha = 0.55 + 0.4 * Math.min(1, pulse);
          ctx.fillStyle = `rgba(${DOT_COLOR[0]}, ${DOT_COLOR[1]}, ${DOT_COLOR[2]}, ${alpha})`;
          for (let j = 0; j < col.ys.length; j++) {
            const y = col.ys[j] * cell + cell / 2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    async function start() {
      try {
        await Promise.race([
          document.fonts.load('600 100px "Clash Display"'),
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
      } catch { /* fall back silently */ }
      if (!running) return;
      sampleText();
      last = performance.now();
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => sampleText());
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(canvas);

    start();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [text, speed]);

  return (
    <div className={`k-marquee ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="k-marquee-canvas" />
    </div>
  );
}
