'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send, Flag, ShieldAlert, MessageSquare } from 'lucide-react';
import { User as AuthUser } from '@supabase/supabase-js';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import ConversationItem from '../../components/ConversationItem';
import MessageItem from '../../components/MessageItem';

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
    const searchParams = useSearchParams();
    const chatWith = searchParams?.get('conversation'); // Changed from 'with' to 'conversation' to match Dashboard link
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(chatWith || null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const userScrolledUp = useRef(false);
    const isLoadingRef = useRef(false);
    const prevScrollHeightRef = useRef<number | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) setUser(data.user);
            else router.push('/login');
        };
        getUser();
    }, [router]);

    // Update selectedChat when URL param changes
    useEffect(() => {
        if (chatWith) {
            setSelectedChat(chatWith);
        }
    }, [chatWith]);

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
            // Prevent duplicate loading or loading when no more messages
            // Note: We allow page 1 to reload to refresh chat
            if (isLoadingRef.current) return;
            isLoadingRef.current = true;

            if (page === 1) setLoading(true); else setLoadingMore(true);

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    created_at,
                    sender_id,
                    receiver_id,
                    content,
                    sender:profiles!sender_id(id, first_name, last_name),
                    receiver:profiles!receiver_id(id, first_name, last_name)
                `)
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error loading messages:', error);
            } else {
                const newMessages = data as unknown as Message[];
                if (page === 1) {
                    setMessages(newMessages.reverse());
                } else {
                    setMessages(prev => [...newMessages.reverse(), ...prev]);
                }
                setHasMore(newMessages.length === PAGE_SIZE);
            }

            setLoading(false);
            setLoadingMore(false);
            isLoadingRef.current = false;
        };

        loadMessages();
    }, [selectedChat, user, page]);

    // Check block status
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (!user || !selectedChat) return;

            // Check if I blocked them
            const { data: blockData } = await supabase
                .from('blocks')
                .select('*')
                .eq('blocker_id', user.id)
                .eq('blocked_id', selectedChat)
                .single();
            
            setIsBlocking(!!blockData);

            // Check if they blocked me
            const { data: blockedByData } = await supabase
                .from('blocks')
                .select('*')
                .eq('blocker_id', selectedChat)
                .eq('blocked_id', user.id)
                .single();
            
            setIsBlocked(!!blockedByData);
        };

        checkBlockStatus();
    }, [user, selectedChat]);

    // Real-time subscription
    useEffect(() => {
        if (!selectedChat || !user) return;

        const channel = supabase
            .channel(`chat:${selectedChat}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`,
            }, (payload) => {
                if (payload.new.sender_id === selectedChat) {
                    // Fetch the full message with relations
                    supabase
                        .from('messages')
                        .select(`
                            id,
                            created_at,
                            sender_id,
                            receiver_id,
                            content,
                            sender:profiles!sender_id(id, first_name, last_name),
                            receiver:profiles!receiver_id(id, first_name, last_name)
                        `)
                        .eq('id', payload.new.id)
                        .single()
                        .then(({ data }) => {
                            if (data) {
                                setMessages(prev => [...prev, data as unknown as Message]);
                                markMessagesAsRead();
                            }
                        });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChat, user, markMessagesAsRead]);

    // Scroll handling
    useLayoutEffect(() => {
        if (messagesContainerRef.current) {
            if (page === 1 && !userScrolledUp.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            } else if (prevScrollHeightRef.current) {
                const newScrollHeight = messagesContainerRef.current.scrollHeight;
                messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
            }
        }
    }, [messages, page]);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight } = messagesContainerRef.current;
            if (scrollTop === 0 && hasMore && !loadingMore) {
                prevScrollHeightRef.current = scrollHeight;
                setPage(prev => prev + 1);
            }
            userScrolledUp.current = scrollTop + messagesContainerRef.current.clientHeight < scrollHeight - 50;
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || !user) return;

        const content = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const tempId = Date.now();
        const optimisticMessage: Message = {
            id: tempId,
            created_at: new Date().toISOString(),
            sender_id: user.id,
            receiver_id: selectedChat,
            content,
            sender: { id: user.id, first_name: 'You', last_name: '' },
            receiver: { id: selectedChat, first_name: '', last_name: '' }
        };
        setMessages(prev => [...prev, optimisticMessage]);

        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: selectedChat,
            content
        });

        if (error) {
            console.error('Error sending message:', error);
            // Rollback
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert('Failed to send message');
        } else {
            loadConversations();
        }
    };

    const selectChat = useCallback((id: string) => {
        setSelectedChat(id);
        setPage(1);
        setMessages([]);
        setHasMore(true);
        userScrolledUp.current = false;
        // Update URL without reload
        router.push(`/messages?conversation=${id}`);
    }, [router]);

    const currentChatUser = conversations.find(c => c.user_id === selectedChat);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-black text-white">
            {/* Sidebar - Conversations List */}
            <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-800 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold">Messages</h2>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-gray-400">
                            <MessageSquare className="w-12 h-12 mb-4 text-gray-600" />
                            <p className="text-lg font-medium text-white">No conversations yet</p>
                            <p className="text-sm mt-2">Start connecting with people who share your passions!</p>
                            <Link href="/search" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition">
                                Find People
                            </Link>
                        </div>
                    ) : (
                        conversations.map(convo => (
                            <ConversationItem
                                key={convo.user_id}
                                userId={convo.user_id}
                                fullName={convo.full_name}
                                lastMessage={convo.last_message}
                                unread={convo.unread}
                                isSelected={selectedChat === convo.user_id}
                                onClick={selectChat}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`w-full md:w-2/3 lg:w-3/4 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedChat(null)} className="md:hidden text-gray-400 hover:text-white">
                                    <ArrowLeft size={24} />
                                </button>
                                <Link href={`/user/${selectedChat}`}>
                                    <Avatar seed={selectedChat} className="w-10 h-10 cursor-pointer hover:opacity-80 transition" />
                                </Link>
                                <Link href={`/user/${selectedChat}`} className="hover:underline">
                                    <h2 className="font-bold text-lg">
                                        {currentChatUser?.full_name || 'Chat'}
                                    </h2>
                                </Link>
                            </div>
                            <button
                                onClick={() => setReportModalOpen(true)}
                                className="text-gray-400 hover:text-red-400 transition p-2"
                                title="Report User"
                            >
                                <Flag size={20} />
                            </button>
                        </div>

                        {/* Messages List */}
                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-grow overflow-y-auto p-4 space-y-4 bg-black"
                        >
                            {loadingMore && (
                                <div className="flex justify-center py-2">
                                    <Loader2 className="animate-spin text-indigo-500" />
                                </div>
                            )}
                            {messages.map((msg, index) => {
                                const isMe = msg.sender_id === user?.id;
                                const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                                return (
                                    <MessageItem
                                        key={msg.id}
                                        content={msg.content}
                                        createdAt={msg.created_at}
                                        isMe={isMe}
                                        showAvatar={showAvatar}
                                        senderId={msg.sender_id}
                                    />
                                );
                            })}
                            {loading && (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {isBlocking || isBlocked ? (
                            <div className="p-4 border-t border-gray-800 bg-gray-900/50 text-center text-gray-400">
                                {isBlocking ? (
                                    <p className="flex items-center justify-center gap-2">
                                        <ShieldAlert size={18} />
                                        You have blocked this user. You cannot send messages.
                                    </p>
                                ) : (
                                    <p className="flex items-center justify-center gap-2">
                                        <ShieldAlert size={18} />
                                        You cannot send messages to this user.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800 bg-gray-900/50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-grow bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {user && selectedChat && (
                            <ReportModal
                                isOpen={isReportModalOpen}
                                onClose={() => setReportModalOpen(false)}
                                reporterId={user.id}
                                reportedUserId={selectedChat}
                                reportedUserName={currentChatUser?.full_name || 'User'}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                        <div className="bg-gray-900 p-6 rounded-full mb-4">
                            <Send size={48} className="text-gray-700" />
                        </div>
                        <p className="text-xl font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
