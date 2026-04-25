// src/components/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { componentCopy } from '../lib/app-copy';

// Define button variants using theme-aware CSS variables from Tailwind config
const buttonVariants = cva(
    'inline-flex items-center justify-center px-6 py-3 font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none',
    {
        variants: {
            variant: {
                primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500',
                secondary: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-400 hover:to-rose-400',
                outline: 'bg-transparent border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/10',
                ghost: 'bg-transparent text-gray-300 hover:text-white hover:bg-gray-800 shadow-none',
                danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600',
                success: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500',
            },
            size: {
                sm: 'px-4 py-2 text-sm rounded-lg',
                md: 'px-6 py-3 text-base',
                lg: 'px-8 py-4 text-lg rounded-xl',
                icon: 'p-2.5 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

// Define ButtonProps including className, variant, size, and other native button props
interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, icon, children, fullWidth = false, disabled, ...props }, ref) => {
        return (
            <button
                className={buttonVariants({ variant, size, className })}
                ref={ref}
                disabled={disabled || isLoading}
                style={{ width: fullWidth ? '100%' : undefined }}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        <span>{componentCopy.button.loading}</span>
                    </>
                ) : (
                    <>
                        {icon && <span className="mr-2">{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };