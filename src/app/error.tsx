'use client'

import { useEffect } from 'react'
import { reportProblem } from '@/lib/track'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // A page that crashed: the owner's /admin lists these under Issues.
  useEffect(() => {
    reportProblem('client_error', error.message || 'Page crashed', { kind: 'page crashed', digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
