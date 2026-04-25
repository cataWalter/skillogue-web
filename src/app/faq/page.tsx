import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { staticPageCopy } from '../../lib/app-copy';

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    {staticPageCopy.common.backToHome}
                </Link>

                <h1 className="text-4xl font-bold mb-4">{staticPageCopy.faq.title}</h1>
                <p className="text-gray-400 mb-10">
                    {staticPageCopy.faq.subtitle}
                </p>

                <div className="space-y-6">
                    {staticPageCopy.faq.items.map((item) => (
                        <section key={item.question} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
                            <h2 className="text-xl font-semibold text-white mb-3">{item.question}</h2>
                            <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
