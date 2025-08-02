import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
    ProfileCard,
    type ProfileWithPassions,
} from "@/components/profile/ProfileCard";
import type { Passion } from "@/types";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";

export default async function DiscoverPage({
                                               searchParams,
                                           }: {
    searchParams?: {
        name?: string;
        passionId?: string;
    };
}) {
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

    // This is a more complex query to fetch profiles and their associated passions
    let query = supabase.from("profiles").select(
        `
      *,
      user_passions (
        passions (
          id,
          name
        )
      )
    `
    );

    if (searchParams?.name) {
        query = query.ilike("first_name", `%${searchParams.name}%`);
    }

    if (searchParams?.passionId) {
        query = query
            .from("user_passions")
            .select(
                `
        profiles (
          *,
          user_passions (
            passions (
              id,
              name
            )
          )
        )
      `
            )
            .eq("passion_id", searchParams.passionId)
            .neq("profiles", null)
            .returns<any[]>();
    }

    const { data: profiles, error } = await query;

    const { data: allPassionsData } = await supabase
        .from("passions")
        .select("*");

    const allPassions: Passion[] = allPassionsData || [];

    if (error) {
        console.error("Error fetching profiles:", error);
        return <p>Could not load profiles.</p>;
    }

    // Transform the data to match our ProfileWithPassions type
    const profilesWithPassions: ProfileWithPassions[] = profiles.map(
        (profile: any) => ({
            ...(profile.profiles ? profile.profiles : profile),
            passions: profile.user_passions.map(
                (up: any) => up.passions
            ) as Passion[],
        })
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Discover People</h1>
                <p className="text-muted-foreground mt-2">
                    Find and connect with others who share your passions.
                </p>
            </div>

            <DiscoverFilters allPassions={allPassions} />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {profilesWithPassions.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} />
                ))}
            </div>
        </div>
    );
}