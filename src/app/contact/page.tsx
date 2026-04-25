'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from '../../components/Input';
import { Button } from '../../components/Button';
import { Mail, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { contactCategoryValues, staticPageCopy } from '../../lib/app-copy';

const contactMessageMaxLength = 8192;

const contactSchema = z.object({
    name: z.string().min(2, staticPageCopy.contact.validation.nameRequired),
    email: z.string().email(staticPageCopy.contact.validation.invalidEmail),
    category: z.enum(contactCategoryValues),
    subject: z.string().min(5, staticPageCopy.contact.validation.subjectMin),
    message: z
        .string()
        .min(10, staticPageCopy.contact.validation.messageMin)
        .max(contactMessageMaxLength, staticPageCopy.contact.validation.messageMax(contactMessageMaxLength)),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    useEffect(() => {
        if (user) {
            // Pre-fill form with user data
            if (user.name) {
                setValue('name', user.name);
            }
            if (user.email) {
                setValue('email', user.email);
            }
        }
    }, [user, setValue]);

    const onSubmit = async (data: ContactFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success(staticPageCopy.contact.success);
                router.push('/');
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(staticPageCopy.contact.failure);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="w-full max-w-2xl">
                <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    {staticPageCopy.common.backToHome}
                </Link>

                <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 shadow-2xl backdrop-blur-sm">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 mb-4">
                            <Mail size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{staticPageCopy.contact.title}</h1>
                        <p className="text-gray-400">
                            {staticPageCopy.contact.subtitle}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Input
                                    id="name"
                                    label={staticPageCopy.contact.name}
                                    placeholder={staticPageCopy.contact.namePlaceholder}
                                    {...register('name')}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <Input
                                    id="email"
                                    label={staticPageCopy.contact.email}
                                    type="email"
                                    placeholder={staticPageCopy.contact.emailPlaceholder}
                                    {...register('email')}
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                                {staticPageCopy.contact.category}
                            </label>
                            <select
                                id="category"
                                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white transition ${errors.category ? 'border-red-500' : ''}`}
                                {...register('category')}
                            >
                                {staticPageCopy.contact.categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                        </div>

                        <div>
                            <Input
                                id="subject"
                                label={staticPageCopy.contact.subject}
                                placeholder={staticPageCopy.contact.subjectPlaceholder}
                                {...register('subject')}
                                className={errors.subject ? 'border-red-500' : ''}
                            />
                            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                {staticPageCopy.contact.message}
                            </label>
                            <textarea
                                id="message"
                                rows={5}
                                className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500 transition ${errors.message ? 'border-red-500' : ''}`}
                                placeholder={staticPageCopy.contact.messagePlaceholder}
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
                            {staticPageCopy.contact.sendMessage}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}