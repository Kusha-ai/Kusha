import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  IconButton,
  Chip,
  Input,
} from '@mui/material'
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  VolumeUp as VolumeIcon,
} from '@mui/icons-material'

interface AudioRecorderProps {
  onAudioReady: (file: File) => void
  disabled: boolean
  language: string
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  disabled,
  language
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])
  
  const startRecording = async () => {
    try {
      setError(null)
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser. Please use file upload instead.')
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        })
        
        setAudioBlob(audioBlob)
        
        // Create URL for playback
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        
        // Create File object and pass to parent
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: audioBlob.type
        })
        onAudioReady(audioFile)
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setError(error instanceof Error ? error.message : 'Failed to start recording')
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }
  
  const playRecording = () => {
    if (audioUrl) {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current.currentTime = 0
      }
      
      const audio = new Audio(audioUrl)
      audioElementRef.current = audio
      
      audio.onplay = () => setIsPlaying(true)
      audio.onpause = () => setIsPlaying(false)
      audio.onended = () => setIsPlaying(false)
      
      audio.play().catch(console.error)
    }
  }
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file')
        return
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }
      
      setError(null)
      setUploadedFile(file)
      onAudioReady(file)
      
      // Create URL for playback
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setAudioBlob(null) // Clear recorded audio
    }
  }
  
  const clearAudio = () => {
    setAudioBlob(null)
    setUploadedFile(null)
    setIsPlaying(false)
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const hasAudio = audioBlob || uploadedFile
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Recording Controls */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          border: '2px dashed', 
          borderColor: hasAudio ? 'success.main' : 'grey.300',
          borderRadius: 2,
          textAlign: 'center',
          backgroundColor: hasAudio ? 'success.50' : 'grey.50',
          transition: 'all 0.3s ease',
        }}
      >
        {!isRecording && !hasAudio && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <MicIcon sx={{ fontSize: '3rem', color: 'grey.400', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Record Audio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click to start recording your speech for testing
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<MicIcon />}
                onClick={startRecording}
                disabled={disabled}
                sx={{
                  background: 'linear-gradient(45deg, #ef4444 30%, #dc2626 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #dc2626 30%, #b91c1c 90%)',
                  },
                }}
              >
                Start Recording
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Upload File
              </Button>
            </Box>
          </Box>
        )}
        
        {isRecording && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    mr: 2,
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(0.95)',
                        boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
                      },
                      '70%': {
                        transform: 'scale(1)',
                        boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)',
                      },
                      '100%': {
                        transform: 'scale(0.95)',
                        boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)',
                      },
                    },
                  }}
                />
                <Typography variant="h6" color="error.main">
                  Recording...
                </Typography>
              </Box>
              
              <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ mb: 2 }}>
                {formatTime(recordingTime)}
              </Typography>
              
              <LinearProgress 
                variant="indeterminate" 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'error.main',
                  },
                }} 
              />
            </Box>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{
                background: 'linear-gradient(45deg, #666 30%, #444 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #444 30%, #222 90%)',
                },
              }}
            >
              Stop Recording
            </Button>
          </Box>
        )}
        
        {hasAudio && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <VolumeIcon sx={{ fontSize: '3rem', color: 'success.main', mb: 1 }} />
              <Typography variant="h6" color="success.main">
                Audio Ready
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {uploadedFile ? `File: ${uploadedFile.name}` : `Recording: ${formatTime(recordingTime)}`}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PlayIcon />}
                onClick={playRecording}
                disabled={isPlaying}
              >
                {isPlaying ? 'Playing...' : 'Play Audio'}
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={clearAudio}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      {/* Audio element for playback */}
      <audio ref={audioElementRef} style={{ display: 'none' }} />
      
      {/* Recording tips */}
      {!hasAudio && !isRecording && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Tips for better results:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip label="Speak clearly" size="small" variant="outlined" />
            <Chip label="Minimize background noise" size="small" variant="outlined" />
            <Chip label="Hold device close" size="small" variant="outlined" />
            <Chip label="Use supported formats" size="small" variant="outlined" />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default AudioRecorder