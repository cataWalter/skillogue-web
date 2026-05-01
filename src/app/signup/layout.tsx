import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Join Skillogue for free. No profile photos required — just your passions, a bio, and the people who get you.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
