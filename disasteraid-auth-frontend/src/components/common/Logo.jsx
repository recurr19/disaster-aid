import React from 'react';

export function Logo({ variant = 'full', size = 'md', className = '' }) {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-lg', subtext: 'text-[8px]' },
    md: { container: 'w-10 h-10', text: 'text-xl', subtext: 'text-[9px]' },
    lg: { container: 'w-12 h-12', text: 'text-2xl', subtext: 'text-[10px]' },
  };

  // Handle both string keys ('sm', 'md', 'lg') and numeric pixel sizes
  let sizeClasses;
  if (typeof size === 'number') {
    // Custom pixel size provided
    sizeClasses = {
      container: `w-[${size}px] h-[${size}px]`,
      text: size >= 48 ? 'text-2xl' : size >= 40 ? 'text-xl' : 'text-lg',
      subtext: size >= 48 ? 'text-[10px]' : size >= 40 ? 'text-[9px]' : 'text-[8px]'
    };
  } else {
    sizeClasses = sizes[size] || sizes.md;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses.container} relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle */}
          <circle cx="20" cy="20" r="19" fill="#dc2626" />
          <circle cx="20" cy="20" r="19" stroke="#ef4444" strokeWidth="2" />
          
          {/* Shield shape */}
          <path
            d="M20 8L12 11V16C12 21 14.5 25.5 20 28C25.5 25.5 28 21 28 16V11L20 8Z"
            fill="white"
          />
          
          {/* Medical cross */}
          <path
            d="M20 14V22M16 18H24"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Pulse line */}
          <path
            d="M10 32H13L15 28L17 34L19 30L21 32H30"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className={`${sizeClasses.text} font-semibold tracking-tight text-gray-900`}>
            Disaster<span className="text-red-600">Aid</span>
          </span>
          <span className={`${sizeClasses.subtext} text-gray-500 tracking-wider uppercase mt-0.5`}>
            Crisis Coordination
          </span>
        </div>
      )}
    </div>
  );
}
