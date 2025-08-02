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
    profile: ProfileWithPassions;
    currentUserId?: string;
}

export function ProfileCard({ profile, currentUserId }: ProfileCardProps) {
    const initials = `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Link href={`/messages/${profile.id}`}>
                        <Avatar className="h-16 w-16">
                             <AvatarImage src={`https://placehold.co/64x64/E2E8F0/475569?text=${initials}`} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="w-full">
                        <CardTitle className="text-xl">
                            <Link href={`/messages/${profile.id}`}>{profile.first_name} {profile.last_name}</Link>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{profile.location}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{profile.bio}</p>
                {currentUserId && <ProfileActions currentUserId={currentUserId} profileId={profile.id} />}
            </CardContent>
            <CardFooter>
                 <div className="flex flex-wrap gap-2">
                    {profile.passions.map((passion) => (
                        <Badge key={passion.id} variant="secondary">
                            {passion.name}
                        </Badge>
                    ))}
                </div>
            </CardFooter>
        </Card>
    );
}