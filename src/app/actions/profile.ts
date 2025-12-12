'use server'

import { createClient } from '../../utils/supabase/server'
import { profileSchema } from '../../lib/schemas'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Extend the schema to include arrays for languages and passions which are handled separately in the DB
const updateProfileSchema = profileSchema.extend({
    languages: z.array(z.string()),
    passions: z.array(z.string())
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfileAction(data: UpdateProfileInput) {
    const result = updateProfileSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: 'Validation failed', details: result.error.flatten().fieldErrors };
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { first_name, last_name, about_me, age, gender, location, languages, passions } = result.data;

    try {
        // 1. Update Location
        let location_id = null;
        if (location && location.country) {
            const { data: locData, error: locError } = await supabase
                .from('locations')
                .insert([location])
                .select()
                .single();
            
            if (locError) throw locError;
            location_id = locData.id;
        }

        // 2. Update Profile
        const profileUpdate: Record<string, unknown> = {
            first_name,
            last_name,
            about_me,
            age,
            gender,
            updated_at: new Date().toISOString(),
        };

        if (location_id) {
            profileUpdate.location_id = location_id;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 3. Update Languages
        // First get IDs for the language names
        if (languages.length > 0) {
            const { data: langData } = await supabase.from('languages').select('id, name').in('name', languages);
            
            if (langData) {
                await supabase.from('profile_languages').delete().eq('profile_id', user.id);
                
                const languageInserts = langData.map(l => ({
                    profile_id: user.id,
                    language_id: l.id
                }));
                
                if (languageInserts.length > 0) {
                    await supabase.from('profile_languages').insert(languageInserts);
                }
            }
        } else {
             await supabase.from('profile_languages').delete().eq('profile_id', user.id);
        }

        // 4. Update Passions
        if (passions.length > 0) {
            const { data: passionData } = await supabase.from('passions').select('id, name').in('name', passions);
            
            if (passionData) {
                await supabase.from('profile_passions').delete().eq('profile_id', user.id);
                
                const passionInserts = passionData.map(p => ({
                    profile_id: user.id,
                    passion_id: p.id
                }));
                
                if (passionInserts.length > 0) {
                    await supabase.from('profile_passions').insert(passionInserts);
                }
            }
        } else {
            await supabase.from('profile_passions').delete().eq('profile_id', user.id);
        }

        revalidatePath('/profile');
        revalidatePath(`/user/${user.id}`);
        
        return { success: true };

    } catch (error: unknown) {
        console.error('Server Action Error:', error);
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        return { success: false, error: message };
    }
}
