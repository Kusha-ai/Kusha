import React, { useState } from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material'
import { formatProcessingTime } from '../utils/timeFormat'

interface TestResult {
  id: string
  modelId: string
  modelName: string
  provider: string
  success: boolean
  transcription?: string
  processingTime?: number
  confidence?: number
  error?: string
}

interface TestRunnerProps {
  language: string
  models: string[]
  audioFile: File | null
  onResults: (results: TestResult[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const TestRunner: React.FC<TestRunnerProps> = ({
  language,
  models,
  audioFile,
  onResults,
  isLoading,
  setIsLoading
}) => {
  const [currentTests, setCurrentTests] = useState<TestResult[]>([])
  const [progress, setProgress] = useState(0)
  
  const runTests = async () => {
    if (!audioFile || models.length === 0) {
      return
    }
    
    setIsLoading(true)
    setProgress(0)
    
    // Initialize test results with model info
    const initialResults: TestResult[] = models.map((modelId, index) => ({
      id: `test-${modelId}-${Date.now()}-${index}`, // Use modelId in ID for stability
      modelId,
      modelName: modelId.split('-').slice(1).join(' '), // Extract name from ID
      provider: modelId.split('-')[0], // Extract provider from ID
      success: false,
    }))
    
    setCurrentTests(initialResults)
    
    try {
      // Use the new API endpoint for simultaneous testing
      const formData = new FormData()
      formData.append('language', language)
      formData.append('model_ids', models.join(',')) // Send comma-separated model IDs
      formData.append('audio', audioFile)
      
      // Set all tests as running
      setCurrentTests(prev => prev.map(test => ({ ...test, running: true })))
      setProgress(50) // Show progress while waiting
      
      const response = await fetch('/api/test-multiple-models', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const results: TestResult[] = []
      
      // Process results from simultaneous API calls
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i]
        
        const testResult: TestResult = {
          id: `test-${i}`,
          modelId: `${result.provider_id}-${result.model_id}`,
          modelName: result.model_id || `${result.provider_id} model`,
          provider: result.provider || result.provider_id,
          success: result.success || false,
          transcription: result.transcription,
          processingTime: result.processing_time,
          confidence: result.confidence,
          error: result.error,
        }
        
        results.push(testResult)
        
        // Update the specific test result by ID for stable updates
        setCurrentTests(prev => prev.map(test => 
          test.id === testResult.id 
            ? { ...testResult, running: false } 
            : test
        ))
      }
      
      setProgress(100)
      onResults(results)
      
    } catch (error) {
      // Handle error by updating all tests
      const errorResults = initialResults.map(test => ({
        ...test,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        running: false,
      }))
      
      setCurrentTests(errorResults)
      onResults(errorResults)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Auto-run tests when triggered by parent
  React.useEffect(() => {
    if (isLoading && audioFile && models.length > 0) {
      runTests()
    }
  }, [isLoading])
  
  if (!isLoading && currentTests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Click "Run Speed Test" to start testing
        </Typography>
      </Box>
    )
  }
  
  return (
    <Box>
      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight="600">
              Running Tests... ({Math.round(progress)}% complete)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentTests.filter(t => t.success || t.error).length} / {currentTests.length} completed
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }} 
          />
        </Box>
      )}
      
      <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
        {currentTests.map((test, index) => {
          const isRunning = (test as any).running
          const isCompleted = test.success || test.error
          
          return (
            <ListItem
              key={test.id}
              sx={{
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                mb: 1,
                backgroundColor: isCompleted 
                  ? (test.success ? 'success.50' : 'error.50')
                  : isRunning 
                  ? 'warning.50'
                  : 'grey.50',
              }}
            >
              <ListItemIcon>
                {isRunning ? (
                  <PendingIcon color="warning" />
                ) : test.success ? (
                  <CheckIcon color="success" />
                ) : test.error ? (
                  <ErrorIcon color="error" />
                ) : (
                  <PlayIcon color="disabled" />
                )}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="600">
                      {test.modelName}
                    </Typography>
                    <Chip label={test.provider} size="small" variant="outlined" />
                  </Box>
                }
                secondary={
                  <Box>
                    {isRunning && (
                      <Typography variant="body2" color="warning.main">
                        Running transcription...
                      </Typography>
                    )}
                    {test.success && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          "{test.transcription}"
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Time: {formatProcessingTime(test.processingTime || 0)}
                          </Typography>
                          {test.confidence && (
                            <Typography variant="caption" color="text.secondary">
                              Confidence: {(test.confidence * 100).toFixed(1)}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    {test.error && (
                      <Typography variant="body2" color="error.main">
                        Error: {test.error}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          )
        })}
      </List>
      
      {currentTests.length > 0 && !isLoading && (
        <Alert 
          severity={currentTests.every(t => t.success) ? 'success' : 'info'} 
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Test completed! {currentTests.filter(t => t.success).length} of {currentTests.length} models succeeded.
        </Alert>
      )}
    </Box>
  )
}

export default TestRunner