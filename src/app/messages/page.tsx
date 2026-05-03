'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Send, Flag, ShieldAlert, MessageSquare, Ban } from 'lucide-react';
import { appClient } from '../../lib/appClient';
import Avatar from '../../components/Avatar';
import ReportModal from '../../components/ReportModal';
import ConversationItem from '../../components/ConversationItem';
import MessageItem from '../../components/MessageItem';
import Skeleton from '../../components/Skeleton';
import { getDisplayFullName, getDisplayName } from '@/lib/profile-display';
import { commonLabels, messagesCopy } from '@/lib/app-copy';
import { useProfileGate } from '@/hooks/useProfileGate';

import type { Profile, Message, Conversation } from '@/lib/messages-cache';
import {
    readMessagesPageCache,
    cacheConversations,
    cacheConversationMessages,
    getCachedConversationMessages,
} from '@/lib/messages-cache';

type AuthUser = {
    id: string;
    email: string;
};

const PAGE_SIZE = 25;

const getFullName = (profile?: Pick<Profile, 'first_name' | 'last_name'> | null) => {
    const parts = [profile?.first_name?.trim(), profile?.last_name?.trim()].filter(
        (part): part is string => Boolean(part)
    );

    return parts.join(' ');
};

const getMessageRenderKey = (message: Message) => message.renderKey ?? `message-${message.id}`;

