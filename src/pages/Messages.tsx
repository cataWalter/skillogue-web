// src/pages/Messages.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, User } from 'lucide-react';
import Navbar from '../components/Navbar';
import { User as AuthUser } from '@supabase/supabase-js';
import Avatar from '../components/Avatar';
import SEO from '../components/SEO';

// --- Type Definitions ---
interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
}

interface Message {
    id: number;
    created_at: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    sender: Profile;
    receiver: Profile;
}

interface Conversation {
    user_id: string;
    full_name: string;
    last_message: string;
    unread: number;
}

const PAGE_SIZE = 25;

const Messages: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const chatWith = searchParams.get('with');

    const [user, setUser] = useState<AuthUser | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(chatWith);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const userScrolledUp = useRef(false);
    const prevScrollHeightRef = useRef<number | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUser(data.user);
        };
        getUser();
    }, []);

    const loadConversations = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.rpc('get_conversations', { current_user_id: user.id });
        if (error) console.error('Error loading conversations:', error);
        else setConversations(data || []);
    }, [user]);

    const markMessagesAsRead = useCallback(async () => {
        if (!selectedChat || !user) return;
        const { error } = await supabase.rpc('mark_messages_as_read', {
            sender_id_param: selectedChat,
            receiver_id_param: user.id
        });
        if (error) console.error('Error marking messages as read:', error);
        else loadConversations();
    }, [selectedChat, user, loadConversations]);

    useEffect(() => {
        if (user) {
            loadConversations();
            const interval = setInterval(loadConversations, 15000);
            return () => clearInterval(interval);
        }
    }, [user, loadConversations]);

    useEffect(() => {
        markMessagesAsRead();
    }, [markMessagesAsRead]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedChat || !user) return;
            if (loadingMore || (page > 1 && !hasMore)) return;

            if (page === 1) setLoading(true); else setLoadingMore(true);

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('messages')
                .select(`*, sender:sender_id (id, first_name, last_name), receiver:receiver_id (id, first_name, last_name)`)
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error loading messages:', error);
            } else if (data) {
                if (data.length < PAGE_SIZE) setHasMore(false);
                const reversedData = [...data].reverse() as Message[];
                if (page === 1) {
                    setMessages(reversedData);
                } else {
                    if (messagesContainerRef.current) prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
                    setMessages((prev) => [...reversedData, ...prev]);
                }
            }
            if (page === 1) setLoading(false); else setLoadingMore(false);
        };
        loadMessages();
    }, [selectedChat, page, user]);

    useEffect(() => {
        if (!user) return;

        const channelName = `private-messages-for-${user.id}`;
        const channel = supabase.channel(channelName);

        channel
            .on('broadcast', { event: 'new-message' }, ({ payload }) => {
                const newMessage: Message = payload.message;
                console.log('Broadcast received in Messages.tsx:', newMessage);

                // ✅ FIX #1: Always refresh the conversation list to update the last message snippet.
                loadConversations();

                if (newMessage.sender_id === selectedChat) {
                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                    markMessagesAsRead();
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log(`Subscribed to broadcast channel: ${channelName}`);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, selectedChat, markMessagesAsRead, loadConversations]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !user) return;

        const content = newMessage.trim();
        setNewMessage('');

        const { data: insertedMessage, error } = await supabase
            .from('messages')
            .insert({ sender_id: user.id, receiver_id: selectedChat, content })
            .select(`*, sender:sender_id (*), receiver:receiver_id (*)`)
            .single();

        if (error) {
            console.error('Failed to send message:', error);
            return;
        }

        setMessages((prev) => [...prev, insertedMessage as Message]);

        // ✅ FIX #2: Immediately refresh the conversation list after sending.
        loadConversations();

        try {
            await supabase.functions.invoke('send-message-broadcast', {
                body: {
                    receiver_id: selectedChat,
                    message: insertedMessage,
                },
            });
        } catch (invokeError) {
            console.error('Error invoking broadcast function:', invokeError);
        }
    };

    const openChat = (otherUserId: string) => {
        if (otherUserId === selectedChat) return;
        setMessages([]);
        setPage(1);
        setHasMore(true);
        setSelectedChat(otherUserId);
        setSearchParams({ with: otherUserId });
    };

    const getFullName = (person: Profile | null) => {
        if (!person) return 'User';
        return `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'User';
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            if (container.scrollTop === 0 && hasMore && !loadingMore) {
                setPage((prevPage) => prevPage + 1);
            }
            userScrolledUp.current = container.scrollHeight - container.scrollTop - container.clientHeight > 100;
        };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore]);

    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (page > 1 && !loadingMore && prevScrollHeightRef.current !== null && container) {
            container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
            prevScrollHeightRef.current = null;
        }
    }, [messages, loadingMore, page]);

    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (container && !userScrolledUp.current) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Authenticating...</div>;

    return (
        <div className="bg-black text-white">
            <Navbar />
            <main className="flex overflow-hidden h-[calc(100vh-4rem)]">
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
                                        className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer flex items-center gap-3 ${selectedChat === conv.user_id ? 'bg-indigo-900/50' : ''}`}
                                    >
                                        <Avatar seed={conv.user_id} className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{conv.full_name || 'User'}</p>
                                            <p className="text-gray-400 text-xs truncate">{conv.last_message}</p>
                                        </div>
                                        {conv.unread > 0 && (
                                            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
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
                            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                                <Link to={`/profile/${selectedChat}`} className="flex items-center gap-3 hover:opacity-80 transition">
                                    <Avatar seed={selectedChat} className="w-10 h-10 rounded-full" />
                                    <span className="font-medium">
                                        {conversations.find((c) => c.user_id === selectedChat)?.full_name || 'User'}
                                    </span>
                                </Link>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 messages-container">
                                    {loading && <div className="text-center text-gray-400"><Loader2 className="animate-spin inline-block" /></div>}
                                    {loadingMore && <div className="flex justify-center py-2"><Loader2 className="animate-spin text-gray-400" /></div>}
                                    {!loading && messages.length === 0 && <p className="text-gray-500 text-center">No messages yet. Say hello!</p>}
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isMe ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                                                    <p className="text-sm" style={{ wordBreak: 'break-word' }}>{msg.content}</p>
                                                    <span className="text-xs opacity-70 mt-1 block text-right">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-800 bg-gray-900/70">
                                <form onSubmit={sendMessage} className="flex gap-2">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500" />
                                    <button type="submit" disabled={!newMessage.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg flex items-center">
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                            <p className="text-gray-500 mb-6">Start a chat from the sidebar.</p>
                            <Link to="/dashboard" className="flex items-center gap-2 text-indigo-400 hover:underline">
                                <ArrowLeft size={16} /> Back to Dashboard
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Messages;