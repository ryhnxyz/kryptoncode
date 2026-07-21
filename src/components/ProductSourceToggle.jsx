import { Radio, Database } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

export default function ProductSourceToggle({ source, onChange, label, liveLabel, mockLabel }) {
  return (
    <div className="product-source-control">
      <span className="product-source-label">{label}</span>
      <ToggleGroup
        className="product-source-toggle"
        value={[source]}
        onValueChange={(value) => value[0] && onChange(value[0])}
        aria-label={label}
        spacing={0}
      >
        <ToggleGroupItem value="live" aria-label={liveLabel}>
          <Radio data-icon="inline-start" aria-hidden="true" />
          {liveLabel}
        </ToggleGroupItem>
        <ToggleGroupItem value="mock" aria-label={mockLabel}>
          <Database data-icon="inline-start" aria-hidden="true" />
          {mockLabel}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
