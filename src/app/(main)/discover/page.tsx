import { createServerComponentClient } from "@/lib/supabase/server";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import {
    ProfileCard,
    ProfileWithPassions,
} from "@/components/profile/ProfileCard";
import { Separator } from "@/components/ui/separator";

interface DiscoverPageProps {
    searchParams: {
        name?: string;
        location?: string;
        age?: string;
        languages?: string;
    };
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
    const supabase = createServerComponentClient();

    let query = supabase.from("profiles").select("*, passions(*)");

    // Apply filters based on searchParams
    if (searchParams.name) {
        // Using ilike for case-insensitive search
        query = query.ilike("first_name", `%${searchParams.name}%`);
    }

    if (searchParams.location) {
        query = query.ilike("location", `%${searchParams.location}%`);
    }

    if (searchParams.age) {
        query = query.eq("age", parseInt(searchParams.age, 10));
    }

    if (searchParams.languages) {
        // 'cs' operator checks if the array contains the specified value(s)
        query = query.cs("languages", `{${searchParams.languages}}`);
    }

    const { data: profiles, error } = await query;

    if (error) {
        console.error("Error fetching profiles:", error);
        // Optionally, render an error message to the user
    }

    // Cast the fetched data to the correct type
    const profilesWithPassions: ProfileWithPassions[] = profiles || [];

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1">
                    <h2 className="text-2xl font-bold">Discover Filters</h2>
                    <Separator className="my-4" />
                    <DiscoverFilters />
                </aside>
                <main className="md:col-span-3">
                    <h1 className="text-3xl font-bold">Find New Connections</h1>
                    <p className="mt-2 text-muted-foreground">
                        Browse profiles to find people with similar passions.
                    </p>
                    <Separator className="my-6" />
                    {profilesWithPassions.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {profilesWithPassions.map((profile) => (
                                <ProfileCard key={profile.id} profile={profile} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold">No Profiles Found</h3>
                            <p className="text-muted-foreground mt-2">
                                Try adjusting your filters to find more people.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}