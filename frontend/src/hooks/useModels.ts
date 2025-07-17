import { useState, useEffect } from 'react'

interface Model {
  id: string
  name: string
  provider_id: string
  provider_name: string
  description?: string
  features?: string[]
  languages: string[]
  hasApiKey: boolean
}

interface UseModelsReturn {
  models: Model[]
  loading: boolean
  error: string | null
  refetch: () => void
  getModelsForLanguage: (languageCode: string) => Model[]
}

export const useModels = (): UseModelsReturn => {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/models')
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()
      setModels(data.models || [])
    } catch (err) {
      console.error('Error fetching models:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const getModelsForLanguage = (languageCode: string): Model[] => {
    return models.filter(model => 
      model.languages.includes(languageCode) && 
      model.hasApiKey // Only show models with API keys available
    )
  }

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
    getModelsForLanguage
  }
}