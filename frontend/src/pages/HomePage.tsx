import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
} from '@mui/material'
import {
  Mic as MicIcon,
  CloudUpload as UploadIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material'
import LanguageSelector from '../components/LanguageSelector'
import ModelSelector from '../components/ModelSelector'
import AudioRecorder from '../components/AudioRecorder'
import TestRunner from '../components/TestRunner'
import ResultsDisplay from '../components/ResultsDisplay'
import { useProviders } from '../hooks/useProviders'
import { useLanguages } from '../hooks/useLanguages'

const HomePage: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const { providers, availableProviders, loading: providersLoading } = useProviders()
  const { languages, loading: languagesLoading } = useLanguages()
  
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language)
    setSelectedModels([]) // Reset models when language changes
  }
  
  const handleModelChange = (models: string[]) => {
    setSelectedModels(models)
  }
  
  const handleAudioReady = (file: File) => {
    setAudioFile(file)
  }
  
  const handleRunTests = async () => {
    if (!selectedLanguage || selectedModels.length === 0 || !audioFile) {
      return
    }
    
    setIsLoading(true)
    // TestRunner component will handle the actual test execution
    // and set isLoading to false when complete
  }
  
  const canRunTests = selectedLanguage && selectedModels.length > 0 && audioFile && !isLoading
  
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        p: 4,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            color: 'white',
            mb: 2,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          Kusha Platform
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.95)',
            mb: 2,
            maxWidth: 600,
            mx: 'auto',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          Test and compare speech recognition providers across multiple languages and models
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="6 Providers" 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
            }} 
          />
          <Chip 
            label="60+ Languages" 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
            }} 
          />
          <Chip 
            label="Real-time Testing" 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 600,
            }} 
          />
        </Box>
      </Box>
      
      {/* Progress Indicator */}
      {(providersLoading || languagesLoading || isLoading) && (
        <Box sx={{ 
          mb: 3, 
          p: 2,
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}>
          <Typography variant="body2" color="white" sx={{ mb: 2, textAlign: 'center' }}>
            {providersLoading ? 'Loading providers...' : languagesLoading ? 'Loading languages...' : 'Running tests...'}
          </Typography>
          <LinearProgress 
            sx={{ 
              borderRadius: 3,
              height: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
                borderRadius: 3,
              },
            }} 
          />
        </Box>
      )}
      
      <Grid container spacing={4}>
        {/* Step 1: Language Selection */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: '100%', 
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  mr: 2, 
                  width: 48, 
                  height: 48,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}>
                  <Typography variant="h5" fontWeight="bold">1</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="600" color="primary.main">
                    Select Language
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 1 of 3
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose the language for speech recognition testing
              </Typography>
              
              <LanguageSelector
                languages={languages}
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
                loading={languagesLoading}
              />
              
              {selectedLanguage && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Language selected! Now choose your models.
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Step 2: Model Selection */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: '100%', 
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: selectedLanguage ? 'primary.main' : 'grey.400', 
                  mr: 2,
                  width: 48, 
                  height: 48,
                  boxShadow: selectedLanguage ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(148, 163, 184, 0.3)',
                }}>
                  <Typography variant="h5" fontWeight="bold">2</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="600" color={selectedLanguage ? 'primary.main' : 'grey.500'}>
                    Select Models
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 2 of 3
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose one or more AI models to test
              </Typography>
              
              <ModelSelector
                language={selectedLanguage}
                availableProviders={availableProviders}
                selectedModels={selectedModels}
                onModelChange={handleModelChange}
                disabled={!selectedLanguage}
              />
              
              {selectedModels.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                    Selected Models ({selectedModels.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedModels.slice(0, 3).map((modelId) => (
                      <Chip
                        key={modelId}
                        label={modelId.split('-')[0]}
                        size="small"
                        color="primary"
                      />
                    ))}
                    {selectedModels.length > 3 && (
                      <Chip
                        label={`+${selectedModels.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Step 3: Audio Input */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: '100%', 
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: selectedModels.length > 0 ? 'primary.main' : 'grey.400', 
                  mr: 2,
                  width: 48, 
                  height: 48,
                  boxShadow: selectedModels.length > 0 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 4px 12px rgba(148, 163, 184, 0.3)',
                }}>
                  <Typography variant="h5" fontWeight="bold">3</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="600" color={selectedModels.length > 0 ? 'primary.main' : 'grey.500'}>
                    Audio Input
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Step 3 of 3
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Record audio or upload an audio file
              </Typography>
              
              <AudioRecorder
                onAudioReady={handleAudioReady}
                disabled={selectedModels.length === 0}
                language={selectedLanguage}
              />
              
              {audioFile && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Audio ready! You can now run the tests.
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Test Controls */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon sx={{ mr: 2, fontSize: '2rem', color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight="600">
                    Speed Test Controls
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayIcon />}
                  onClick={handleRunTests}
                  disabled={!canRunTests}
                  sx={{
                    minWidth: 180,
                    background: canRunTests 
                      ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                      : undefined,
                    '&:hover': {
                      background: canRunTests 
                        ? 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)'
                        : undefined,
                    },
                  }}
                >
                  {isLoading ? 'Testing...' : 'Run Speed Test'}
                </Button>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <TestRunner
                language={selectedLanguage}
                models={selectedModels}
                audioFile={audioFile}
                onResults={setTestResults}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Results */}
        {testResults.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <CardContent>
                <Typography variant="h5" fontWeight="600" sx={{ mb: 3 }}>
                  Test Results
                </Typography>
                <ResultsDisplay results={testResults} />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default HomePage