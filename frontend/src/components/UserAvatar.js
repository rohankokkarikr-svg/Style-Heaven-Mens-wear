import React, { useState } from 'react';
import { getAvatarUrl, inferGender } from '../utils/avatarUtils';

/**
 * UserAvatar component
 * Renders a gender-aware cartoon avatar using DiceBear 'adventurer' style:
 *  • Male names   → boy cartoon face
 *  • Female names → girl cartoon face
 *
 * Props:
 *   name       {string}  – user's full name (seed + gender hint)
 *   size       {number}  – pixel size (default 40)
 *   className  {string}  – extra Tailwind classes
 *   ring       {boolean} – show gold ring border (default true)
 */
export default function UserAvatar({ name = '', size = 40, className = '', ring = true }) {
  const [imgError, setImgError] = useState(false);
  const url = getAvatarUrl(name, size * 2); // 2× for retina sharpness

  /* Fallback: initials bubble when image fails to load */
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  const ringCls = ring ? 'ring-2 ring-gold-500/70' : '';

  if (imgError) {
    return (
      <div
        className={`rounded-full flex items-center justify-center bg-gradient-to-br from-gold-600 to-amber-700 text-dark-900 font-bold select-none ${ringCls} ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
        title={name}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${name || 'User'} avatar`}
      width={size}
      height={size}
      onError={() => setImgError(true)}
      className={`rounded-full object-cover bg-dark-700 ${ringCls} ${className}`}
      style={{ width: size, height: size }}
      title={`${name} (${inferGender(name)})`}
    />
  );
}
