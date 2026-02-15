import React from 'react';

interface AvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ seed, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const pixels = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  };

  // Utilise l'API DiceBear avec style fun-emoji
  const avatarUrl = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}&size=${pixels[size]}`;

  return (
    <img
      src={avatarUrl}
      alt={`Avatar ${seed}`}
      className={`${sizes[size]} rounded-full border-2 border-orange-500 bg-gray-800 ${className}`}
      loading="lazy"
    />
  );
}
