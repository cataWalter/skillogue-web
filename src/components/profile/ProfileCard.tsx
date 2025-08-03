import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Passion, Profile } from "@/types";
import { ProfileActions } from "./ProfileActions";

export type ProfileWithPassions = Profile & {
    passions: Passion[];
};

interface ProfileCardProps {
    // The profile prop is now optional to handle loading states gracefully.
    profile?: ProfileWithPassions;
    currentUserId?: string;
}

export function ProfileCard({ profile, currentUserId }: ProfileCardProps) {
    // If profile data isn't available yet, return a loading skeleton.
    // This prevents the "cannot read properties of undefined" error.
    if (!profile) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse" />
                        <div className="w-full space-y-2">
                            <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    const initials = `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    {/* Corrected link to point to the user's profile page */}
                    <Link href={`/user/${profile.id}`}>
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={profile.avatar_url || `https://placehold.co/64x64/E2E8F0/475569?text=${initials}`} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="w-full">
                        <CardTitle className="text-xl">
                            <Link href={`/user/${profile.id}`}>{profile.first_name} {profile.last_name}</Link>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{profile.location}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{profile.bio}</p>
                {/* Only show actions if it's not the current user's own profile */}
                {currentUserId && currentUserId !== profile.id && <ProfileActions currentUserId={currentUserId} profileId={profile.id} />}
            </CardContent>
            {/* Also check if passions array exists and has items before mapping */}
            {profile.passions && profile.passions.length > 0 && (
                <CardFooter>
                     <div className="flex flex-wrap gap-2">
                         {profile.passions.map((passion) => (
                             <Badge key={passion.id} variant="secondary">
                                 {passion.name}
                             </Badge>
                         ))}
                     </div>
                </CardFooter>
            )}
        </Card>
    );
}
