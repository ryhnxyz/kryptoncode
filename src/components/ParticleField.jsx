import React, { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

function targetFor(scene, index, count, width, height) {
  const t = index / count;
  if (scene === 0) {
    const ring = index % 4;
    const angle = t * TAU * 5 + ring * 0.3;
    const radius = Math.min(width, height) * (0.12 + ring * 0.035);
    return { x: width * 0.5 + Math.cos(angle) * radius, y: height * 0.48 + Math.sin(angle) * radius };
  }
  if (scene === 1) {
    const centers = [[0.28, 0.43], [0.53, 0.3], [0.72, 0.58]];
    const center = centers[index % centers.length];
    const angle = t * TAU * 13;
    const radius = 18 + ((index * 17) % 120);
    return { x: width * center[0] + Math.cos(angle) * radius, y: height * center[1] + Math.sin(angle) * radius * 0.62 };
  }
  const lane = index % 5;
  return {
    x: width * (0.14 + t * 0.74),
    y: height * 0.48 + Math.sin(t * TAU * 3 + lane) * (34 + lane * 8),
  };
}

export default function ParticleField({ scene, reducedMotion = false }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(scene);

  useEffect(() => { sceneRef.current = scene; }, [scene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { alpha: true });
    const pointer = { x: 0, y: 0, active: false };
    let frame = 0;
    let particles = [];
    let width = 0;
    let height = 0;
    let running = true;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reducedMotion ? 120 : Math.min(760, Math.max(300, Math.floor(width * height / 2600)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: 0.7 + Math.random() * 1.7,
        phase: Math.random() * TAU,
        index,
      }));
    };

    const onPointerMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    const onVisibility = () => { running = !document.hidden; if (running) frame = requestAnimationFrame(draw); };

    const draw = (time = 0) => {
      if (!running) return;
      context.clearRect(0, 0, width, height);
      const activeScene = Math.max(0, sceneRef.current);
      const gather = sceneRef.current >= 0;

      particles.forEach((particle) => {
        const target = targetFor(activeScene, particle.index, particles.length, width, height);
        if (gather && !reducedMotion) {
          particle.vx += (target.x - particle.x) * 0.0015;
          particle.vy += (target.y - particle.y) * 0.0015;
        } else if (gather) {
          particle.x += (target.x - particle.x) * 0.08;
          particle.y += (target.y - particle.y) * 0.08;
        } else {
          particle.vx += Math.cos(particle.phase + time * 0.0002) * 0.008;
          particle.vy += Math.sin(particle.phase + time * 0.00016) * 0.008;
        }

        if (pointer.active && !reducedMotion) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.max(30, Math.hypot(dx, dy));
          if (distance < 190) {
            const force = (190 - distance) / 190;
            particle.vx += (dx / distance) * force * 0.26;
            particle.vy += (dy / distance) * force * 0.26;
          }
        }

        particle.vx *= 0.965;
        particle.vy *= 0.965;
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        const pulse = 0.45 + Math.sin(time * 0.0015 + particle.phase) * 0.22;
        context.beginPath();
        context.fillStyle = `rgba(220, 228, 238, ${pulse})`;
        context.arc(particle.x, particle.y, particle.size, 0, TAU);
        context.fill();
      });

      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="intro-particle-canvas" aria-hidden="true" />;
}
