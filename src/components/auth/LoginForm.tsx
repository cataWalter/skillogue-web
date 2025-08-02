"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// 1. Define the form schema with Zod
const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
});

export function LoginForm() {
    const router = useRouter();
    // State to hold any error messages from Supabase
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 2. Define your form using React Hook Form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // 3. Define a submit handler
    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Reset any previous error messages
        setErrorMessage(null);

        console.log("Attempting to sign in with:", values.email);

        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        });

        if (error) {
            // Log the full error to the browser console
            console.error("Login failed:", error);
            // Set the error message to display on the page
            setErrorMessage(error.message);
            return;
        }

        console.log("Login successful!");

        // On success, force a hard navigation to the homepage to ensure
        // the new session is picked up by the server and middleware.
        window.location.href = '/';
    }

    // 4. Build the form structure
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Display the error message here */}
                {errorMessage && (
                    <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                        {errorMessage}
                    </div>
                )}

                <Button type="submit" className="w-full">
                    Sign In
                </Button>
            </form>
        </Form>
    );
}
