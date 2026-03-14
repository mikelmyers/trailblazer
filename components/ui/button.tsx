'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:opacity-90',
  secondary:
    'bg-transparent text-accent border border-border-strong hover:bg-background-3',
  danger:
    'bg-danger text-white hover:opacity-90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  default: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      asChild = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 disabled:opacity-50 disabled:pointer-events-none';

    const classes = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (asChild) {
      // When asChild is true, render children directly but apply styles via wrapper span
      // This allows wrapping Next.js <Link> elements
      return (
        <span className={classes} ref={ref as React.Ref<HTMLSpanElement>}>
          {children}
        </span>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
