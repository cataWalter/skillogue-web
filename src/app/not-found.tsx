import Link from 'next/link'
import { Button } from '@/components/Button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-xl mb-8">Page Not Found</p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  )
}
