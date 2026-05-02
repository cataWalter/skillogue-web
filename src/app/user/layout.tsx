import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View this member\'s passions, bio, and connect with them on Skillogue.',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
