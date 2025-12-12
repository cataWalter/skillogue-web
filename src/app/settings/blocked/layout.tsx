'use client';

import ProtectedRoute from '../../../components/ProtectedRoute';

export default function BlockedUsersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
