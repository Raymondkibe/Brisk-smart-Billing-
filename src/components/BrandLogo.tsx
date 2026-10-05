import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 rounded-lg text-xs',
  sm: 'w-8 h-8 rounded-xl text-sm',
  md: 'w-10 h-10 rounded-xl text-base',
  lg: 'w-12 h-12 rounded-2xl text-lg',
  xl: 'w-16 h-16 rounded-2xl text-xl',
};

/**
 * High-fidelity branded logo with seamless image and vector SVG fallback.
 * Renders /logo.png, falls back to /logo.svg or dynamic inline vector mark.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'sm',
  alt = 'BRISK SMART BILLING',
}) => {
  const [errorStage, setErrorStage] = useState<0 | 1 | 2>(0);

  const containerSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <div
      className={`relative overflow-hidden bg-blue-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20 select-none ${containerSize} ${className}`}
    >
      {errorStage === 0 ? (
        <img
          src="/logo.png"
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setErrorStage(1)}
        />
      ) : errorStage === 1 ? (
        <img
          src="/logo.svg"
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setErrorStage(2)}
        />
      ) : (
        /* Standalone Inline Vector Mark */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="fallbackBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="fallbackGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="128" height="128" rx="28" fill="url(#fallbackBg)" />
          <path
            d="M38 28 H66 C78 28 86 34 86 44 C86 51 81 57 74 59 C83 61 90 68 90 78 C90 90 80 98 66 98 H38 C34.686 98 32 95.314 32 92 V34 C32 30.686 34.686 28 38 28 Z"
            fill="#ffffff"
          />
          <path
            d="M46 40 V54 H64 C68.418 54 72 50.418 72 47 C72 43.582 68.418 40 64 40 H46 Z"
            fill="url(#fallbackBg)"
          />
          <path
            d="M46 66 V86 H66 C70.971 86 75 81.971 75 76 C75 70.029 70.971 66 66 66 H46 Z"
            fill="url(#fallbackBg)"
          />
          <path
            d="M84 22 L72 46 H86 L68 76 L74 52 H62 Z"
            fill="url(#fallbackGold)"
            stroke="#1d4ed8"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
};
