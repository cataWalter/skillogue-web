import Link from 'next/link';
import { Button } from '@/components/ui/button';

// In a real app, you'd get this from an auth context or session
const user = {
  name: 'Jane Doe',
};

export default function Header() {
  return (
    <header className="py-4 px-6 md:px-12 border-b bg-white">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          Skillogue
        </Link>
        <div className="space-x-4 flex items-center">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Profile
              </Link>
              <Link href="/discover" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Discover
              </Link>
              <Button asChild variant="ghost">
                <Link href="/logout">Logout</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}