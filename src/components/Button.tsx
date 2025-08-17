// src/components/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

// Define button variants using theme-aware CSS variables from Tailwind config
const buttonVariants = cva(
    'w-full flex items-center justify-center px-6 py-3 font-semibold rounded-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-white hover:bg-opacity-90',
                secondary: 'bg-secondary text-white hover:bg-opacity-90',
                outline: 'bg-transparent border border-text-tertiary text-text-secondary hover:bg-background-secondary',
            },
        },
        defaultVariants: {
            variant: 'primary',
        },
    }
);

// Define ButtonProps including className, variant, and other native button props
interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, isLoading, icon, children, ...props }, ref) => {
        return (
            <button
                className={buttonVariants({ variant, className })}
                ref={ref}
                disabled={isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        <span>Loading...</span>
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