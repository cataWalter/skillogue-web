import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile, Passion } from "@/types";

export type ProfileWithPassions = Profile & {
    passions: Passion[];
};

interface ProfileCardProps {
    profile: ProfileWithPassions;
}

const getRandomAvatar = () => {
    const avatarCount = 2;
    const randomIndex = Math.floor(Math.random() * avatarCount) + 1;
    return `/default-avatars/avatar${randomIndex}.png`;
};

export function ProfileCard({ profile }: ProfileCardProps) {
    const initials = `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();
    const avatarUrl = getRandomAvatar();

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={avatarUrl} alt={`${profile.first_name} ${profile.last_name}`} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                         <div className="flex items-center gap-2">
                             <CardTitle>
                                {profile.first_name} {profile.last_name}
                            </CardTitle>
                             {profile.verified && (
                                <Badge className="bg-green-500 text-xs" style={{ padding: '0.25rem 0.5rem' }}>Verified</Badge>
                            )}
                         </div>
                        <CardDescription>
                            Joined on {new Date(profile.created_at).toLocaleDateString()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="line-clamp-3 text-sm text-muted-foreground">
                    {profile.about_me || "This user hasn't written a bio yet."}
                </p>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                <div className="flex flex-wrap gap-2">
                    {profile.passions.slice(0, 5).map((passion) => (
                        <Badge key={passion.id} variant="secondary">
                            {passion.name}
                        </Badge>
                    ))}
                    {profile.passions.length > 5 && (
                        <Badge variant="outline">+{profile.passions.length - 5} more</Badge>
                    )}
                </div>
                <Link href={`/user/${profile.id}`} className="text-sm font-semibold text-primary hover:underline">
                    View Profile &rarr;
                </Link>
            </CardFooter>
        </Card>
    );
}