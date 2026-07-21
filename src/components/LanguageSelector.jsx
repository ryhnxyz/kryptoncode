import React from 'react';
import { Check, GlobeHemisphereWest } from '@phosphor-icons/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const languages = [
  { id: 'id', short: 'ID', label: 'Bahasa Indonesia', nativeLabel: 'Indonesia' },
  { id: 'en', short: 'EN', label: 'English', nativeLabel: 'English' },
];

export default function LanguageSelector({ mode = 'compact', onSelect }) {
  const { language, changeLanguage, t } = useLanguage();

  const selectLanguage = (nextLanguage) => {
    changeLanguage(nextLanguage);
    onSelect?.(nextLanguage);
  };

  if (mode === 'welcome') {
    return (
      <div className="language-welcome" role="group" aria-label={t('language.choose')}>
        {languages.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={language === item.id ? 'default' : 'outline'}
            className="language-welcome-option"
            aria-pressed={language === item.id}
            onClick={() => selectLanguage(item.id)}
          >
            <span className="language-code">{item.short}</span>
            <span className="language-option-copy">
              <strong>{item.nativeLabel}</strong>
              <small>{item.label}</small>
            </span>
            {language === item.id && <Check data-icon="inline-end" aria-hidden="true" />}
          </Button>
        ))}
      </div>
    );
  }

  const activeLanguage = languages.find((item) => item.id === language) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="language-trigger" aria-label={t('language.change')} />}
      >
        <GlobeHemisphereWest data-icon="inline-start" aria-hidden="true" />
        <span>{activeLanguage.short}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="language-menu">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('language.menuLabel')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={language} onValueChange={selectLanguage}>
            {languages.map((item) => (
              <DropdownMenuRadioItem key={item.id} value={item.id} className="language-menu-item">
                <span className="language-code">{item.short}</span>
                <span>{item.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
