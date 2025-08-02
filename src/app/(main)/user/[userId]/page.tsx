import { notFound } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportUserButton } from "@/components/profile/ReportUserButton";
import type { Passion } from "@/types";

interface UserProfilePageProps {
    params: {
        userId: string;
    };
}

const getRandomAvatar = () => {
    const avatarCount = 2;
    const randomIndex = Math.floor(Math.random() * avatarCount) + 1;
    return `/default-avatars/avatar${randomIndex}.png`;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
    const supabase = createServerComponentClient();

    const { data: { session } } = await supabase.auth.getSession();

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("*, passions(*)")
        .eq("id", params.userId)
        .single();

    if (error || !profile) {
        notFound();
    }

    const initials = `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();
    const avatarUrl = getRandomAvatar();
    const passions = profile.passions as Passion[];

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={avatarUrl} alt={`${profile.first_name} ${profile.last_name}`} />
                            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-3xl">
                                    {profile.first_name} {profile.last_name}
                                </CardTitle>
                                {profile.verified && (
                                    <Badge className="bg-green-500">Verified</Badge>
                                )}
                            </div>
                            <p className="text-muted-foreground">
                                Joined on {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-muted-foreground">
                                {profile.location}
                            </p>
                        </div>
                        {session && session.user.id !== profile.id && (
                             <ReportUserButton
                                reporterId={session.user.id}
                                reportedUserId={profile.id}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold">About Me</h3>
                        <p className="mt-2 text-muted-foreground">
                            {profile.about_me || "No bio provided."}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Passions</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {passions && passions.length > 0 ? (
                                passions.map((passion) => (
                                    <Badge key={passion.id} variant="secondary">
                                        {passion.name}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No passions listed.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}