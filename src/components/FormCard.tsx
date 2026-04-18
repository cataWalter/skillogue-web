// src/components/FormCard.tsx
import React from 'react';

interface FormCardProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    maxWidth?: 'md' | 'lg' | 'xl'; // Optional size control
}

const FormCard: React.FC<FormCardProps> = ({ children, title, subtitle, maxWidth = 'md' }) => {
    const maxWidthClass = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    }[maxWidth];

    return (
        <main className="editorial-shell flex flex-grow items-center justify-center py-12 sm:py-16">
            <div className={`glass-panel relative w-full overflow-hidden rounded-[2rem] ${maxWidthClass}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-brand/12 via-transparent to-connection/10" aria-hidden="true" />
                <div className="relative text-center p-8 sm:p-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-transparent">
                        {title}
                    </h1>
                    {subtitle && <p className="mt-3 text-faint">{subtitle}</p>}
                </div>
                <div className="relative px-8 pb-8 sm:px-10 sm:pb-10">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default FormCard;