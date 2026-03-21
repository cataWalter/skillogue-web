'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
