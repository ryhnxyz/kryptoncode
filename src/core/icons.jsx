// ─────────────────────────────────────────────────────────────────
// KRYPTON AI CORE · inline icon set
// Self-contained SVGs so the core has zero icon-library dependency.
// ─────────────────────────────────────────────────────────────────
import React from 'react';

const S = ({ size = 16, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const Cpu = (p) => (
  <S {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
  </S>
);

export const Activity = (p) => (
  <S {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></S>
);

export const Terminal = (p) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m7 9 3 3-3 3M13 15h4" />
  </S>
);

export const Search = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>
);

export const Code = (p) => (
  <S {...p}><path d="m8 6-5 6 5 6M16 6l5 6-5 6" /></S>
);

export const Rocket = (p) => (
  <S {...p}>
    <path d="M5 15c-1 1-2 5-2 5s4-1 5-2" />
    <path d="M14 4c3 0 6 3 6 6-2 6-8 9-8 9l-4-4s3-6 6-8z" />
    <circle cx="14.5" cy="9.5" r="1.4" />
  </S>
);

export const Globe = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
  </S>
);

export const Mic = (p) => (
  <S {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </S>
);

export const Volume2 = (p) => (
  <S {...p}>
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
  </S>
);

export const VolumeX = (p) => (
  <S {...p}>
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <path d="m23 9-6 6M17 9l6 6" />
  </S>
);

export const X = (p) => (
  <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
);
