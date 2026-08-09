import React, { useState } from 'react';
import gestaIcon64 from '../../GestaTools_Identidade_Visual/public/icons/gestatools-v2/icon-64.png';
import gestaIcon128 from '../../GestaTools_Identidade_Visual/public/icons/gestatools-v2/icon-128.png';
import gestaIcon256 from '../../GestaTools_Identidade_Visual/public/icons/gestatools-v2/icon-256.png';
import gestaMasterIcon from '../../GestaTools_Identidade_Visual/branding/source/gestatools-icon-master.png';

interface BrandMarkProps {
  size?: number;
  className?: string;
  decorative?: boolean;
}

export default function BrandMark({
  size = 26,
  className = '',
  decorative = true,
}: BrandMarkProps) {
  const [imageError, setImageError] = useState(false);

  // Use imported master PNG if optimized sizes fail to load for any reason
  const imgSrc = imageError ? gestaMasterIcon : gestaIcon64;

  return (
    <img
      src={imgSrc}
      srcSet={imageError ? undefined : `${gestaIcon64} 1x, ${gestaIcon128} 2x, ${gestaIcon256} 3x`}
      width={size}
      height={size}
      alt={decorative ? '' : 'GestaTools'}
      aria-hidden={decorative ? true : undefined}
      draggable={false}
      decoding="async"
      loading="eager"
      onError={() => setImageError(true)}
      className={`block shrink-0 aspect-square rounded-[22%] object-cover select-none ring-1 ring-black/5 dark:ring-white/10 shadow-xs ${className}`}
    />
  );
}

