import type { Metadata } from 'next';
import ProtectedRoute from '../../components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Discover People',
  description: 'Search for people who share your passions. Filter by interests, city, age, and language.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
