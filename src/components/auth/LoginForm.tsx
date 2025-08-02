'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Define the validation schema for the form
const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export function LoginForm() {
  const searchParams = useSearchParams();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check for an error message in the URL (from server-side redirect)
  useEffect(() => {
    const errorMessage = searchParams.get('error');
    const errorDetails = searchParams.get('details'); // For logging

    if (errorMessage) {
      console.error('Login Error Redirect:', { errorMessage, errorDetails });
      form.setError('root', {
        type: 'server',
        message: 'Invalid login credentials. Please try again.',
      });
    }
  }, [searchParams, form]);

  // This function is kept for potential future use or validation logging,
  // but the primary submission is handled by the form's action attribute.
  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Form is being submitted. Awaiting server response...');
    // The actual submission is handled by the form action, not a JS function.
  };

  return (
    <Form {...form}>
      {/*
        The <form> element posts directly to the API route.
        The browser will handle the submission.
        Next.js will then handle the server-side logic in the API route.
      */}
      <form
        action="/api/auth/login"
        method="POST"
        className="space-y-6"
      >
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
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

        {/* Display server-side errors (like "Invalid Credentials") */}
        {form.formState.errors.root && (
          <FormMessage>{form.formState.errors.root.message}</FormMessage>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}