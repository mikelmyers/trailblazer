'use client';

import React, { useState, useCallback } from 'react';

type RatingSize = 'sm' | 'md' | 'lg';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: RatingSize;
  className?: string;
}

const SIZE_MAP: Record<RatingSize, { star: number; gap: string }> = {
  sm: { star: 16, gap: 'gap-0.5' },
  md: { star: 24, gap: 'gap-1' },
  lg: { star: 32, gap: 'gap-1.5' },
};

interface StarProps {
  filled: boolean;
  hovered: boolean;
  size: number;
  disabled: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  index: number;
}

const Star: React.FC<StarProps> = ({
  filled,
  hovered,
  size,
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  index,
}) => {
  const showFilled = filled || hovered;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      aria-label={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
      className={`inline-flex items-center justify-center transition-transform ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-110'
      }`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={showFilled ? '#0A0A0F' : 'none'}
        stroke={showFilled ? '#0A0A0F' : '#D1D5DB'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
};

const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
  const sizeConfig = SIZE_MAP[size];

  const handleClick = useCallback(
    (index: number) => {
      if (!disabled) {
        onChange(index + 1);
      }
    },
    [disabled, onChange]
  );

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (!disabled) {
        setHoverIndex(index);
      }
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(-1);
  }, []);

  return (
    <div
      className={`inline-flex items-center ${sizeConfig.gap} ${className}`}
      role="radiogroup"
      aria-label="Rating"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          index={index}
          filled={index < value}
          hovered={hoverIndex >= 0 && index <= hoverIndex}
          size={sizeConfig.star}
          disabled={disabled}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  );
};

RatingInput.displayName = 'RatingInput';

export { RatingInput };
export type { RatingInputProps, RatingSize };
