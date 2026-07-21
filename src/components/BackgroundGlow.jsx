import React from 'react';
import './BackgroundGlow.css';

export default function BackgroundGlow() {
  return (
    <div className="signal-field" aria-hidden="true">
      <div className="signal-field__grid" />
      <div className="signal-field__wave signal-field__wave--far" />
      <div className="signal-field__wave signal-field__wave--near" />
      <div className="signal-field__axis">
        <span>KC</span>
        <span>01 / 26</span>
      </div>
    </div>
  );
}
