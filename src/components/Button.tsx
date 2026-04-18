// src/components/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { componentCopy } from '../lib/app-copy';

// Define button variants using theme-aware CSS variables from Tailwind config
const buttonVariants = cva(
    'inline-flex items-center justify-center px-6 py-3 font-semibold rounded-xl shadow-glass-sm hover:shadow-glass-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-glass-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none',
    {
        variants: {
            variant: {
                primary: 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-brand/20 hover:from-brand-start-hover hover:to-brand-end-hover',
                secondary: 'bg-gradient-to-r from-connection-start to-connection-end text-white shadow-connection/20 hover:from-connection-start-hover hover:to-connection-end-hover',
                outline: 'bg-transparent border-2 border-brand/40 text-brand-soft hover:border-brand/60 hover:bg-brand/10',
                ghost: 'bg-transparent text-muted hover:text-foreground hover:bg-surface-secondary shadow-none',
                danger: 'bg-gradient-to-r from-danger-start to-danger-end text-white shadow-danger/20 hover:from-danger-start-hover hover:to-danger-end-hover',
                success: 'bg-gradient-to-r from-success-start to-success-end text-white shadow-success/20 hover:from-success-start-hover hover:to-success-end-hover',
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