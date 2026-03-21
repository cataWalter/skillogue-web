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
        return (
            <div className="w-full">
                <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
                <input
                    id={id}
                    ref={ref}
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 transition-all duration-200 focus:outline-none ${
                        error
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                            : 'border-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50'
                    } ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-sm text-red-400">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;