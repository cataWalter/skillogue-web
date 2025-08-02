import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="py-4 px-6 md:px-12 border-b bg-white">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            Skillogue
          </Link>
          <Button asChild variant="ghost">
            <Link href="/login">Logout</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-grow container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to your Dashboard</h1>
        <p className="mt-4 text-gray-600">You have successfully logged in!</p>
      </main>
    </div>
  );
}