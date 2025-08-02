"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

type MessageWithSender = {
    id: number;
    content: string;
    created_at: string;
    sender_id: string;
    profiles: Pick<Profile, "first_name" | "last_name"> | null;
};

interface ChatClientProps {
    initialMessages: MessageWithSender[];
    currentUser: Profile;
    otherUser: Profile;
}

export function ChatClient({ initialMessages, currentUser, otherUser }: ChatClientProps) {
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    useEffect(() => {
        const chatChannelId = `chat:${Math.min(currentUser.id, otherUser.id)}-${Math.max(currentUser.id, otherUser.id)}`;
        
        const channel = supabase.channel(chatChannelId, {
            config: {
                presence: {
                    key: currentUser.id, // Track this user's presence using their ID
                },
            },
        });

        // --- Realtime Message Subscription ---
        channel.on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=in.(${currentUser.id},${otherUser.id})`},
            (payload) => {
                const newMessagePayload = {
                    ...payload.new,
                    profiles: payload.new.sender_id === currentUser.id ? currentUser : otherUser,
                } as MessageWithSender;
                setMessages((currentMessages) => [...currentMessages, newMessagePayload]);
            }
        );

        // --- Presence Subscription ---
        channel.on("presence", { event: "sync" }, () => {
            const presenceState = channel.presenceState();
            const otherUserPresence = presenceState[otherUser.id];
            setIsOtherUserOnline(!!otherUserPresence);
        });
        
        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ online_at: new Date().toISOString() });
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id, otherUser.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        const content = newMessage.trim();
        setNewMessage("");

        await supabase.from("messages").insert({
            sender_id: currentUser.id,
            receiver_id: otherUser.id,
            content: content,
        });
    };

    const otherUserInitials = `${otherUser.first_name?.charAt(0) ?? ""}${otherUser.last_name?.charAt(0) ?? ""}`.toUpperCase();

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col">
            <div className="flex items-center gap-4 border-b p-4">
                <Link href="/discover">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div className="relative">
                    <Avatar>
                        <AvatarImage src={`https://placehold.co/40x40/E2E8F0/475569?text=${otherUserInitials}`} />
                        <AvatarFallback>{otherUserInitials}</AvatarFallback>
                    </Avatar>
                     {isOtherUserOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-semibold">
                        {otherUser.first_name} {otherUser.last_name}
                    </h2>
                     <p className="text-xs text-muted-foreground">
                        {isOtherUserOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
            
            <div className="flex-grow space-y-4 overflow-y-auto p-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-end gap-2 ${
                            message.sender_id === currentUser.id ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-xs rounded-lg p-3 lg:max-w-md ${
                                message.sender_id === currentUser.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            }`}
                        >
                            <p>{message.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}