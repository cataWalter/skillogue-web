'use client';

import { appClient } from '../../../lib/appClient';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Clock, XCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/Button';
import { settingsCopy } from '../../../lib/app-copy';

export default function VerificationPage() {
    const [status, setStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVerificationStatus();
    }, []);

    const fetchVerificationStatus = async () => {
        try {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) return;

            // Check if user is already verified in profile
            const { data: profile } = await appClient
                .from('profiles')
                .select('verified')
                .eq('id', user.id)
                .single();

            if (profile?.verified) {
                setStatus('approved');
                setLoading(false);
                return;
            }

            // Check for pending request
            const { data: request } = await appClient
                .from('verification_requests')
                .select('status')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (request) {
                setStatus(request.status as 'pending' | 'approved' | 'rejected');
            } else {
                setStatus('none');
            }
        } catch (error) {
            console.error('Error fetching verification status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerification = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await appClient.auth.getUser();
            if (!user) throw new Error(settingsCopy.verification.notAuthenticated);

            const { error } = await appClient
                .from('verification_requests')
                .insert({ user_id: user.id });

            if (error) throw error;

            setStatus('pending');
            toast.success(settingsCopy.verification.requestSubmitted);
        } catch (error: unknown) {
            console.error('Error requesting verification:', error);
            const message = error instanceof Error ? error.message : settingsCopy.verification.submitError;
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-2xl mx-auto">
                <Link href="/settings" className="text-gray-400 hover:text-white transition flex items-center gap-2 mb-8">
                    <ArrowLeft size={20} />
                    {settingsCopy.verification.backToSettings}
                </Link>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-600/20 p-3 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-2xl font-bold">{settingsCopy.verification.title}</h1>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-gray-400">{settingsCopy.verification.loading}</div>
                    ) : (
                        <div className="space-y-6">
                            {status === 'none' && (
                                <>
                                    <p className="text-gray-300">
                                        {settingsCopy.verification.intro}
                                    </p>
                                    <Button onClick={handleRequestVerification} className="w-full sm:w-auto">
                                        {settingsCopy.verification.requestButton}
                                    </Button>
                                </>
                            )}

                            {status === 'pending' && (
                                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 flex items-start gap-3">
                                    <Clock className="text-yellow-500 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-yellow-500">{settingsCopy.verification.pendingTitle}</h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {settingsCopy.verification.pendingDescription}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {status === 'approved' && (
                                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle className="text-green-500 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-green-500">{settingsCopy.verification.approvedTitle}</h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {settingsCopy.verification.approvedDescription}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {status === 'rejected' && (
                                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3">
                                    <XCircle className="text-red-500 shrink-0 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-red-500">{settingsCopy.verification.rejectedTitle}</h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {settingsCopy.verification.rejectedDescription}
                                        </p>
                                        <Button onClick={handleRequestVerification} variant="outline" className="mt-3">
                                            {settingsCopy.verification.tryAgain}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
