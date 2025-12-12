'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
