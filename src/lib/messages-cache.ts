// Shared types and cache utilities for the messages page

export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
}

export interface Message {
    id: number;
    created_at: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    sender: Profile;
    receiver: Profile;
    renderKey?: string;
}

export interface Conversation {
    user_id: string;
    full_name: string;
    last_message: string;
    unread: number;
}

export interface MessagesPageCache {
    userId: string;
    conversations: Conversation[];
    messagesByConversation: Record<string, Message[]>;
    updatedAt: number;
}

export const MESSAGES_PAGE_CACHE_KEY = 'skillogue:messages-page-cache';
const MESSAGES_PAGE_CACHE_TTL_MS = 5 * 60 * 1000;

export const readMessagesPageCache = (userId: string): MessagesPageCache | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawCache = window.sessionStorage.getItem(MESSAGES_PAGE_CACHE_KEY);

        if (!rawCache) {
            return null;
        }

        const parsedCache = JSON.parse(rawCache) as Partial<MessagesPageCache>;
        const isFreshCache = parsedCache.userId === userId
            && typeof parsedCache.updatedAt === 'number'
            && Date.now() - parsedCache.updatedAt < MESSAGES_PAGE_CACHE_TTL_MS;

        if (!isFreshCache) {
            window.sessionStorage.removeItem(MESSAGES_PAGE_CACHE_KEY);
            return null;
        }

        return {
            userId,
            conversations: Array.isArray(parsedCache.conversations) ? parsedCache.conversations as Conversation[] : [],
            messagesByConversation: parsedCache.messagesByConversation && typeof parsedCache.messagesByConversation === 'object'
                ? parsedCache.messagesByConversation as Record<string, Message[]>
                : {},
            updatedAt: parsedCache.updatedAt,
        };
    } catch {
        window.sessionStorage.removeItem(MESSAGES_PAGE_CACHE_KEY);
        return null;
    }
};

export const writeMessagesPageCache = (cache: MessagesPageCache) => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(MESSAGES_PAGE_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error caching messages page state:', error);
    }
};

export const cacheConversations = (userId: string, conversations: Conversation[]) => {
    const existingCache = readMessagesPageCache(userId);

    writeMessagesPageCache({
        userId,
        conversations,
        messagesByConversation: existingCache?.messagesByConversation ?? {},
        updatedAt: Date.now(),
    });
};

export const cacheConversationMessages = (userId: string, conversationId: string, nextMessages: Message[]) => {
    const existingCache = readMessagesPageCache(userId);

    writeMessagesPageCache({
        userId,
        conversations: existingCache?.conversations ?? [],
        messagesByConversation: {
            ...(existingCache?.messagesByConversation ?? {}),
            [conversationId]: nextMessages,
        },
        updatedAt: Date.now(),
    });
};

export const getCachedConversationMessages = (userId: string, conversationId: string) =>
    readMessagesPageCache(userId)?.messagesByConversation[conversationId] ?? [];
