import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { staticPageCopy } from '../../lib/app-copy';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    {staticPageCopy.common.backToHome}
                </Link>

                <h1 className="text-4xl font-bold mb-8">{staticPageCopy.termsOfService.title}</h1>
                <p className="text-gray-400 mb-8">{staticPageCopy.common.lastUpdated(staticPageCopy.termsOfService.lastUpdated)}</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    {staticPageCopy.termsOfService.sections.map((section) => (
                        <section key={section.title}>
                            <h2 className="text-2xl font-semibold text-white mb-4">{section.title}</h2>
                            <p>
                                {section.body}
                                {'link' in section && section.link && (
                                    <>
                                        {' '}
                                        <Link href={section.link.href} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition">
                                            {section.link.label}
                                        </Link>
                                        {section.link.suffix}
                                    </>
                                )}
                            </p>
                            {'bullets' in section && section.bullets && (
                                <ul className="list-disc list-inside mt-2 ml-4 space-y-2">
                                    {section.bullets.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}