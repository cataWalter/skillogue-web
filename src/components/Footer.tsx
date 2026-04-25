// src/components/Footer.tsx
'use client';

import React from 'react';
import { Github, Linkedin, Twitter, Heart } from 'lucide-react';
import Link from 'next/link';
import { componentCopy } from '../lib/app-copy';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white border-t border-gray-800">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="md:grid md:grid-cols-3 md:gap-8">
                    {/* Brand Section */}
                    <div className="space-y-8 md:col-span-1">
                        <h2 className="text-white text-3xl font-bold">
                            Skill<span className="text-indigo-400">ogue</span>
                        </h2>
                        <p className="text-gray-400 text-base">
                            {componentCopy.footer.tagline}
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://github.com/skillogue"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-full text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label={componentCopy.footer.githubAriaLabel}
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href="https://twitter.com/skillogue"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-full text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label={componentCopy.footer.twitterAriaLabel}
                            >
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a
                                href="https://linkedin.com/company/skillogue"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-full text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                                aria-label={componentCopy.footer.linkedinAriaLabel}
                            >
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="mt-12 md:mt-0 md:col-span-2">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Support */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                    {componentCopy.footer.support}
                                </h3>
                                <ul className="mt-4 space-y-4">
                                    <li>
                                        <Link
                                            href="/contact"
                                            className="text-base text-gray-300 hover:text-white transition-colors"
                                        >
                                            {componentCopy.footer.contactUs}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/faq"
                                            className="text-base text-gray-300 hover:text-white transition-colors"
                                        >
                                            {componentCopy.footer.faq}
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                    {componentCopy.footer.legal}
                                </h3>
                                <ul className="mt-4 space-y-4">
                                    <li>
                                        <Link
                                            href="/terms-of-service"
                                            className="text-base text-gray-300 hover:text-white transition-colors"
                                        >
                                            {componentCopy.footer.termsOfService}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/privacy-policy"
                                            className="text-base text-gray-300 hover:text-white transition-colors"
                                        >
                                            {componentCopy.footer.privacyPolicy}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/cookies"
                                            className="text-base text-gray-300 hover:text-white transition-colors"
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
                <div className="mt-12 border-t border-gray-800 pt-8">
                    <p className="text-base text-gray-400 text-center flex items-center justify-center gap-2">
                        {componentCopy.footer.allRightsReserved(currentYear)}
                        <span className="text-pink-500">{componentCopy.footer.madeWith}</span>
                        <Heart size={14} className="text-pink-500 fill-pink-500 animate-pulse" />
                        <span className="text-indigo-400">{componentCopy.footer.passionDrivenPeople}</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
