import React, { useEffect, useRef } from 'react';

const SoulCursor = () => {
  const canvasRef = useRef(null);

  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let trail = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let isHovering = false;
    let isVisible = false; // Start hidden until first move
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const onMouseMove = (e) => {
      isVisible = true;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseLeave = (e) => {
      if (
        e.clientY <= 0 || 
        e.clientX <= 0 || 
        (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
      ) {
        isVisible = false;
      }
    };
    
    const onMouseOver = (e) => {
      if (e.target.closest('button') || e.target.closest('a')) {
        isHovering = true;
      } else {
        isHovering = false;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseover', onMouseOver);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (isVisible) {
        // Smooth linear interpolation (lerp) for the outer shape
        trail.x += (mouse.x - trail.x) * 0.25;
        trail.y += (mouse.y - trail.y) * 0.25;
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colorHex = isDark ? '#faf7f2' : '#1c1917';
        const colorRgb = isDark ? '250, 247, 242' : '28, 25, 23';

        // 1. Draw exact mouse dot (main cursor)
        ctx.beginPath();
        if (isHovering) {
          ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = colorHex;
        } else {
          ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = colorHex;
        }
        ctx.fill();

        // 2. Draw smooth trailing minimalist ring
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, isHovering ? 24 : 16, 0, Math.PI * 2);
        ctx.strokeStyle = isHovering ? `rgba(${colorRgb}, 0.15)` : `rgba(${colorRgb}, 0.4)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseover', onMouseOver);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <canvas 
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  );
};

export default SoulCursor;
