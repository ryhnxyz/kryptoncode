import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RevealManager — scroll-driven section reveals. Any element carrying
 * [data-reveal] starts hidden (see index.css) and receives .is-revealed the
 * first time it scrolls into view. Stagger per element via the inline
 * --reveal-delay custom property. Re-scans on every route change.
 */
export default function RevealManager() {
  const location = useLocation();

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );

    // Wait one frame so the new route's DOM is painted.
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
        if (reducedMotion) el.classList.add('is-revealed');
        else io.observe(el);
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [location.pathname]);

  return null;
}
