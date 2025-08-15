import React from 'react';

// Define the type for the component's props
interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

/**
 * A reusable layout for authentication forms (Login, SignUp, etc.).
 * It provides a consistent container, header, and styling.
 *
 * @param {AuthLayoutProps} props - The component props.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
    return (
        <main className="flex-grow flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="text-center p-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    <p className="text-gray-400 mt-2">{subtitle}</p>
                </div>

                {/* Form Content */}
                <div className="p-8 pt-0">
                    {children}
                </div>
            </div>
        </main>
    );
};

export default AuthLayout;
