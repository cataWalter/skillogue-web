'use server';

import { createClient } from '@/utils/supabase/server';

export async function getUserData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const userId = user.id;

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    // Fetch Passions
    const { data: passions } = await supabase
        .from('profile_passions')
        .select('passions(name)')
        .eq('profile_id', userId);

    // Fetch Languages
    const { data: languages } = await supabase
        .from('profile_languages')
        .select('languages(name)')
        .eq('profile_id', userId);

    // Fetch Sent Messages
    const { data: sentMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId);

    // Fetch Received Messages
    const { data: receivedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', userId);

    // Fetch Blocks
    const { data: blocks } = await supabase
        .from('blocks')
        .select('*')
        .eq('blocker_id', userId);

    return {
        user: {
            id: userId,
            email: user.email,
            ...profile
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        passions: passions?.map((p: any) => (Array.isArray(p.passions) ? p.passions[0]?.name : p.passions?.name)) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        languages: languages?.map((l: any) => (Array.isArray(l.languages) ? l.languages[0]?.name : l.languages?.name)) || [],
        messages: {
            sent: sentMessages || [],
            received: receivedMessages || []
        },
        blocked_users: blocks || []
    };
}