// src/components/Footer.tsx
'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { componentCopy } from '../lib/app-copy';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const textLinkClass = 'text-base text-muted hover:text-foreground transition-colors';

    return (
        <footer className="bg-surface text-foreground border-t border-line/30">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    {/* Brand Section */}
                    <div className="space-y-8 md:col-span-1">
                        <h2 className="text-foreground text-3xl font-bold">
                            Skill<span className="text-brand">ogue</span>
                        </h2>
                        <p className="text-faint text-base">
                            {componentCopy.footer.tagline}
                        </p>

                    </div>

                    {/* Links Section */}
                    <div className="mt-12 md:mt-0 md:col-span-2">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Support */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
                                    {componentCopy.footer.support}
                                </h3>
                                <ul className="mt-4 space-y-4">
                                    <li>
                                        <Link
                                            href="/contact"
                                            className={textLinkClass}
                                        >
                                            {componentCopy.footer.contactUs}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/faq"
                                            className={textLinkClass}
                                        >
                                            {componentCopy.footer.faq}
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
                                    {componentCopy.footer.legal}
                                </h3>
                                <ul className="mt-4 space-y-4">
                                    <li>
                                        <Link
                                            href="/terms-of-service"
                                            className={textLinkClass}
                                        >
                                            {componentCopy.footer.termsOfService}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/privacy-policy"
                                            className={textLinkClass}
                                        >
                                            {componentCopy.footer.privacyPolicy}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/cookies"
                                            className={textLinkClass}
                                        >
                                            {componentCopy.footer.cookiePolicy}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t border-line/30 pt-8">
                    <p className="text-base text-faint text-center flex items-center justify-center gap-2">
                        {componentCopy.footer.allRightsReserved(currentYear)}
                        <span className="text-connection">{componentCopy.footer.madeWith}</span>
                        <Heart size={14} className="text-connection fill-connection animate-pulse" />
                        <span className="text-brand">{componentCopy.footer.passionDrivenPeople}</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
