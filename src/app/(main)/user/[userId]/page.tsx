import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Profile, Passion } from "@/types";
import { StartChatButton } from "@/components/profile/StartChatButton";

// This tells Next.js what the 'params' object will look like for this page
interface UserProfilePageProps {
    params: {
        userId: string;
    };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch the specific user's profile and their passions
    const { data: profile } = await supabase
        .from("profiles")
        .select(
            `
      *,
      user_passions (
        passions (
          id,
          name
        )
      )
    `
        )
        .eq("id", params.userId)
        .single();

    // If no profile is found for the given ID, show a 404 page
    if (!profile) {
        notFound();
    }

    // Transform the data to make it easier to work with
    const transformedProfile = {
        ...profile,
        passions: profile.user_passions.map((up: any) => up.passions) as Passion[],
    };

    const initials =
        `${transformedProfile.first_name?.charAt(0) ?? ""}${
            transformedProfile.last_name?.charAt(0) ?? ""
        }`.toUpperCase();

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <Card>
                <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <Avatar className="h-24 w-24">
                        <AvatarImage
                            src={`https://placehold.co/96x96/E2E8F0/475569?text=${initials}`}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold">
                            {transformedProfile.first_name} {transformedProfile.last_name}
                        </h1>
                        <p className="text-muted-foreground">
                            Joined on{" "}
                            {new Date(transformedProfile.created_at).toLocaleDateString()}
                        </p>
                        {user && (
                            <StartChatButton
                                currentUserId={user.id}
                                otherUserId={transformedProfile.id}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">About</h2>
                        <p className="mt-2 text-muted-foreground">
                            {transformedProfile.about_me || "No bio provided."}
                        </p>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Passions</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {transformedProfile.passions.length > 0 ? (
                                transformedProfile.passions.map((passion) => (
                                    <Badge key={passion.id} variant="secondary">
                                        {passion.name}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No passions listed.
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}