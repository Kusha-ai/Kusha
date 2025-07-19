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
} from '@mui/material'
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

interface Model {
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
  languages: string[]
}

interface ModelSelectorProps {
  language: string
  availableProviders: string[]
  selectedModels: string[]
  onModelChange: (models: string[]) => void
  disabled: boolean
}

const PROVIDER_COLORS: Record<string, string> = {
  'Google Cloud Speech-to-Text': '#4285f4',
  'Sarv ASR (Indian Languages)': '#ff6b35', 
  'ElevenLabs': '#7c3aed',
  'Fireworks AI': '#f59e0b',
  'Groq': '#10b981',
  'OpenAI': '#00a67e',
  'google': '#4285f4',
  'sarv': '#ff6b35',
  'elevenlabs': '#7c3aed', 
  'fireworks': '#f59e0b',
  'groq': '#10b981',
  'openai': '#00a67e',
}

// Provider Icon Component
interface ProviderIconProps {
  provider_name: string
  provider_icon_url?: string
  size?: number
}

const ProviderIcon: React.FC<ProviderIconProps> = ({ provider_name, provider_icon_url, size = 32 }) => {
  if (provider_icon_url) {
    return (
      <Box
        component="img"
        src={provider_icon_url}
        alt={`${provider_name} icon`}
        sx={{
          width: size,
          height: size,
          borderRadius: '4px',
          objectFit: 'contain',
        }}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = `
              <div style="
                width: ${size}px; 
                height: ${size}px; 
                background-color: ${PROVIDER_COLORS[provider_name] || '#666'}; 
                border-radius: 4px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: ${size * 0.4}px;
              ">
                ${provider_name.split(' ').map(word => word[0]).join('').substring(0, 2)}
              </div>
            `
          }
        }}
      />
    )
  }

  // Fallback to initials
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: PROVIDER_COLORS[provider_name] || 'grey.500',
        fontSize: `${size * 0.4}px`,
        fontWeight: 'bold',
      }}
    >
      {provider_name.split(' ').map(word => word[0]).join('').substring(0, 2)}
    </Avatar>
  )
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  language,
  availableProviders,
  selectedModels,
  onModelChange,
  disabled
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProvider, setExpandedProvider] = useState<string | false>(false)
  const [loading, setLoading] = useState(false)
  const [availableModels, setAvailableModels] = useState<Model[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Fetch models for the selected language
  useEffect(() => {
    if (!language) {
      setAvailableModels([])
      return
    }
    
    const fetchModels = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/models/language/${encodeURIComponent(language)}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.statusText}`)
        }
        
        const data = await response.json()
        setAvailableModels(data.models || [])
      } catch (err) {
        console.error('Error fetching models:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch models')
        setAvailableModels([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchModels()
  }, [language])
  
  // Filter models by search term, API key availability, and activation status
  const filteredModels = availableModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (model.features?.some(feature => 
                           feature.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ?? false)
    
    // Only show models with API keys available AND provider is activated
    return matchesSearch && model.hasApiKey && model.isActivated
  })
  
  // Group models by provider
  const modelsByProvider = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider_name]) {
      acc[model.provider_name] = []
    }
    acc[model.provider_name].push(model)
    return acc
  }, {} as Record<string, Model[]>)
  
  const handleModelToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onModelChange(selectedModels.filter(id => id !== modelId))
    } else {
      onModelChange([...selectedModels, modelId])
    }
  }
  
  const handleProviderExpand = (provider: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedProvider(isExpanded ? provider : false)
  }
  
  if (disabled || !language) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Please select a language first
        </Typography>
      </Box>
    )
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading models...
        </Typography>
      </Box>
    )
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    )
  }
  
  if (filteredModels.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        No activated models available for the selected language. Please check your API keys and provider activation status, or select a different language.
      </Alert>
    )
  }
  
  return (
    <Box>
      {/* Search and Action Buttons */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search models, providers, features, or descriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          size="small"
          helperText={`Showing ${filteredModels.length} model(s) for ${language || 'selected language'}`}
        />
        
        {/* Action Buttons */}
        {filteredModels.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const allModelIds = filteredModels.map(model => model.id)
                onModelChange(allModelIds)
              }}
              disabled={selectedModels.length === filteredModels.length}
              startIcon={<CheckCircleIcon />}
              sx={{ 
                textTransform: 'none',
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: 'success.dark',
                  backgroundColor: 'success.50',
                }
              }}
            >
              Select All Models
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onModelChange([])}
              disabled={selectedModels.length === 0}
              startIcon={<ErrorIcon />}
              sx={{ 
                textTransform: 'none',
                borderColor: 'error.main',
                color: 'error.main',
                '&:hover': {
                  borderColor: 'error.dark',
                  backgroundColor: 'error.50',
                }
              }}
            >
              Reset Selection
            </Button>
          </Box>
        )}
      </Box>
      
      {/* Models by Provider */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.entries(modelsByProvider).map(([provider, models]) => {
          const availableModelsCount = models.filter(m => m.hasApiKey && m.isActivated).length
          const totalModelsCount = models.length
          
          return (
            <Accordion
              key={provider}
              expanded={expandedProvider === provider}
              onChange={handleProviderExpand(provider)}
              sx={{
                mb: 1,
                '&:before': { display: 'none' },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px !important',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                    gap: 2,
                  },
                }}
              >
                <ProviderIcon
                  provider_name={provider}
                  provider_icon_url={models[0]?.provider_icon_url}
                  size={32}
                />
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {provider}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {availableModelsCount} of {totalModelsCount} models available
                  </Typography>
                </Box>
                
                <Chip
                  label={`${models.length} models`}
                  size="small"
                  variant="outlined"
                />
              </AccordionSummary>
              
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {models.map((model) => (
                    <Paper
                      key={model.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: selectedModels.includes(model.id) 
                          ? `2px solid ${PROVIDER_COLORS[provider] || 'primary.main'}` 
                          : '1px solid',
                        borderColor: selectedModels.includes(model.id) 
                          ? PROVIDER_COLORS[provider] || 'primary.main'
                          : 'grey.300',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: PROVIDER_COLORS[provider] || 'primary.main',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        },
                        opacity: (model.hasApiKey && model.isActivated) ? 1 : 0.6,
                      }}
                      onClick={() => (model.hasApiKey && model.isActivated) && handleModelToggle(model.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedModels.includes(model.id)}
                              onChange={() => (model.hasApiKey && model.isActivated) && handleModelToggle(model.id)}
                              disabled={!(model.hasApiKey && model.isActivated)}
                              sx={{
                                color: PROVIDER_COLORS[provider] || 'primary.main',
                                '&.Mui-checked': {
                                  color: PROVIDER_COLORS[provider] || 'primary.main',
                                },
                              }}
                            />
                          }
                          label=""
                          sx={{ m: 0 }}
                        />
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {model.name}
                            </Typography>
                            {(model.hasApiKey && model.isActivated) ? (
                              <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                            ) : (
                              <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                            )}
                          </Box>
                          
                          {model.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {model.description}
                            </Typography>
                          )}
                          
                          {model.features && model.features.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {model.features.map((feature) => (
                                <Chip
                                  key={feature}
                                  label={feature}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    borderColor: (model.hasApiKey && model.isActivated) ? 'primary.main' : 'grey.400',
                                    color: (model.hasApiKey && model.isActivated) ? 'primary.main' : 'grey.600',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          
                          {!(model.hasApiKey && model.isActivated) && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              {!model.hasApiKey ? 'API key required' : 'Provider not activated'}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
      
      {/* Selected Models Summary */}
      {selectedModels.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
            Selected Models ({selectedModels.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedModels.map((modelId) => {
              const model = availableModels.find(m => m.id === modelId)
              if (!model) return null
              
              return (
                <Chip
                  key={modelId}
                  label={`${model.provider_name}: ${model.name}`}
                  onDelete={() => handleModelToggle(modelId)}
                  size="small"
                  sx={{
                    backgroundColor: PROVIDER_COLORS[model.provider_name] || 'primary.main',
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': {
                        color: 'white',
                      },
                    },
                  }}
                />
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default ModelSelector