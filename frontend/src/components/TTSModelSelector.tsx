import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Chip,
  Paper,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material'
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material'

interface TTSVoice {
  id: string
  name: string
  description: string
  gender: string
  accent?: string
  age?: string
}

interface TTSModel {
  id: string
  name: string
  provider_id: string
  provider_name: string
  provider_icon_url?: string
  provider_logo_url?: string
  description?: string
  features?: string[]
  hasApiKey: boolean
  isActivated: boolean
  voices: TTSVoice[]
  max_characters?: number
}

interface TTSModelSelectorProps {
  language: string
  providers: any[]
  selectedModels: string[]
  onModelChange: (models: string[]) => void
  selectedVoices: Record<string, string>
  onVoiceChange: (modelId: string, voiceId: string) => void
  disabled: boolean
}

const PROVIDER_COLORS: Record<string, string> = {
  'OpenAI Text-to-Speech': '#10a37f',
  'ElevenLabs Text-to-Speech': '#7c3aed',
  'Google Text-to-Speech': '#4285f4',
}

const TTSModelSelector: React.FC<TTSModelSelectorProps> = ({
  language,
  providers,
  selectedModels,
  onModelChange,
  selectedVoices,
  onVoiceChange,
  disabled
}) => {
  const [models, setModels] = useState<TTSModel[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({})

  const fetchModelsAndVoices = async () => {
    if (!language || providers.length === 0) {
      setModels([])
      return
    }

    setLoading(true)
    try {
      const allModels: TTSModel[] = []

      // Fetch models and voices for each activated provider
      for (const provider of providers.filter(p => p.isActivated)) {
        try {
          // Fetch models
          const modelsResponse = await fetch(`/api/tts/models?provider=${provider.id}&language=${language}`)
          if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json()

            // Fetch voices for each model separately
            for (const model of modelsData.models) {
              try {
                // Fetch voices specific to this model
                const voicesResponse = await fetch(`/api/tts/voices?provider=${provider.id}&language=${language}&model=${model.id}`)
                const voicesData = voicesResponse.ok ? await voicesResponse.json() : { voices: [] }

                allModels.push({
                  id: `${provider.id}-${model.id}`,
                  name: model.name,
                  provider_id: provider.id,
                  provider_name: provider.name || provider.id, // Fix: use fallback if name is undefined
                  provider_icon_url: provider.icon_url || '',
                  provider_logo_url: provider.logo_url || '',
                  description: model.description,
                  features: model.features || [],
                  hasApiKey: true, // Assume true if provider is activated
                  isActivated: true,
                  voices: voicesData.voices || [],
                  max_characters: model.max_characters
                })
              } catch (err) {
                console.error(`Error fetching voices for model ${model.id}:`, err)
                // Add model with empty voices if voice fetching fails
                allModels.push({
                  id: `${provider.id}-${model.id}`,
                  name: model.name,
                  provider_id: provider.id,
                  provider_name: provider.name || provider.id,
                  provider_icon_url: provider.icon_url || '',
                  provider_logo_url: provider.logo_url || '',
                  description: model.description,
                  features: model.features || [],
                  hasApiKey: true,
                  isActivated: true,
                  voices: [],
                  max_characters: model.max_characters
                })
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching models for ${provider.name || provider.id}:`, err)
        }
      }

      setModels(allModels)
    } catch (err) {
      console.error('Error fetching TTS models:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModelsAndVoices()
  }, [language, providers])

  const handleModelToggle = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    const newSelectedModels = selectedModels.includes(modelId)
      ? selectedModels.filter(id => id !== modelId)
      : [...selectedModels, modelId]
    
    // If selecting a model and it has voices, set the first voice as default
    if (!selectedModels.includes(modelId) && model && model.voices.length > 0 && !selectedVoices[modelId]) {
      onVoiceChange(modelId, model.voices[0].id)
    }
    
    onModelChange(newSelectedModels)
  }

  const handleSelectAllForProvider = (providerId: string) => {
    const providerModels = filteredModels.filter(m => m.provider_id === providerId)
    const providerModelIds = providerModels.map(m => m.id)
    const allSelected = providerModelIds.every(id => selectedModels.includes(id))
    
    if (allSelected) {
      // Deselect all provider models
      onModelChange(selectedModels.filter(id => !providerModelIds.includes(id)))
    } else {
      // Select all provider models
      const newSelectedModels = [...selectedModels]
      providerModelIds.forEach(id => {
        if (!newSelectedModels.includes(id)) {
          newSelectedModels.push(id)
          // Set default voice for newly selected models
          const model = providerModels.find(m => m.id === id)
          if (model && model.voices.length > 0 && !selectedVoices[id]) {
            onVoiceChange(id, model.voices[0].id)
          }
        }
      })
      onModelChange(newSelectedModels)
    }
  }

  const handleResetSelection = () => {
    onModelChange([])
  }

  const handlePanelToggle = (providerId: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }))
  }

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.features?.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const groupedModels = filteredModels.reduce((acc, model) => {
    const providerId = model.provider_id
    if (!acc[providerId]) {
      acc[providerId] = {
        provider: {
          id: providerId,
          name: model.provider_name,
          icon_url: model.provider_icon_url,
          logo_url: model.provider_logo_url,
        },
        models: []
      }
    }
    acc[providerId].models.push(model)
    return acc
  }, {} as Record<string, { provider: any, models: TTSModel[] }>)

  if (disabled) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Please select a language first to load available TTS models.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading TTS models...
        </Typography>
      </Box>
    )
  }

  if (models.length === 0) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        No TTS models available for the selected language. Please check your provider configurations.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Search and Controls */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search models, providers, or features..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button 
            size="small" 
            onClick={() => {
              const modelIds = filteredModels.map(m => m.id)
              onModelChange(modelIds)
              // Set default voice for each newly selected model
              filteredModels.forEach(model => {
                if (!selectedModels.includes(model.id) && model.voices.length > 0 && !selectedVoices[model.id]) {
                  onVoiceChange(model.id, model.voices[0].id)
                }
              })
            }}
            disabled={filteredModels.length === 0}
          >
            Select All Models
          </Button>
          <Button 
            size="small" 
            onClick={handleResetSelection}
            disabled={selectedModels.length === 0}
          >
            Reset Selection
          </Button>
        </Box>
      </Box>

      {/* Provider Groups */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.entries(groupedModels).map(([providerId, { provider, models: providerModels }]) => {
          const selectedCount = providerModels.filter(m => selectedModels.includes(m.id)).length
          const totalCount = providerModels.length
          
          return (
            <Accordion
              key={providerId}
              expanded={expandedPanels[providerId] || false}
              onChange={() => handlePanelToggle(providerId)}
              sx={{ 
                mb: 1, 
                borderRadius: 2,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                  <Avatar
                    src={provider.icon_url}
                    sx={{
                      width: 32,
                      height: 32,
                      mr: 2,
                      bgcolor: PROVIDER_COLORS[provider.name] || 'grey.400'
                    }}
                  >
                    <VolumeUpIcon />
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600">
                      {provider.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {totalCount} model{totalCount !== 1 ? 's' : ''} • {providerModels.reduce((sum, m) => sum + m.voices.length, 0)} voices
                    </Typography>
                  </Box>
                  
                  <Badge
                    badgeContent={selectedCount}
                    color="primary"
                    sx={{ mr: 2 }}
                  >
                    <CheckCircleIcon color={selectedCount > 0 ? 'primary' : 'disabled'} />
                  </Badge>
                  
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectAllForProvider(providerId)
                    }}
                  >
                    {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
                  </Button>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ pl: 1 }}>
                  {providerModels.map((model) => (
                    <Paper
                      key={model.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        border: selectedModels.includes(model.id) ? 2 : 1,
                        borderColor: selectedModels.includes(model.id) ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => handleModelToggle(model.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedModels.includes(model.id)}
                              onChange={() => handleModelToggle(model.id)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="subtitle2" fontWeight="600">
                                {model.name}
                              </Typography>
                              {model.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {model.description}
                                </Typography>
                              )}
                              {model.max_characters && (
                                <Typography variant="caption" color="text.secondary">
                                  Max characters: {model.max_characters}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </Box>
                      
                      {/* Features */}
                      {model.features && model.features.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Features:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {model.features.map((feature) => (
                              <Chip
                                key={feature}
                                label={feature}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Voice Selection */}
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Voice Selection ({model.voices.length} available):
                        </Typography>
                        {model.voices.length > 0 ? (
                          <FormControl size="small" sx={{ minWidth: 200, mb: 1 }}>
                            <InputLabel>Select Voice</InputLabel>
                            <Select
                              value={selectedVoices[model.id] || (model.voices.length > 0 ? model.voices[0].id : '')}
                              label="Select Voice"
                              onChange={(e) => onVoiceChange(model.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {model.voices.map((voice) => (
                                <MenuItem key={voice.id} value={voice.id}>
                                  <Box>
                                    <Typography variant="body2" fontWeight="500">
                                      {voice.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {voice.gender} • {voice.accent || 'Default'} • {voice.age || 'N/A'}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            No voices available for this model/language combination
                          </Alert>
                        )}
                        
                        {/* Show other available voices as chips for reference */}
                        {model.voices.length > 1 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Other available voices:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {model.voices.filter(v => v.id !== selectedVoices[model.id]).slice(0, 3).map((voice) => (
                                <Chip
                                  key={voice.id}
                                  label={`${voice.name} (${voice.gender})`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                              {model.voices.filter(v => v.id !== selectedVoices[model.id]).length > 3 && (
                                <Chip
                                  label={`+${model.voices.filter(v => v.id !== selectedVoices[model.id]).length - 3} more`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>

      {/* Selection Summary */}
      {selectedModels.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
            Selected: {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total voices: {models.filter(m => selectedModels.includes(m.id)).reduce((sum, m) => sum + m.voices.length, 0)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default TTSModelSelector