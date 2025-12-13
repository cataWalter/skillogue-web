'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../supabaseClient';
import Input from '../../components/Input';
import { Button } from '../../components/Button';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const contactSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    category: z.enum(['general', 'support', 'bug', 'feedback']),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to get profile data
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', user.id)
                    .single();
                
                if (profile?.first_name) {
                    setValue('name', `${profile.first_name} ${profile.last_name || ''}`.trim());
                }
                if (user.email) {
                    setValue('email', user.email);
                }
            }
        };
        loadUser();
    }, [setValue]);

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const { error } = await supabase.from('contact_messages').insert({
                name: data.name,
                email: data.email,
                category: data.category,
                subject: data.subject,
                message: data.message,
                user_id: user?.id || null,
            });

            if (error) throw error;

            toast.success('Message sent successfully! We will get back to you soon.');
            router.push('/');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="w-full max-w-2xl">
                <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    Back to Home
                </Link>

                <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 shadow-2xl backdrop-blur-sm">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 mb-4">
                            <Mail size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
                        <p className="text-gray-400">
                            Have a question, suggestion, or just want to say hi? We'd love to hear from you.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Input
                                    id="name"
                                    label="Name"
                                    placeholder="Your name"
                                    {...register('name')}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <Input
                                    id="email"
                                    label="Email"
                                    type="email"
                                    placeholder="your@email.com"
                                    {...register('email')}
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                id="category"
                                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white transition ${errors.category ? 'border-red-500' : ''}`}
                                {...register('category')}
                            >
                                <option value="general">General Inquiry</option>
                                <option value="support">Support Request</option>
                                <option value="bug">Report a Bug</option>
                                <option value="feedback">Feedback</option>
                            </select>
                            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                        </div>

                        <div>
                            <Input
                                id="subject"
                                label="Subject"
                                placeholder="What is this about?"
                                {...register('subject')}
                                className={errors.subject ? 'border-red-500' : ''}
                            />
                            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                Message
                            </label>
                            <textarea
                                id="message"
                                rows={5}
                                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500 transition ${errors.message ? 'border-red-500' : ''}`}
                                placeholder="Tell us more..."
                                {...register('message')}
                            />
                            {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isSubmitting}
                            icon={<Send size={18} />}
                            className="w-full"
                        >
                            Send Message
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}
