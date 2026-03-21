import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
                <p className="text-gray-400 mb-8">Last updated: March 24, 2026</p>

                <div className="space-y-8 text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Why we use cookies</h2>
                        <p>
                            Skillogue uses cookies and similar browser storage mechanisms to keep the app functional, remember preferences,
                            and understand how core features are being used.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Essential cookies</h2>
                        <p>
                            Some cookies are required for authentication, security, session continuity, and core site behavior. Without them,
                            parts of the product may not work correctly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Preference storage</h2>
                        <p>
                            We may store choices such as cookie consent, notification preferences, and other product settings locally in your browser
                            so your experience remains consistent across visits.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Analytics</h2>
                        <p>
                            We may collect limited usage information to understand page views and feature usage so we can improve the product.
                            This data is used to improve reliability, usability, and performance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Managing cookies</h2>
                        <p>
                            You can manage or clear cookies through your browser settings. Keep in mind that disabling essential cookies may affect
                            sign-in, saved preferences, and other app features.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Contact</h2>
                        <p>
                            If you have questions about this Cookie Policy, you can contact us through the support options listed on the Contact page.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
