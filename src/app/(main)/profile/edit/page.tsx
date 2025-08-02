import { redirect } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { VerifyProfile } from "@/components/profile/VerifyProfile";
import { Separator } from "@/components/ui/separator";

export default async function EditProfilePage() {
    const supabase = createServerComponentClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    if (!profile) {
        return <div>Profile not found.</div>;
    }

    return (
        <div className="container mx-auto max-w-2xl py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Edit Your Profile</h1>
                <p className="mt-2 text-muted-foreground">
                    Update your personal information and passions.
                </p>
                <Separator className="my-6" />
                <EditProfileForm profile={profile} />
            </div>
            <div>
                <h2 className="text-2xl font-bold">Account Settings</h2>
                 <Separator className="my-4" />
                <VerifyProfile isVerified={profile.verified} />
            </div>
        </div>
    );
}