import { useState, useEffect } from 'react'

interface Language {
  code: string
  name: string
  flag: string
  region: string
}

interface UseLanguagesReturn {
  languages: Language[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useLanguages = (): UseLanguagesReturn => {
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLanguages = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/languages')
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.statusText}`)
      }

      const data = await response.json()
      setLanguages(data.languages || [])
    } catch (err) {
      console.error('Error fetching languages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch languages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLanguages()
  }, [])

  return {
    languages,
    loading,
    error,
    refetch: fetchLanguages
  }
}