import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PassionManager } from "@/components/profile/PassionManager";
import type { Profile, Passion, UserPassion } from "@/types";

export default async function EditProfilePage() {
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
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    // Fetch all necessary data in parallel
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single<Profile>();

    const { data: allPassionsData } = await supabase
        .from("passions")
        .select("*");

    const { data: userPassionsData } = await supabase
        .from("user_passions")
        .select("*")
        .eq("user_id", session.user.id);

    const allPassions: Passion[] = allPassionsData || [];
    const userPassions: UserPassion[] = userPassionsData || [];

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold">Edit Your Profile</h1>
                <p className="text-muted-foreground mt-2">
                    This information will be visible to other users on the platform.
                </p>
                <div className="mt-8">
                    <ProfileForm profile={profile} />
                </div>
            </div>

            <div>
                <PassionManager
                    allPassions={allPassions}
                    userPassions={userPassions}
                    userId={session.user.id}
                />
            </div>
        </div>
    );
}