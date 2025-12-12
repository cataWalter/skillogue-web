// src/components/Footer.tsx
'use client';

import React, { useState, ReactNode } from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';
import Modal from './Modal';

// Define the type for the modal's state
interface ModalState {
  open: boolean;
  title: string;
  content: ReactNode | null;
}

// --- Content Components ---

const TermsContent: React.FC = () => (
    <>
        <h3 className="text-lg font-semibold text-white mb-4">Terms of Service</h3>
        <p className="mb-2">Welcome to Skillogue...</p>
        <p className="mb-2">By using our service, you agree to...</p>
        {/* Add full content as needed */}
    </>
);

const PrivacyContent: React.FC = () => (
    <>
        <h3 className="text-lg font-semibold text-white mb-4">Privacy Policy</h3>
        <p className="mb-2">We value your privacy...</p>
        <p className="mb-2">Your data is never sold...</p>
    </>
);

const FAQContent: React.FC = () => (
    <>
        <h3 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
            <div>
                <strong>How do I sign up?</strong>
                <p>Click “Sign Up” and confirm your email.</p>
            </div>
            <div>
                <strong>Is Skillogue free?</strong>
                <p>Yes, forever free for core features.</p>
            </div>
        </div>
    </>
);


// --- Main Footer Component ---

const Footer: React.FC = () => {
    const [modal, setModal] = useState<ModalState>({ open: false, title: '', content: null });

    const openModal = (title: string, content: ReactNode) => {
        setModal({ open: true, title, content });
    };

    const closeModal = () => {
        setModal({ open: false, title: '', content: null });
    };

    return (
        <>
            <footer className="bg-gray-800 text-white">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                        <div className="space-y-8 xl:col-span-1">
                            <h2 className="text-white text-3xl font-bold">
                                Skill<span className="text-indigo-400">ogue</span>
                            </h2>
                            <p className="text-gray-400 text-base">
                                Connect through passions, not pictures
                            </p>
                            <div className="flex space-x-6">
                                <a
                                    href="https://github.com/skillogue"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-300"
                                >
                                    <span className="sr-only">GitHub</span>
                                    <Github className="h-6 w-6" />
                                </a>
                                <a
                                    href="https://twitter.com/skillogue"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-300"
                                >
                                    <span className="sr-only">Twitter</span>
                                    <Twitter className="h-6 w-6" />
                                </a>
                                <a
                                    href="https://linkedin.com/company/skillogue"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-300"
                                >
                                    <span className="sr-only">LinkedIn</span>
                                    <Linkedin className="h-6 w-6" />
                                </a>
                            </div>
                        </div>

                        <div className="mt-12 md:mt-0 xl:col-span-2">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                        Support
                                    </h3>
                                    <ul className="mt-4 space-y-4">
                                        <li>
                                            <button
                                                onClick={() => openModal('FAQ', <FAQContent />)}
                                                className="text-base text-gray-300 hover:text-white text-left transition"
                                            >
                                                FAQ
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => openModal('Contact Us', <p className="text-gray-300">Email us at <a href="mailto:support@skillogue.com" className="text-indigo-400">support@skillogue.com</a></p>)}
                                                className="text-base text-gray-300 hover:text-white text-left transition"
                                            >
                                                Contact Us
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => openModal('Help Center', <p className="text-gray-300">Visit our Help Center for guides and troubleshooting.</p>)}
                                                className="text-base text-gray-300 hover:text-white text-left transition"
                                            >
                                                Help Center
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                                        Legal
                                    </h3>
                                    <ul className="mt-4 space-y-4">
                                        <li>
                                            <button
                                                onClick={() => openModal('Terms', <TermsContent />)}
                                                className="text-base text-gray-300 hover:text-white text-left transition"
                                            >
                                                Terms
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => openModal('Privacy Policy', <PrivacyContent />)}
                                                className="text-base text-gray-300 hover:text-white text-left transition"
                                            >
                                                Privacy Policy
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => openModal('Cookies', <p className="text-gray-300">We use essential cookies to keep the site running. You can disable non-essential ones in settings.</p>)}
                                                className="text-base text-gray-300 hover:text-white text-left transition"
                                            >
                                                Cookies
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-gray-700 pt-8">
                        <p className="text-base text-gray-400 text-center">
                            &copy; {new Date().getFullYear()} Skillogue, Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Modal */}
            <Modal
                isOpen={modal.open}
                onClose={closeModal}
                title={modal.title}
            >
                {modal.content}
            </Modal>
        </>
    );
};

export default Footer;