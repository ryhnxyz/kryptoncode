import React from 'react';
import { Check, GlobeHemisphereWest } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const languages = [
  { value: 'id', shortLabel: 'ID', label: 'Bahasa Indonesia' },
  { value: 'en', shortLabel: 'EN', label: 'English' },
];

export default function LanguageSelect({ compact = false }) {
  const { language, changeLanguage, t } = useLanguage();
  const activeLanguage = languages.find((item) => item.value === language) || languages[0];

  return (
    <div className="language-select-wrap">
      <GlobeHemisphereWest className="language-select-icon" size={16} weight="duotone" aria-hidden="true" />
      <Select value={language} onValueChange={changeLanguage}>
        <SelectTrigger className="language-select-trigger" aria-label={t('language.label')}>
          <SelectValue>{compact ? activeLanguage.shortLabel : activeLanguage.label}</SelectValue>
        </SelectTrigger>
        <SelectContent className="language-select-content" align="end" sideOffset={8}>
          <SelectGroup>
            <SelectLabel>{t('language.menuLabel')}</SelectLabel>
            {languages.map((item) => (
              <SelectItem key={item.value} value={item.value} className="language-select-item">
                <span className="language-select-code">{item.shortLabel}</span>
                <span>{item.label}</span>
                {item.value === language && <Check className="language-select-active" size={14} weight="bold" aria-hidden="true" />}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
