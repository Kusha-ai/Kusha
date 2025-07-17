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
  description?: string
  features?: string[]
  hasApiKey: boolean
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
  'Fireworks AI': '#f59e0b'
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
  
  // Filter models by search term and API key availability
  const filteredModels = availableModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    // Only show models with API keys available
    return matchesSearch && model.hasApiKey
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
        No models available for the selected language. Please check your API keys or select a different language.
      </Alert>
    )
  }
  
  return (
    <Box>
      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search models..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        size="small"
      />
      
      {/* Models by Provider */}
      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.entries(modelsByProvider).map(([provider, models]) => {
          const availableModelsCount = models.filter(m => m.hasApiKey).length
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
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: PROVIDER_COLORS[provider] || 'grey.500',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                  }}
                >
                  {provider.split(' ').map(word => word[0]).join('').substring(0, 2)}
                </Avatar>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {provider}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {availableModelsCount} of {totalModelsCount} models available
                  </Typography>
                </Box>
                
                <Badge
                  badgeContent={models.filter(m => selectedModels.includes(m.id)).length}
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      right: 8,
                      top: 8,
                    },
                  }}
                >
                  <Chip
                    label={`${models.length} models`}
                    size="small"
                    variant="outlined"
                  />
                </Badge>
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
                        opacity: model.hasApiKey ? 1 : 0.6,
                      }}
                      onClick={() => model.hasApiKey && handleModelToggle(model.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedModels.includes(model.id)}
                              onChange={() => model.hasApiKey && handleModelToggle(model.id)}
                              disabled={!model.hasApiKey}
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
                            {model.hasApiKey ? (
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
                                    borderColor: model.hasApiKey ? 'primary.main' : 'grey.400',
                                    color: model.hasApiKey ? 'primary.main' : 'grey.600',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          
                          {!model.hasApiKey && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              API key required
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