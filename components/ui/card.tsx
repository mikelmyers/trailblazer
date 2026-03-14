import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white border border-border rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow ${className}`}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export { Card };
export type { CardProps };
