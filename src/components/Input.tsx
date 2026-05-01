// src/components/Input.tsx
import React from 'react';

// Define the props for the Input component, extending standard input attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, id, error, className, ...props }, ref) => {
        const errorId = error ? `${id}-error` : undefined;
        return (
            <div className="w-full">
                <label htmlFor={id} className="mb-2 block text-sm font-medium text-muted">
                    {label}
                </label>
                <input
                    id={id}
                    ref={ref}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={errorId}
                    className={`w-full rounded-xl border bg-surface-secondary/70 px-4 py-3 text-foreground placeholder-faint shadow-glass-sm transition-all duration-200 focus:outline-none ${
                        error
                            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/40'
                            : 'border-line/30 focus:border-brand focus:ring-2 focus:ring-brand/50'
                    } ${className}`}
                    {...props}
                />
                {error && (
                    <p id={errorId} className="mt-1.5 text-sm text-danger" role="alert">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;