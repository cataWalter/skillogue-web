'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50 shadow-lg animate-slide-up">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-gray-300 text-sm flex-grow">
                    <p>
                        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies. 
                        For more information, please see our <Link href="/privacy-policy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={acceptCookies}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                    >
                        Accept
                    </button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-gray-400 hover:text-white transition"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
