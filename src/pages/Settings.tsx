// src/pages/Settings.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, Bell, Edit, ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import Layout from '../components/Layout';

const Settings: React.FC = () => {
    return (
        <Layout>
            <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
                <div className="flex items-center mb-8">
                    <Link to="/dashboard" className="text-gray-400 hover:text-white transition flex items-center gap-2">
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Link>
                </div>

                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                    <SettingsIcon size={36} /> Settings
                </h1>
                <p className="text-gray-400 mb-10">
                    Manage your account, privacy, and notification preferences.
                </p>

                <div className="space-y-10">
                    {/* Profile Section */}
                    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-4 mb-4">
                            <User className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-2xl font-semibold">Profile</h2>
                        </div>
                        <p className="text-gray-400 mb-4">
                            This is your public presence on Skillogue. Keep it up-to-date so others can connect with you.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/profile"
                                className="px-5 py-2.5 text-center bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
                            >
                                View My Profile
                            </Link>
                            <Link
                                to="/edit-profile"
                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition font-semibold"
                            >
                                <Edit size={16} /> Edit Profile Details
                            </Link>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div>
                        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">Account</h2>
                        <ul className="space-y-3 text-gray-300">
                            <li><Link to="/settings/account" className="hover:underline">Change Email Address</Link></li>
                            <li><Link to="/forgot-password" className="hover:underline">Change Password</Link></li>
                            <li className="text-red-400"><Link to="/settings/delete-account" className="hover:underline">Delete Account</Link></li>
                        </ul>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">Privacy</h2>
                        <ul className="space-y-3 text-gray-300">
                            <li><Link to="/settings/privacy" className="hover:underline">Who can see your profile</Link></li>
                            <li><Link to="/settings/privacy" className="hover:underline">Manage blocked users</Link></li>
                        </ul>
                    </div>

                    {/* Notification Settings */}
                    <div>
                        <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-4">Notifications</h2>
                        <ul className="space-y-3 text-gray-300">
                            <li><Link to="/settings/notifications" className="hover:underline">Manage email notifications</Link></li>
                            <li><Link to="/settings/notifications" className="hover:underline">In-app alert preferences</Link></li>
                        </ul>
                    </div>
                </div>
            </main>
        </Layout>
    );
};

export default Settings;
