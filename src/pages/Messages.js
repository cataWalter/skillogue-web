// src/pages/Messages.js
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Messages = () => {
    const [searchParams] = useSearchParams();
    const chatWith = searchParams.get('chatWith');

    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const lastPollTime = useRef(null);
    const pollingInterval = useRef(null);
    const messagesContainerRef = useRef(null);
    const userScrolledUp = useRef(false); // Tracks if user has scrolled up manually

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
            } else {
                window.location.href = '/login';
            }
        };
        getUser();
    }, []);

    // Load conversations
    const loadConversations = async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_conversations', {
            current_user_id: user.id,
        });
        if (error) {
            console.error('Error loading conversations:', error);
        } else {
            setConversations(data);
        }
    };

    // Load messages for a chat
    const loadMessages = async (otherUserId) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id (id, first_name, last_name),
                receiver:receiver_id (id, first_name, last_name)
            `)
            .or(
                `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
            )
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading messages:', error);
        } else {
            setMessages(data);
            setSelectedChat(otherUserId);
            lastPollTime.current = new Date().toISOString();
        }
    };

    // Poll for new messages
    const startPolling = (otherUserId) => {
        lastPollTime.current = new Date().toISOString();

        pollingInterval.current = setInterval(async () => {
            if (!lastPollTime.current || !selectedChat) return;

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id (id, first_name, last_name),
                    receiver:receiver_id (id, first_name, last_name)
                `)
                .or(
                    `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
                )
                .gt('created_at', lastPollTime.current)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Polling error:', error);
                return;
            }

            if (data.length > 0) {
                setMessages((prev) => [...prev, ...data]);
                lastPollTime.current = new Date().toISOString();
            }
        }, 3000);
    };

    // Stop polling
    const stopPolling = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    // Auto-load chat from URL
    useEffect(() => {
        if (user && chatWith && !selectedChat) {
            loadMessages(chatWith);
        }
    }, [user, chatWith, selectedChat]);

    // Start/stop polling
    useEffect(() => {
        if (selectedChat) {
            startPolling(selectedChat);
        }

        return () => stopPolling();
    }, [selectedChat]);

    // Refresh conversations
    useEffect(() => {
        if (user) {
            loadConversations();
            const interval = setInterval(loadConversations, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Handle scroll to control auto-scroll behavior
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const threshold = 100;
            const isAtBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
            userScrolledUp.current = !isAtBottom;
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to bottom if user is near bottom
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // Only auto-scroll if user was already at the bottom
        if (!userScrolledUp.current) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        const message = {
            sender_id: user.id,
            receiver_id: selectedChat,
            content: newMessage.trim(),
        };

        const { error } = await supabase.from('messages').insert([message]);

        if (error) {
            console.error('Failed to send message:', error);
        } else {
            setNewMessage('');
            // Will appear on next poll
        }
    };

    // Helpers for rendering
    const getOtherUser = (msg) => {
        return msg.sender_id === user.id ? msg.receiver : msg.sender;
    };

    const getFullName = (person) => {
        if (!person) return 'User';
        return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'User';
    };

    const openChat = (otherUserId) => {
        stopPolling();
        loadMessages(otherUserId);
    };

    if (!user) return null; // Will redirect in useEffect

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            <main className="flex-grow flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
                    <div className="p-4 border-b border-gray-800">
                        <h2 className="text-xl font-semibold">Messages</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {conversations.length === 0 ? (
                            <p className="text-gray-500 p-4">No conversations yet.</p>
                        ) : (
                            <ul>
                                {conversations.map((conv) => (
                                    <li
                                        key={conv.user_id}
                                        onClick={() => openChat(conv.user_id)}
                                        className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer flex items-center gap-3 ${
                                            selectedChat === conv.user_id ? 'bg-gray-800' : ''
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-medium">
                                            {conv.full_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{conv.full_name || 'User'}</p>
                                            <p className="text-gray-400 text-xs truncate">{conv.last_message}</p>
                                        </div>
                                        {conv.unread > 0 && (
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                                <div className="flex items-center gap-3">
                                    <User className="w-8 h-8 text-gray-400" />
                                    <span className="font-medium">
                                        {conversations.find((c) => c.user_id === selectedChat)?.full_name || 'User'}
                                    </span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={messagesContainerRef}
                                className="flex-grow p-4 overflow-y-auto space-y-4"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                {messages.length === 0 ? (
                                    <p className="text-gray-500 text-center mt-8">No messages yet. Say hello!</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.sender_id === user.id;
                                        const otherUser = getOtherUser(msg);
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                        isMe ? 'bg-indigo-600' : 'bg-gray-800'
                                                    }`}
                                                >
                                                    {!isMe && (
                                                        <div className="text-xs opacity-70 mb-1">
                                                            {getFullName(otherUser)}
                                                        </div>
                                                    )}
                                                    <p className="text-sm">{msg.content}</p>
                                                    <span className="text-xs opacity-70 mt-1 block">
                                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-800">
                                <form onSubmit={sendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg flex items-center"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                            <p className="text-gray-500 mb-6">Start a chat from the sidebar.</p>
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 text-indigo-400 hover:underline"
                            >
                                <ArrowLeft size={16} />
                                Back to Dashboard
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Messages;