import React from 'react';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-background-3 text-text-primary',
  success: 'bg-green-50 text-success',
  danger: 'bg-red-50 text-danger',
  warning: 'bg-yellow-50 text-yellow-700',
  info: 'bg-blue-50 text-accent-blue',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  className = '',
  children,
}) => {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant };
