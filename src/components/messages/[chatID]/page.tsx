import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChatClient } from "@/components/messages/ChatClient";
import type { Profile } from "@/types";

interface ChatPageProps {
    params: {
        chatId: string;
    };
}

export default async function ChatPage({ params }: ChatPageProps) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        redirect("/login");
    }

    // The chatId is a composite of two user IDs. We need to find the "other" user.
    const userIds = params.chatId.split('--');
    const otherUserId = userIds.find(id => id !== currentUser.id);

    if (!otherUserId) {
        notFound();
    }

    // Fetch profiles for both users and the message history
    const { data: otherUser } = await supabase.from("profiles").select("*").eq("id", otherUserId).single<Profile>();
    const { data: selfUser } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single<Profile>();

    const { data: messages } = await supabase
        .from("messages")
        .select("*, profiles(first_name, last_name)")
        .in("sender_id", [currentUser.id, otherUserId])
        .in("receiver_id", [currentUser.id, otherUserId])
        .order("created_at", { ascending: true });

    if (!otherUser || !selfUser) {
        notFound();
    }

    return (
        <ChatClient
            initialMessages={messages || []}
            currentUser={selfUser}
            otherUser={otherUser}
        />
    );
}
