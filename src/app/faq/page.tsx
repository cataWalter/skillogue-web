import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const faqItems = [
    {
        question: 'How does Skillogue match people?',
        answer: 'Skillogue focuses on shared passions, profile details, and preferences instead of uploaded profile photos. Search and discovery are built around what people care about and how they want to connect.',
    },
    {
        question: 'Can I hide parts of my profile?',
        answer: 'Yes. You can control privacy-sensitive details such as age and location, and you can also make your profile private if you want to limit what others can see.',
    },
    {
        question: 'How do favorites and messages work?',
        answer: 'You can save profiles to your favorites for quick access and start one-to-one conversations from search results, favorites, or a user profile.',
    },
    {
        question: 'How do blocking and reporting work?',
        answer: 'If another user behaves inappropriately, you can report them. You can also block users so they no longer appear in your experience or contact you.',
    },
    {
        question: 'Do I need to upload a profile picture?',
        answer: 'No. Skillogue intentionally uses generated avatars to keep discovery centered on interests and personality instead of appearance.',
    },
];

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
                <p className="text-gray-400 mb-10">
                    Quick answers about how Skillogue works, what you can control, and how safety features behave.
                </p>

                <div className="space-y-6">
                    {faqItems.map((item) => (
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
