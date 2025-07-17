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
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #ffffff 30%, #f8fafc 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          ASR Speed Test Platform
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            mb: 4,
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          Test and compare speech recognition providers across multiple languages and models
        </Typography>
      </Box>
      
      {/* Progress Indicator */}
      {(providersLoading || languagesLoading || isLoading) && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            sx={{ 
              borderRadius: 2,
              height: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'white',
              },
            }} 
          />
        </Box>
      )}
      
      <Grid container spacing={4}>
        {/* Step 1: Language Selection */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', background: 'rgba(255, 255, 255, 0.95)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Typography variant="h6" fontWeight="bold">1</Typography>
                </Avatar>
                <Typography variant="h5" fontWeight="600">
                  Select Language
                </Typography>
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
          <Card sx={{ height: '100%', background: 'rgba(255, 255, 255, 0.95)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: selectedLanguage ? 'primary.main' : 'grey.400', mr: 2 }}>
                  <Typography variant="h6" fontWeight="bold">2</Typography>
                </Avatar>
                <Typography variant="h5" fontWeight="600">
                  Select Models
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose one or more ASR models to test
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
          <Card sx={{ height: '100%', background: 'rgba(255, 255, 255, 0.95)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: selectedModels.length > 0 ? 'primary.main' : 'grey.400', mr: 2 }}>
                  <Typography variant="h6" fontWeight="bold">3</Typography>
                </Avatar>
                <Typography variant="h5" fontWeight="600">
                  Audio Input
                </Typography>
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
          <Card sx={{ background: 'rgba(255, 255, 255, 0.95)' }}>
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
            <Card sx={{ background: 'rgba(255, 255, 255, 0.95)' }}>
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