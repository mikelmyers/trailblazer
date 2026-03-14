import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputElement = (
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-3 py-2 bg-background-3 border border-border rounded-md text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );

    if (label) {
      return (
        <label htmlFor={inputId} className="block">
          <span className="block text-sm font-medium text-text-primary mb-1.5">
            {label}
          </span>
          {inputElement}
        </label>
      );
    }

    return inputElement;
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
