import { Database, Radio } from 'lucide-react';

export default function ProductSourceToggle({ source, onChange, label, liveLabel, mockLabel }) {
  return (
    <div className="product-source-control">
      <span className="product-source-label">{label}</span>
      <div className="product-source-toggle" role="group" aria-label={label}>
        <button type="button" className={source === 'live' ? 'is-active' : ''} aria-pressed={source === 'live'} onClick={() => onChange('live')}><Radio aria-hidden="true" />{liveLabel}</button>
        <button type="button" className={source === 'mock' ? 'is-active' : ''} aria-pressed={source === 'mock'} onClick={() => onChange('mock')}><Database aria-hidden="true" />{mockLabel}</button>
      </div>
    </div>
  );
}
