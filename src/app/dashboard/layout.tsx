import type { Metadata } from 'next';
import ProtectedRoute from '../../components/ProtectedRoute';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Skillogue dashboard — recent conversations, suggested profiles, and quick actions.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
