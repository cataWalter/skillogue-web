// src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles,
    MessageCircle,
    ShieldCheck,
    Users,
    Zap,
    Heart
} from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            {/* Background Decorative Blobs */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-600/30 to-indigo-800/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-600/30 to-red-800/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative flex items-center justify-between px-6 py-6 lg:px-12">
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Skillogue
                </div>
                <Link
                    to="/login"
                    className="text-gray-300 hover:text-white transition duration-200"
                >
                    Log In
                </Link>
            </nav>

            {/* Hero Section */}
            <main className="relative px-6 py-20 lg:px-12 lg:py-32 text-center max-w-6xl mx-auto">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight">
                    <span className="block">Connect Through</span>
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Skills, Not Screens
                    </span>
                </h1>

                <p className="mt-8 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    Skillogue helps you build real friendships by matching people through shared interests,
                    meaningful conversations, and verified identities — no photos, no filters, just authenticity.
                </p>

                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
                    <Link
                        to="/signup"
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-semibold text-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                    >
                        Start for Free
                    </Link>
                    <Link
                        to="/login"
                        className="px-8 py-4 border border-gray-600 rounded-full font-semibold text-lg hover:bg-gray-900 transition duration-200"
                    >
                        Already a Member?
                    </Link>
                </div>
            </main>

            {/* Features Grid */}
            <section className="px-6 py-20 lg:px-12 max-w-6xl mx-auto">
                <h2 className="text-3xl lg:text-5xl font-bold text-center mb-16">
                    Why People Love Skillogue
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Sparkles className="h-8 w-8" />,
                            title: "Skill Matching",
                            desc: "Get matched with people who share your passions — from coding to cooking, art to activism."
                        },
                        {
                            icon: <MessageCircle className="h-8 w-8" />,
                            title: "Deep Conversations",
                            desc: "Engage in thoughtful discussions without the noise of likes or selfies."
                        },
                        {
                            icon: <ShieldCheck className="h-8 w-8" />,
                            title: "Verified Members",
                            desc: "Profile verification ensures a safer, more trustworthy community."
                        },
                        {
                            icon: <Users className="h-8 w-8" />,
                            title: "Interest Circles",
                            desc: "Join small groups based on hobbies and grow meaningful connections."
                        },
                        {
                            icon: <Zap className="h-8 w-8" />,
                            title: "No Visual Bias",
                            desc: "Judged by your words and ideas — not appearance — fostering real bonds."
                        },
                        {
                            icon: <Heart className="h-8 w-8" />,
                            title: "Real Friendships",
                            desc: "Form lasting relationships that go beyond the screen and into real life."
                        }
                    ].map((feature, i) => (
                        <div
                            key={i}
                            className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800 hover:border-purple-700 transition-all duration-300 group"
                        >
                            <div className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonial */}
            <section className="px-6 py-20 lg:px-12 text-center max-w-4xl mx-auto">
                <blockquote className="text-2xl italic text-gray-200 leading-relaxed">
                    “I found my closest friends here — people I connect with on a deeper level.
                    Skillogue changed how I see online friendships.”
                </blockquote>
                <cite className="block mt-6 text-lg text-purple-400">— Alex, Member since 2023</cite>
            </section>

            {/* Final CTA */}
            <section className="relative px-6 py-20 lg:px-12 text-center max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-purple-800/50 rounded-3xl p-12 backdrop-blur-sm">
                    <h2 className="text-4xl font-bold mb-4">Ready to Make Real Connections?</h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands building friendships based on who they are — not how they look.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block px-10 py-4 bg-white text-indigo-900 font-bold rounded-full text-lg hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                    >
                        Join Skillogue Today
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-10 text-center text-gray-500 text-sm border-t border-gray-800">
                © {new Date().getFullYear()} Skillogue. Built for real human connection.
            </footer>
        </div>
    );
};

export default LandingPage;