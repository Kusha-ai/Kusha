import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Download as DownloadIcon,
  VolumeUp as VolumeIcon,
} from '@mui/icons-material'
import { formatProcessingTime } from '../utils/timeFormat'

interface TTSResult {
  success: boolean
  provider: string
  model: string
  voice: string
  audio_url: string
  processing_time: number
  character_count: number
  cost?: number
  error?: string
}

interface TTSResultsDisplayProps {
  results: TTSResult[]
}

const TTSResultsDisplay: React.FC<TTSResultsDisplayProps> = ({ results }) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const playAudio = (audioUrl: string, resultId: string) => {
    if (playingAudio === resultId) {
      // Stop current audio
      setPlayingAudio(null)
      return
    }

    if (!audioUrl) {
      return
    }

    setPlayingAudio(resultId)
    const audio = new Audio(audioUrl)
    audio.onended = () => setPlayingAudio(null)
    audio.onerror = () => setPlayingAudio(null)
    audio.play().catch(() => setPlayingAudio(null))
  }

  const downloadAudio = (audioUrl: string, provider: string, voice: string, model: string) => {
    if (!audioUrl || audioUrl.startsWith('data:')) {
      // For data URLs, create a temporary link
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `tts-${provider}-${model}-${voice}.mp3`
      link.click()
    }
  }

  const successfulResults = results.filter(r => r.success)
  const failedResults = results.filter(r => !r.success)

  const averageProcessingTime = successfulResults.length > 0
    ? successfulResults.reduce((sum, r) => sum + r.processing_time, 0) / successfulResults.length
    : 0

  if (results.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        No results to display. Run a test to see TTS generation results here.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SuccessIcon sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6" fontWeight="600">
              {successfulResults.length}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Successful generations
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
            <Typography variant="h6" fontWeight="600">
              {failedResults.length}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Failed generations
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              {formatProcessingTime(averageProcessingTime)}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Average processing time
          </Typography>
        </Paper>
      </Box>

      {/* Results Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Voice</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Processing Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Characters</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Audio Controls</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result, index) => {
              const resultId = `${result.provider}-${result.model}-${result.voice}-${index}`
              
              return (
                <TableRow 
                  key={resultId}
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    bgcolor: result.success ? 'inherit' : 'error.light',
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                        <VolumeIcon />
                      </Avatar>
                      <Typography variant="body2" fontWeight="600">
                        {result.provider || 'Unknown Provider'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {result.model}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {result.voice}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {result.success ? (
                      <Chip
                        icon={<SuccessIcon />}
                        label="Success"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Tooltip title={result.error || 'Unknown error'} arrow>
                        <Chip
                          icon={<ErrorIcon />}
                          label="Failed"
                          color="error"
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SpeedIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight="500">
                        {formatProcessingTime(result.processing_time)}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {result.character_count}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {result.success && result.audio_url ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Play audio">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => playAudio(result.audio_url, resultId)}
                          >
                            {playingAudio === resultId ? <PauseIcon /> : <PlayIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download audio">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => downloadAudio(result.audio_url, result.provider, result.voice, result.model)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        No audio
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Error Details */}
      {failedResults.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Error Details
          </Typography>
          {failedResults.map((result, index) => (
            <Alert 
              key={`error-${result.provider}-${result.model}-${result.voice}-${index}`} 
              severity="error" 
              sx={{ mb: 1, borderRadius: 2 }}
            >
              <Typography variant="subtitle2" fontWeight="600">
                {result.provider} - {result.model} - {result.voice}
              </Typography>
              <Typography variant="body2">
                {result.error || 'Unknown error occurred'}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Performance Analysis */}
      {successfulResults.length > 1 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Performance Comparison
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'primary.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Voice</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Processing Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {successfulResults
                  .sort((a, b) => a.processing_time - b.processing_time)
                  .map((result, index) => (
                    <TableRow key={`perf-${result.provider}-${result.voice}-${index}`}>
                      <TableCell>
                        <Chip
                          label={`#${index + 1}`}
                          color={index === 0 ? 'success' : index === 1 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{result.provider || 'Unknown Provider'}</TableCell>
                      <TableCell>{result.voice}</TableCell>
                      <TableCell>{formatProcessingTime(result.processing_time)}</TableCell>
                      <TableCell>
                        {index === 0 && <Chip label="Fastest" color="success" size="small" />}
                        {index === successfulResults.length - 1 && successfulResults.length > 1 && (
                          <Chip label="Slowest" color="error" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  )
}

export default TTSResultsDisplay