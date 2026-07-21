import React from 'react';
import { AtSign, Bot, Camera, MessageCircle, Send } from 'lucide-react';

const icons = {
  TelegramLogo: Send,
  DiscordLogo: MessageCircle,
  WhatsappLogo: MessageCircle,
  InstagramLogo: Camera,
  TwitterLogo: AtSign,
  Robot: Bot,
};

export const renderIcon = (iconName) => {
  const Icon = icons[iconName] || Bot;
  return <Icon aria-hidden="true" />;
};
