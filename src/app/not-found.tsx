import Link from 'next/link'
import { Button } from '@/components/Button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-black text-white p-4 text-center">
      <div className="bg-gray-900/50 p-12 rounded-2xl border border-gray-800 shadow-2xl max-w-lg w-full">
        <h2 className="text-8xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">404</h2>
        <h3 className="text-2xl font-semibold mb-4">Page Not Found</h3>
        <p className="text-gray-400 mb-8">
          Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Home size={18} /> Return Home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Search size={18} /> Search Users
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
