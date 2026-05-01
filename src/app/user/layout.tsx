import type { Metadata } from 'next';
import ProtectedRoute from '../../components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View this member\'s passions, bio, and connect with them on Skillogue.',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
