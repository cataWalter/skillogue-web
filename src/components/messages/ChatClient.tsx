"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

// Define a new type for messages that includes the sender's profile
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
    const router = useRouter();
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to the bottom of the message list whenever new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Set up a real-time subscription to the messages table
    useEffect(() => {
        const channel = supabase
            .channel(`chat:${currentUser.id}-${otherUser.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    // Filter for messages between these two users
                    filter: `sender_id=in.(${currentUser.id},${otherUser.id})`,
                },
                (payload) => {
                    // When a new message arrives, add it to our local state
                    const newMessage = {
                        ...payload.new,
                        profiles: payload.new.sender_id === currentUser.id ? currentUser : otherUser,
                    } as MessageWithSender;
                    setMessages((currentMessages) => [...currentMessages, newMessage]);
                }
            )
            .subscribe();

        // Clean up the subscription when the component unmounts
        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, currentUser, otherUser]);

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
            {/* Chat Header */}
            <div className="flex items-center gap-4 border-b p-4">
                <Link href="/discover">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <Avatar>
                    <AvatarImage src={`https://placehold.co/40x40/E2E8F0/475569?text=${otherUserInitials}`} />
                    <AvatarFallback>{otherUserInitials}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold">
                    {otherUser.first_name} {otherUser.last_name}
                </h2>
            </div>

            {/* Message List */}
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

            {/* Message Input Form */}
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
