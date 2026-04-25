'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}
