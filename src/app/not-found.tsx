import Link from 'next/link'
import { Button } from '@/components/Button'
import { Home, Search } from 'lucide-react'
import { marketingPageCopy } from '../lib/app-copy'

export default function NotFound() {
  const { notFound } = marketingPageCopy

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-background text-foreground p-4 text-center">
      <div className="bg-surface/50 p-12 rounded-2xl border border-line/30 shadow-2xl max-w-lg w-full">
        <h2 className="text-8xl font-bold mb-4 bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-transparent">404</h2>
        <h3 className="text-2xl font-semibold mb-4">{notFound.pageNotFound}</h3>
        <p className="text-faint mb-8">
          {notFound.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Home size={18} /> {notFound.returnHome}
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Search size={18} /> {notFound.searchUsers}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
