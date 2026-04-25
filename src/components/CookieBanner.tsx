'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { componentCopy } from '../lib/app-copy';

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
                        {componentCopy.cookieBanner.textBeforeLink}{' '}
                        <Link href="/privacy-policy" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">{componentCopy.cookieBanner.privacyPolicyLink}</Link>
                        {componentCopy.cookieBanner.textAfterLink}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={acceptCookies}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                    >
                        {componentCopy.cookieBanner.accept}
                    </button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-gray-400 hover:text-white transition"
                        aria-label={componentCopy.cookieBanner.closeAriaLabel}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
