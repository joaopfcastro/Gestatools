import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export default function Icon({ name, className = '', filled = false }: IconProps) {
  return (
    <span 
      className={`material-symbols-outlined ${filled ? 'fill-icon' : ''} ${className}`}
      data-icon={name}
    >
      {name}
    </span>
  );
}
