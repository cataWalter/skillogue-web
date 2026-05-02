'use client'

import { Button } from '@/components/Button'
import { errorPageCopy } from '@/lib/app-copy'

interface ErrorPageProps {
    reset: () => void
}

export default function ErrorPage({ reset }: ErrorPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <h2 className="text-2xl font-bold mb-4">{errorPageCopy.title}</h2>
            <p className="text-faint mb-6">{errorPageCopy.subtitle}</p>
            <Button onClick={reset}>{errorPageCopy.tryAgain}</Button>
        </div>
    )
}
