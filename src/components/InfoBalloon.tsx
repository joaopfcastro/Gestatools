import React from 'react';
import Icon from './Icon';

interface InfoBalloonProps {
  text: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'info' | 'error';
}

export function InfoBalloon({ text, onClick, className = '', variant = 'info' }: InfoBalloonProps) {
  const isError = variant === 'error';
  
  const content = (
    <>
      <Icon name="info" className="text-[18px] shrink-0" />
      <span className="text-[12px] font-semibold flex-1 leading-normal mt-[1px]">
        {text}
      </span>
      {onClick && (
        <Icon name="help" className="text-[18px] opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </>
  );

  const baseClasses = `w-full text-left py-2.5 px-3.5 rounded-xl flex items-center gap-2 border ${
    isError 
      ? 'bg-error/10 text-error border-error/20' 
      : 'bg-primary/10 text-primary border-primary/20'
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${isError ? 'hover:bg-error/20' : 'hover:bg-primary/20'} transition-colors group cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${baseClasses}`}>
      {content}
    </div>
  );
}