const mergeUniqueMessages = (existing: Message[], incoming: Message[]) => {
    const byId = new Map<number, Message>();

    for (const message of existing) {
        byId.set(message.id, message);
    }

    for (const message of incoming) {
        const existingMessage = byId.get(message.id);

        byId.set(message.id, {
            ...existingMessage,
            ...message,
            renderKey: existingMessage?.renderKey ?? message.renderKey ?? getMessageRenderKey(message),
        });
    }

    return Array.from(byId.values()).sort(
        (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );
};

const Messages: React.FC = () => {
    useProfileGate();
    const searchParams = useSearchParams();
    const chatWith = searchParams?.get('conversation'); // Changed from 'with' to 'conversation' to match Dashboard link
    const router = useRouter();

    const [user, setUser] = useState<AuthUser | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(chatWith || null);
    const [selectedChatName, setSelectedChatName] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    const [conversationsLoading, setConversationsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const userScrolledUp = useRef(false);
    const isLoadingRef = useRef(false);
    const prevScrollHeightRef = useRef<number | null>(null);
    const trackedConversationIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const getUser = async () => {
            const { data } = await appClient.auth.getUser();
            if (data?.user) setUser(data.user as AuthUser);
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

    useEffect(() => {
        setSelectedChatName('');
    }, [selectedChat]);

    useEffect(() => {
        let isActive = true;
        const cleanup = () => { isActive = false; };

        if (!selectedChat) {
            return cleanup;
        }

        const conversationName = conversations.find((conversation) => conversation.user_id === selectedChat)?.full_name?.trim();
        if (conversationName) {
            setSelectedChatName(conversationName);
            return cleanup;
        }

        const messageName = messages
            .map((message) => {
                if (message.sender_id === selectedChat) return getFullName(message.sender);
                if (message.receiver_id === selectedChat) return getFullName(message.receiver);
                return '';
            })
            .find((name) => name.length > 0);

        if (messageName) {
            setSelectedChatName(messageName);
            return cleanup;
        }

        const loadSelectedChatProfile = async () => {
            const { data, error } = await appClient
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', selectedChat)
                .single();

            if (error) {
                console.error('Error loading selected chat profile:', error);
                return;
            }

            if (isActive) {
                const profile = data as Pick<Profile, 'first_name' | 'last_name'> | null;
                setSelectedChatName(getDisplayName(profile?.first_name, profile?.last_name));
            }
        };

        loadSelectedChatProfile();

        return cleanup;
    }, [conversations, messages, selectedChat]);

    const hydrateCachedConversation = useCallback((conversationId: string) => {
        const userId = user!.id;

        const cachedMessages = getCachedConversationMessages(userId, conversationId);

        if (cachedMessages.length === 0) {
            return false;
        }

        setMessages(cachedMessages);
        setHasMore(cachedMessages.length >= PAGE_SIZE);
        setLoading(false);

        return true;
    }, [user]);

    const loadConversations = useCallback(async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
        const userId = user!.id;
        if (showLoading) {
            setConversationsLoading(true);
        }

        try {
            const { data, error } = await appClient.rpc('get_conversations', { current_user_id: userId });

            if (error) {
                console.error('Error loading conversations:', error);
                return;
            }

            const nextConversations = data || [];
            setConversations(nextConversations);
            cacheConversations(userId, nextConversations);
        } finally {
            setConversationsLoading(false);
        }
    }, [user]);

    const refreshActiveConversation = useCallback(async () => {
        const userId = user!.id;
        const activeChatId = selectedChat as string;

        const desiredCount = Math.max(messages.length, PAGE_SIZE);
        const { data, error } = await appClient
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
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeChatId}),and(sender_id.eq.${activeChatId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .range(0, desiredCount - 1);

        if (error) {
            console.error('Error refreshing conversation:', error);
            return;
        }

        const latestMessages = ((data as Message[]) || []).reverse();
        setMessages(prev => {
            const mergedMessages = mergeUniqueMessages(prev, latestMessages);
            cacheConversationMessages(userId, activeChatId, mergedMessages);
            return mergedMessages;
        });
    }, [messages.length, selectedChat, user]);

    const markMessagesAsRead = useCallback(async () => {
        if (!selectedChat || !user) return;
        const { error } = await appClient.rpc('mark_messages_as_read', {
            sender_id_param: selectedChat,
            receiver_id_param: user.id
        });
        if (error) console.error('Error marking messages as read:', error);
        else loadConversations();
    }, [selectedChat, user, loadConversations]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const cachedState = readMessagesPageCache(user.id);

        if (cachedState?.conversations.length) {
            setConversations(cachedState.conversations);
            setConversationsLoading(false);
        }

        if (selectedChat) {
            hydrateCachedConversation(selectedChat);
        }
    }, [hydrateCachedConversation, selectedChat, user]);

    useEffect(() => {
        if (!user) return () => { };

        const cachedState = readMessagesPageCache(user.id);
        loadConversations({ showLoading: !cachedState?.conversations.length });
        // 60s fallback poll — real-time INSERT subscription handles live updates
        const intervalId = window.setInterval(() => {
            loadConversations();
        }, 60000);

        // Subscribe to new messages to update conversation list
        const channel = appClient
            .channel('conversations_update')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`,
            }, () => {
                loadConversations();
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${user.id}`,
            }, () => {
                loadConversations();
            })
            .subscribe();

        return () => {
            window.clearInterval(intervalId);
            appClient.removeChannel(channel);
        };
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

            const cachedMessages = page === 1 ? getCachedConversationMessages(user.id, selectedChat) : [];

            if (page === 1) {
                if (cachedMessages.length === 0) {
                    setLoading(true);
                } else {
                    setHasMore(cachedMessages.length >= PAGE_SIZE);
                    setLoading(false);
                }
            } else {
                setLoadingMore(true);
            }

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await appClient
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
                const newMessages = ((data as unknown as Message[]) || []).reverse();
                if (page === 1) {
                    const nextMessages = mergeUniqueMessages([], newMessages);
                    setMessages(nextMessages);
                    cacheConversationMessages(user.id, selectedChat, nextMessages);
                } else {
                    setMessages(prev => {
                        const mergedMessages = mergeUniqueMessages(prev, newMessages);
                        cacheConversationMessages(user.id, selectedChat, mergedMessages);
                        return mergedMessages;
                    });
                }
                setHasMore(newMessages.length === PAGE_SIZE);
            }

            setLoading(false);
            setLoadingMore(false);
            isLoadingRef.current = false;
        };

        loadMessages();
    }, [selectedChat, user, page]);

    useEffect(() => {
        if (!selectedChat || !user) {
            return () => { };
        }

        // 60s fallback poll — real-time subscription handles live updates
        const intervalId = window.setInterval(() => {
            refreshActiveConversation();
        }, 60000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [refreshActiveConversation, selectedChat, user]);

    // Presence
    useEffect(() => {
        if (!user) return () => { };

        const presenceChannel = appClient.channel('online-users')
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const onlineIds = new Set<string>();
                for (const id in newState) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const state = newState[id] as any[];
                    if (state[0]?.user_id) onlineIds.add(state[0].user_id);
                }
                setOnlineUsers(onlineIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
                }
            });

        return () => {
            appClient.removeChannel(presenceChannel);
        };
    }, [user]);

    // Real-time subscription
    useEffect(() => {
        if (!selectedChat || !user) return () => { };

        const fetchAndMergeMessage = (messageId: string | number) => {
            appClient
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
                .eq('id', messageId)
                .single()
                .then(({ data }) => {
                    if (data) {
                        setMessages(prev => {
                            const mergedMessages = mergeUniqueMessages(prev, [data as unknown as Message]);
                            cacheConversationMessages(user.id, selectedChat, mergedMessages);
                            return mergedMessages;
                        });
                    }
                });
        };

        const channel = appClient
            .channel(`chat:${selectedChat}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user.id}`,
            }, (payload) => {
                if (payload.new.sender_id === selectedChat) {
                    fetchAndMergeMessage(payload.new.id);
                    markMessagesAsRead();
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=eq.${user.id}`,
            }, (payload) => {
                // Covers messages sent from another tab/device in this conversation
                if (payload.new.receiver_id === selectedChat) {
                    fetchAndMergeMessage(payload.new.id);
                }
            })
            .subscribe();

        return () => {
            appClient.removeChannel(channel);
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

    const checkBlockedStatus = useCallback(async () => {
        if (!selectedChat || !user) return;
        const [{ data: blockingData }, { data: blockedByData }] = await Promise.all([
            appClient.rpc('is_blocked', { target_id: selectedChat }),
            appClient.rpc('is_blocked_by', { target_id: selectedChat }),
        ]);

        setIsBlocking(!!blockingData);
        setIsBlocked(!!blockedByData);
    }, [selectedChat, user]);

    useEffect(() => {
        checkBlockedStatus();
    }, [checkBlockedStatus]);

    useEffect(() => {
        if (!selectedChat || !user || trackedConversationIds.current.has(selectedChat)) {
            return;
        }

        trackedConversationIds.current.add(selectedChat);
    }, [chatWith, selectedChat, user]);

    const blockUser = async () => {
        const activeChatId = selectedChat as string;
        if (!confirm(messagesCopy.blockConfirm)) return;

        const { error } = await appClient.rpc('block_user', { target_id: activeChatId });
        if (error) {
            console.error('Error blocking user:', error);
            alert(messagesCopy.blockFailed);
        } else {
            setIsBlocking(true);
            alert(messagesCopy.userBlocked);
            setSelectedChat(null);
            loadConversations();
            router.push('/messages');
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        const userId = user!.id;
        const activeChatId = selectedChat as string;
        setNewMessage('');

        // Optimistic update
        const tempId = Date.now();
        const renderKey = `optimistic-${tempId}`;
        const optimisticMessage: Message = {
            id: tempId,
            created_at: new Date().toISOString(),
            sender_id: userId,
            receiver_id: activeChatId,
            content,
            sender: { id: userId, first_name: 'You', last_name: '' },
            receiver: { id: activeChatId, first_name: '', last_name: '' },
            renderKey,
        };
        setMessages(prev => {
            const nextMessages = [...prev, optimisticMessage];
            cacheConversationMessages(userId, activeChatId, nextMessages);
            return nextMessages;
        });

        const { data: insertedMessage, error } = await appClient.from('messages').insert({
            sender_id: userId,
            receiver_id: activeChatId,
            content
        }).select(`
            id,
            created_at,
            sender_id,
            receiver_id,
            content,
            sender:profiles!sender_id(id, first_name, last_name),
            receiver:profiles!receiver_id(id, first_name, last_name)
        `).single();

        if (error) {
            console.error('Error sending message:', error);
            // Rollback
            setMessages(prev => {
                const nextMessages = prev.filter(message => message.id !== tempId);
                cacheConversationMessages(userId, activeChatId, nextMessages);
                return nextMessages;
            });
            alert(messagesCopy.sendFailed);
        } else {
            if (insertedMessage) {
                setMessages(prev => {
                    const reconciledMessages = mergeUniqueMessages(
                        prev.filter(message => message.id !== tempId),
                        [{ ...(insertedMessage as unknown as Message), renderKey }]
                    );
                    cacheConversationMessages(userId, activeChatId, reconciledMessages);
                    return reconciledMessages;
                });
            } else {
                setMessages(prev => {
                    const nextMessages = prev.filter(message => message.id !== tempId);
                    cacheConversationMessages(userId, activeChatId, nextMessages);
                    return nextMessages;
                });
                await refreshActiveConversation();
            }

            loadConversations();

            // Send Push Notification
            appClient.functions.invoke('send-push', {
                body: {
                    receiver_id: activeChatId,
                    actor_id: userId,
                    notification_type: 'new_message',
                    title: 'New Message',
                    body: content,
                    url: `/messages?conversation=${userId}`
                }
            }).catch(err => console.error('Failed to send push:', err));
        }
    };

    const selectChat = useCallback((id: string) => {
        setSelectedChat(id);
        setPage(1);
        if (!hydrateCachedConversation(id)) {
            setMessages([]);
        }
        setHasMore(true);
        userScrolledUp.current = false;
        // Update URL without reload
        router.push(`/messages?conversation=${id}`);
    }, [hydrateCachedConversation, router]);

    const currentChatUser = conversations.find(c => c.user_id === selectedChat);

    return (
        <div className="editorial-shell flex h-[calc(100dvh-64px)] py-4 sm:py-6">
            <div className="glass-panel flex w-full overflow-hidden rounded-[2rem] text-foreground">
                {/* Sidebar - Conversations List */}
                <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-line/20 flex flex-col bg-surface/35 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="border-b border-line/20 p-4 sm:p-5">
                        <h2 className="text-xl font-bold">{commonLabels.messages}</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {conversationsLoading ? (
                            <div className="flex flex-col h-full p-6 text-faint" role="status" aria-live="polite">
                                <div className="flex items-center gap-3 mb-6">
                                    <Loader2 className="w-5 h-5 animate-spin text-brand" />
                                    <div>
                                        <p className="text-base font-medium text-foreground">{messagesCopy.loadingConversations}</p>
                                        <p className="text-sm text-faint">{messagesCopy.checkingLatestChats}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {Array.from({ length: 4 }, (_, index) => (
                                        <div key={index} className="glass-surface flex items-center gap-3 rounded-[1.25rem] p-3">
                                            <Skeleton className="h-12 w-12 rounded-full bg-surface-secondary" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-1/3 bg-surface-secondary" />
                                                <Skeleton className="h-3 w-2/3 bg-surface-secondary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 p-6 text-center text-faint">
                                <MessageSquare className="w-12 h-12 mb-4 text-muted" />
                                <p className="text-lg font-medium text-foreground">{messagesCopy.emptyStateTitle}</p>
                                <p className="text-sm mt-2">{messagesCopy.emptyStateSubtitle}</p>
                                <Link href="/search" className="mt-4 rounded-xl bg-gradient-to-r from-brand-start to-brand-end px-4 py-2 text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover">
                                    {messagesCopy.findPeople}
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
                                    isOnline={onlineUsers.has(convo.user_id)}
                                    onClick={selectChat}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`w-full md:w-2/3 lg:w-3/4 flex flex-col bg-background/20 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="border-b border-line/20 bg-surface/45 px-3 py-3 sm:px-4 sm:py-4 backdrop-blur-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <button onClick={() => setSelectedChat(null)} className="md:hidden text-faint hover:text-foreground p-1">
                                            <ArrowLeft size={20} />
                                        </button>
                                        <Link href={`/user/${selectedChat}`}>
                                            <Avatar seed={selectedChat} className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:opacity-80 transition" />
                                        </Link>
                                        <Link href={`/user/${selectedChat}`} className="hover:underline">
                                            <h2 className="font-bold text-base sm:text-lg truncate max-w-[150px] sm:max-w-xs">
                                                {getDisplayFullName(currentChatUser?.full_name || selectedChatName)}
                                            </h2>
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            onClick={blockUser}
                                            className="glass-surface p-2 text-faint hover:text-danger transition-colors"
                                            title={messagesCopy.blockUserTitle}
                                        >
                                            <Ban size={18} className="sm:w-5 sm:h-5" />
                                        </button>
                                        <button
                                            onClick={() => setReportModalOpen(true)}
                                            className="glass-surface p-2 text-faint hover:text-warning transition-colors"
                                            title={messagesCopy.reportUserTitle}
                                        >
                                            <Flag size={18} className="sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                data-testid="messages-container"
                                className="messages-container flex-grow overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4 bg-transparent"
                            >
                                {loadingMore && (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="animate-spin text-brand" />
                                    </div>
                                )}
                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                                    return (
                                        <MessageItem
                                            key={getMessageRenderKey(msg)}
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
                                        <Loader2 className="animate-spin text-brand w-8 h-8" />
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            {isBlocking || isBlocked ? (
                                <div className="border-t border-line/20 bg-surface/45 p-4 text-center text-faint">
                                    {isBlocking ? (
                                        <p className="flex items-center justify-center gap-2">
                                            <ShieldAlert size={18} />
                                            {messagesCopy.youBlockedThisUser}
                                        </p>
                                    ) : (
                                        <p className="flex items-center justify-center gap-2">
                                            <ShieldAlert size={18} />
                                            {messagesCopy.youCannotMessageThisUser}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={sendMessage} className="border-t border-line/20 bg-surface/45 p-4">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            id="message-input"
                                            name="message"
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={messagesCopy.typeMessagePlaceholder}
                                            aria-label={messagesCopy.typeMessageAriaLabel}
                                            className="flex-grow rounded-full border border-line/30 bg-surface-secondary/70 px-4 py-3 text-foreground placeholder-faint focus:outline-none focus:ring-2 focus:ring-brand/50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="rounded-full bg-gradient-to-r from-brand-start to-brand-end p-2.5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-brand-start-hover hover:to-brand-end-hover disabled:cursor-not-allowed disabled:opacity-50"
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
                                    reportedUserId={selectedChat}
                                />
                            )}
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-faint">
                            <div className="glass-surface mb-4 rounded-full p-6">
                                <Send size={48} className="text-muted" />
                            </div>
                            <p className="text-xl font-medium">{messagesCopy.emptyPrompt}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
