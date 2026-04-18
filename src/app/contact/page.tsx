'use client';

import { useState, useEffect } from 'react';
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

const selectClass = 'w-full px-4 py-3 bg-surface-secondary border border-line/40 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-foreground transition';
const textareaClass = 'w-full px-4 py-3 bg-surface-secondary border border-line/40 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent text-foreground placeholder-faint transition';

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
        <main className="editorial-shell min-h-screen flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
            <div className="w-full max-w-2xl">
                <Link href="/" className="mb-8 inline-flex items-center gap-2 text-faint transition hover:text-foreground">
                    <ArrowLeft size={20} />
                    {staticPageCopy.common.backToHome}
                </Link>

                <div className="glass-panel rounded-[2rem] p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <p className="editorial-kicker mx-auto mb-4 w-fit border-brand/20 bg-brand/10 text-brand-soft">
                            Reach the studio
                        </p>
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 text-brand shadow-glass-sm">
                            <Mail size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">{staticPageCopy.contact.title}</h1>
                        <p className="text-faint">
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
                                    error={errors.name?.message}
                                    {...register('name')}
                                />
                            </div>
                            <div>
                                <Input
                                    id="email"
                                    label={staticPageCopy.contact.email}
                                    type="email"
                                    placeholder={staticPageCopy.contact.emailPlaceholder}
                                    error={errors.email?.message}
                                    {...register('email')}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-muted mb-2">
                                {staticPageCopy.contact.category}
                            </label>
                            <select
                                id="category"
                                className={`${selectClass} ${errors.category ? 'border-danger focus:border-danger focus:ring-danger/40' : ''}`}
                                {...register('category')}
                            >
                                {staticPageCopy.contact.categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            {errors.category && <p className="text-danger text-sm mt-1">{errors.category.message}</p>}
                        </div>

                        <div>
                            <Input
                                id="subject"
                                label={staticPageCopy.contact.subject}
                                placeholder={staticPageCopy.contact.subjectPlaceholder}
                                error={errors.subject?.message}
                                {...register('subject')}
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-muted mb-2">
                                {staticPageCopy.contact.message}
                            </label>
                            <textarea
                                id="message"
                                rows={5}
                                className={`${textareaClass} ${errors.message ? 'border-danger focus:border-danger focus:ring-danger/40' : ''}`}
                                placeholder={staticPageCopy.contact.messagePlaceholder}
                                {...register('message')}
                            />
                            {errors.message && <p className="text-danger text-sm mt-1">{errors.message.message}</p>}
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