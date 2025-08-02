"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface StartChatButtonProps {
    currentUserId: string;
    otherUserId: string;
}

export function StartChatButton({ currentUserId, otherUserId }: StartChatButtonProps) {
    const router = useRouter();

    const handleStartChat = () => {
        // Create a consistent, sorted chat ID to avoid duplicate chat rooms
        const chatId = [currentUserId, otherUserId].sort().join('--');
        router.push(`/messages/${chatId}`);
    };

    // Don't show the button if the user is viewing their own profile
    if (currentUserId === otherUserId) {
        return null;
    }

    return <Button className="mt-4" onClick={handleStartChat}>Send Message</Button>;
}
