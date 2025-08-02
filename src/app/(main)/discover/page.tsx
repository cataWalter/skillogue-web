// Import createServerClient directly from the ssr package
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Database } from "@/lib/database.types";

type Profile = Database['public']['Tables']['profiles']['Row'];

export default async function DiscoverPage() {
  // Move the cookieStore and Supabase client creation inside the component
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("profiles")
    .select(
      `*,
      passions (
        id,
        name
      )`
    )
    .neq("id", user?.id);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b">
        <DiscoverFilters />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users?.map((u: Profile) => (
            <ProfileCard user={u} key={u.id} />
          ))}
        </div>
      </div>
    </div>
  );
}