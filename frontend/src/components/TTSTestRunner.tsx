import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Alert,
} from '@mui/material'
import { VolumeUp as VolumeUpIcon } from '@mui/icons-material'

interface TTSTestRunnerProps {
  language: string
  models: string[]
  text: string
  onResults: (results: any[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const TTSTestRunner: React.FC<TTSTestRunnerProps> = ({
  language,
  models,
  text,
  onResults,
  isLoading,
  setIsLoading,
}) => {
  useEffect(() => {
    const runTTSTests = async () => {
      if (!language || models.length === 0 || !text.trim() || !isLoading) {
        return
      }

      try {
        const results: any[] = []

        // Process each selected model
        for (const modelId of models) {
          const [providerId, modelName] = modelId.split('-', 2)
          
          try {
            // Fetch voices for this provider and language
            const voicesResponse = await fetch(`/api/tts/voices?provider=${providerId}&language=${language}`)
            if (!voicesResponse.ok) {
              throw new Error(`Failed to fetch voices: ${voicesResponse.statusText}`)
            }
            
            const voicesData = await voicesResponse.json()
            const voices = voicesData.voices || []
            
            if (voices.length === 0) {
              results.push({
                success: false,
                provider: providerId,
                model: modelName,
                voice: 'N/A',
                audio_url: '',
                processing_time: 0,
                character_count: text.length,
                error: 'No voices available for this model/language combination'
              })
              continue
            }

            // Generate audio for all voices of this model
            const generateResponse = await fetch('/api/tts/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: text,
                language: language,
                provider: providerId,
                model: modelName,
                voices: voices.map((v: any) => v.id), // Use all voices
              }),
            })

            if (!generateResponse.ok) {
              throw new Error(`Failed to generate audio: ${generateResponse.statusText}`)
            }

            const generateData = await generateResponse.json()
            
            // Add results for each voice
            if (generateData.results) {
              results.push(...generateData.results)
            }

          } catch (error) {
            console.error(`Error testing model ${modelId}:`, error)
            results.push({
              success: false,
              provider: providerId,
              model: modelName,
              voice: 'N/A',
              audio_url: '',
              processing_time: 0,
              character_count: text.length,
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
          }
        }

        onResults(results)
      } catch (error) {
        console.error('Error running TTS tests:', error)
        onResults([{
          success: false,
          provider: 'System',
          model: 'N/A',
          voice: 'N/A',
          audio_url: '',
          processing_time: 0,
          character_count: text.length,
          error: 'Failed to run TTS tests: ' + (error instanceof Error ? error.message : 'Unknown error')
        }])
      } finally {
        setIsLoading(false)
      }
    }

    runTTSTests()
  }, [language, models, text, isLoading, onResults, setIsLoading])

  if (!isLoading) {
    return null
  }

  return (
    <Box>
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <VolumeUpIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Generating Audio
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Testing {models.length} model{models.length !== 1 ? 's' : ''} with multiple voices for language: {language}
          </Typography>
          
          <LinearProgress 
            sx={{ 
              borderRadius: 1,
              height: 6,
              mb: 2,
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
              },
            }} 
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Text length: {text.length} characters
            </Typography>
            <Typography variant="body2" color="primary.main" fontWeight="600">
              Processing...
            </Typography>
          </Box>
        </CardContent>
      </Card>
      
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>What's happening:</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • Fetching available voices for each selected model<br/>
          • Generating audio samples for all voice variants<br/>
          • Measuring processing times and audio quality<br/>
          • Preparing results for comparison
        </Typography>
      </Alert>
    </Box>
  )
}

export default TTSTestRunner