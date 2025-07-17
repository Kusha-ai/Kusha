import { useState, useEffect } from 'react'

interface Provider {
  id: string
  name: string
  requires_api_key: boolean
  api_key_type: string
  hasApiKey?: boolean
}

interface Model {
  id: string
  name: string
  provider_id: string
  provider_name: string
  description?: string
  features?: string[]
  languages: string[]
}

interface UseProvidersReturn {
  providers: Provider[]
  availableProviders: string[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useProviders = (): UseProvidersReturn => {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/providers')
      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`)
      }

      const data = await response.json()
      setProviders(data.providers || [])
    } catch (err) {
      console.error('Error fetching providers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch providers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  // Get list of providers that have API keys configured
  const availableProviders = providers
    .filter(provider => !provider.requires_api_key || provider.hasApiKey)
    .map(provider => provider.id)

  return {
    providers,
    availableProviders,
    loading,
    error,
    refetch: fetchProviders
  }
}