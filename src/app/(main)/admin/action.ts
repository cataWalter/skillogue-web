// src/app/(main)/admin/actions.ts

'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Define a type for the report data for clarity
export type Report = {
    id: number;
    created_at: string;
    reason: string;
    reporter_id: string;
    reported_id: string;
    reporter_profile: {
        username: string;
    } | null;
    reported_profile: {
        username: string;
    } | null;
}

export async function getReports(): Promise<{ reports?: Report[], error?: string }> {
    const supabase = createClient()

    // First, check if the current user is an admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'You must be logged in to view this page.' }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || profile?.role !== 'admin') {
        return { error: 'You do not have permission to view this page.' }
    }

    // Fetch reports with reporter and reported usernames
    const { data: reports, error } = await supabase
        .from('reports')
        .select(`
            id,
            created_at,
            reason,
            reporter_id,
            reported_id,
            reporter_profile:profiles!reports_reporter_id_fkey ( username ),
            reported_profile:profiles!reports_reported_id_fkey ( username )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        return { error: "Failed to fetch reports." }
    }

    return { reports: reports as Report[] }
}

export async function resolveReport(reportId: number) {
    const supabase = createClient()

    // A simple resolution: just delete the report
    const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

    if (error) {
        return { error: 'Failed to resolve report.' }
    }

    revalidatePath('/admin') // Refresh the admin page data
    return { success: true }
}