"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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

// Define the form schema for the profile
const profileFormSchema = z.object({
    first_name: z.string().min(1, "First name is required.").max(50),
    last_name: z.string().min(1, "Last name is required.").max(50),
    about_me: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
    profile: Profile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
    const router = useRouter();
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            about_me: profile?.about_me || "",
        },
        mode: "onChange",
    });

    // Update form default values when the profile data loads
    useEffect(() => {
        if (profile) {
            form.reset({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                about_me: profile.about_me || "",
            });
        }
    }, [profile, form]);

    async function onSubmit(data: ProfileFormValues) {
        if (!profile) return;

        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: data.first_name,
                last_name: data.last_name,
                about_me: data.about_me,
            })
            .eq("id", profile.id);

        if (error) {
            console.error("Error updating profile:", error);
            // TODO: Show an error toast to the user
        } else {
            console.log("Profile updated successfully!");
            // TODO: Show a success toast to the user
            router.refresh();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="about_me"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>About Me</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us a little bit about yourself and your passions..."
                                    className="resize-none"
                                    {...field}
                                />
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
