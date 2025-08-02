import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import type {Profile, Passion} from "@/types";

// We need to define a new type that combines profile data with passion names
export type ProfileWithPassions = Profile & {
    passions: Passion[];
};

interface ProfileCardProps {
    profile: ProfileWithPassions;
}

export function ProfileCard({profile}: ProfileCardProps) {
    const initials =
        `${profile.first_name?.charAt(0) ?? ""}${profile.last_name?.charAt(0) ?? ""}`.toUpperCase();

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar>
                        {/* In the future, this will be a randomly generated image */}
                        <AvatarImage src={`https://placehold.co/40x40/E2E8F0/475569?text=${initials}`}/>
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>
                            {profile.first_name} {profile.last_name}
                        </CardTitle>
                        <CardDescription>
                            {/* We can add location here later */}
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
                <Link href={`/user/${profile.id}`} className="text-sm font-semibold">
                    View Profile &rarr;
                </Link>
            </CardFooter>
        </Card>
    );
}
