'use client'

import { useEffect } from 'react'
import ErrorPage from '@/components/ErrorPage'

export default function SettingsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return <ErrorPage reset={reset} />
}
