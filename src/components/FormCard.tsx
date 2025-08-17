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
        <main className="flex-grow flex items-center justify-center px-6 py-12">
            <div className={`w-full ${maxWidthClass} bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden`}>
                <div className="text-center p-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    {subtitle && <p className="text-gray-400 mt-2">{subtitle}</p>}
                </div>
                <div className="px-8 pb-8">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default FormCard;