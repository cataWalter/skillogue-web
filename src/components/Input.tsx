// src/components/Input.tsx
import React from 'react';

// Define the props for the Input component, extending standard input attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, id, className, ...props }, ref) => {
        return (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
                <input
                    id={id}
                    ref={ref}
                    className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500 transition ${className}`}
                    {...props}
                />
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;