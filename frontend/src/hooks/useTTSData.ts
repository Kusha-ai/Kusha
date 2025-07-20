import { useState, useEffect } from 'react'

interface TTSVoice {
  id: string
  name: string
  description: string
  gender: string
  accent?: string
  age?: string
  supported_languages: string[]
}

interface TTSModel {
  id: string
  name: string
  description: string
  max_characters?: number
  supported_formats?: string[]
  features: string[]
  supported_languages: string[]
  voices?: TTSVoice[]
}

interface TTSProvider {
  id: string
  name: string
  description: string
  icon_url?: string
  logo_url?: string
  isActivated: boolean
}

interface TTSLanguage {
  code: string
  name: string
  flag: string
  region: string
  providers: string[]
}

interface UseTTSDataReturn {
  languages: TTSLanguage[]
  providers: TTSProvider[]
  models: TTSModel[]
  voices: TTSVoice[]
  loading: boolean
  error: string | null
  selectedLanguage: string
  selectedProvider: string
  selectedModel: string
  selectedVoices: string[]
  setSelectedLanguage: (language: string) => void
  setSelectedProvider: (provider: string) => void
  setSelectedModel: (model: string) => void
  setSelectedVoices: (voices: string[]) => void
  refetch: () => void
}

export const useTTSData = (): UseTTSDataReturn => {
  const [languages, setLanguages] = useState<TTSLanguage[]>([])
  const [providers, setProviders] = useState<TTSProvider[]>([])
  const [models, setModels] = useState<TTSModel[]>([])
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedVoices, setSelectedVoices] = useState<string[]>([])

  const fetchTTSData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use the same languages endpoint as ASR (for consistency)
      const languagesResponse = await fetch('/api/languages')
      if (!languagesResponse.ok) {
        throw new Error(`Failed to fetch languages: ${languagesResponse.statusText}`)
      }
      const languagesData = await languagesResponse.json()
      
      // Filter languages to only include those supported by TTS providers
      const ttsLanguagesResponse = await fetch('/api/tts/languages')
      let ttsLanguages = []
      if (ttsLanguagesResponse.ok) {
        const ttsData = await ttsLanguagesResponse.json()
        ttsLanguages = ttsData.languages || []
      }
      
      // Use TTS-specific languages if available, otherwise use all languages
      setLanguages(ttsLanguages.length > 0 ? ttsLanguages : languagesData.languages || [])

      // Fetch TTS providers
      const providersResponse = await fetch('/api/tts/providers')
      if (!providersResponse.ok) {
        throw new Error(`Failed to fetch providers: ${providersResponse.statusText}`)
      }
      const providersData = await providersResponse.json()
      setProviders(providersData.providers || [])

    } catch (err) {
      console.error('Error fetching TTS data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch TTS data')
    } finally {
      setLoading(false)
    }
  }

  const fetchModelsAndVoices = async (language: string, provider: string) => {
    if (!language || !provider) {
      setModels([])
      setVoices([])
      return
    }

    try {
      // Fetch models for selected provider and language
      const modelsResponse = await fetch(`/api/tts/models?provider=${provider}&language=${language}`)
      if (!modelsResponse.ok) {
        throw new Error(`Failed to fetch models: ${modelsResponse.statusText}`)
      }
      const modelsData = await modelsResponse.json()
      setModels(modelsData.models || [])

      // Fetch voices for selected provider and language
      const voicesResponse = await fetch(`/api/tts/voices?provider=${provider}&language=${language}`)
      if (!voicesResponse.ok) {
        throw new Error(`Failed to fetch voices: ${voicesResponse.statusText}`)
      }
      const voicesData = await voicesResponse.json()
      setVoices(voicesData.voices || [])

    } catch (err) {
      console.error('Error fetching models/voices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch models/voices')
    }
  }

  useEffect(() => {
    fetchTTSData()
  }, [])

  useEffect(() => {
    if (selectedLanguage && selectedProvider) {
      fetchModelsAndVoices(selectedLanguage, selectedProvider)
      // Reset selections when language/provider changes
      setSelectedModel('')
      setSelectedVoices([])
    }
  }, [selectedLanguage, selectedProvider])

  return {
    languages,
    providers,
    models,
    voices,
    loading,
    error,
    selectedLanguage,
    selectedProvider,
    selectedModel,
    selectedVoices,
    setSelectedLanguage,
    setSelectedProvider,
    setSelectedModel,
    setSelectedVoices,
    refetch: fetchTTSData
  }
}