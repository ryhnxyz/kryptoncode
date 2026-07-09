import React from 'react';
import { TelegramLogo, DiscordLogo, WhatsappLogo, InstagramLogo, TwitterLogo, Robot } from '@phosphor-icons/react';

export const renderIcon = (iconName) => {
  switch (iconName) {
    case 'TelegramLogo': return <TelegramLogo weight="fill" />;
    case 'DiscordLogo': return <DiscordLogo weight="fill" />;
    case 'WhatsappLogo': return <WhatsappLogo weight="fill" />;
    case 'InstagramLogo': return <InstagramLogo weight="fill" />;
    case 'TwitterLogo': return <TwitterLogo weight="fill" />;
    case 'Robot': return <Robot weight="fill" />;
    default: return <Robot weight="fill" />;
  }
};
