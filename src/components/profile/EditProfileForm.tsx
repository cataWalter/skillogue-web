"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/types";
import { createClient } from "@/utils/supabase/client";

const profileFormSchema = z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters."),
    last_name: z.string().min(2, "Last name must be at least 2 characters."),
    about_me: z.string().max(500, "Bio must not exceed 500 characters.").optional(),
    location: z.string().optional(),
    age: z.coerce.number().positive().optional(),
    languages: z.string().optional(), // Input as a comma-separated string
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
    profile: Profile;
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
    const supabase = createClient();
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            about_me: profile.about_me || "",
            location: profile.location || "",
            age: profile.age || undefined,
            languages: profile.languages?.join(", ") || "",
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: data.first_name,
                last_name: data.last_name,
                about_me: data.about_me,
                location: data.location,
                age: data.age,
                // Convert comma-separated string back to an array
                languages: data.languages?.split(",").map((s) => s.trim()) || null,
            })
            .eq("id", profile.id);

        if (error) {
            console.error("Error updating profile:", error);
            // This is where you would trigger a toast notification for the error
        } else {
            console.log("Profile updated successfully!");
            // This is where you would trigger a toast notification for success
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* ... other form fields (first_name, last_name, about_me) remain the same ... */}

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., San Francisco, CA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Languages Spoken</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., English, Spanish, French" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit">Update Profile</Button>
            </form>
        </Form>
    );
}