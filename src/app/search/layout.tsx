'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
