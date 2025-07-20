import React from 'react'
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
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Visibility as ConfidenceIcon,
} from '@mui/icons-material'
import { formatProcessingTime } from '../utils/timeFormat'

interface TimingPhases {
  preparation_time: number
  network_time: number
  response_processing_time: number
  model_processing_time: number
}

interface TestResult {
  id: string
  modelId: string
  modelName: string
  provider: string
  provider_icon_url?: string
  success: boolean
  transcription?: string
  processingTime?: number
  api_call_time?: number
  total_processing_time?: number
  overhead_time?: number
  timing_phases?: TimingPhases
  confidence?: number
  error?: string
}

interface ResultsDisplayProps {
  results: TestResult[]
}

const PROVIDER_COLORS: Record<string, string> = {
  'google': '#4285f4',
  'sarv': '#ff6b35',
  'elevenlabs': '#7c3aed',
  'fireworks': '#f59e0b',
  'groq': '#10b981',
  'openai': '#00a67e',
}

// Provider Icon Component for Results
interface ProviderIconProps {
  provider_name: string
  provider_icon_url?: string
  size?: number
}

const ProviderIcon: React.FC<ProviderIconProps> = ({ provider_name, provider_icon_url, size = 24 }) => {
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
          // Fallback to Avatar if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = `
              <div style="
                width: ${size}px; 
                height: ${size}px; 
                background-color: ${PROVIDER_COLORS[provider_name.toLowerCase()] || '#666'}; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: ${size * 0.5}px;
              ">
                ${provider_name.substring(0, 1).toUpperCase()}
              </div>
            `
          }
        }}
      />
    )
  }

  // Fallback to Avatar
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: PROVIDER_COLORS[provider_name.toLowerCase()] || 'grey.500',
        fontSize: `${size * 0.5}px`,
        fontWeight: 'bold',
      }}
    >
      {provider_name.substring(0, 1).toUpperCase()}
    </Avatar>
  )
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No test results yet. Run a speed test to see results here.
        </Typography>
      </Box>
    )
  }
  
  const successfulResults = results.filter(r => r.success)
  const failedResults = results.filter(r => !r.success)
  
  // Sort by API call time (fastest first)
  const sortedResults = [...successfulResults].sort((a, b) => 
    (a.api_call_time || a.processingTime || 0) - (b.api_call_time || b.processingTime || 0)
  )
  
  const fastestResult = sortedResults[0]
  const avgApiTime = successfulResults.length > 0 
    ? successfulResults.reduce((sum, r) => sum + (r.api_call_time || r.processingTime || 0), 0) / successfulResults.length
    : 0
  const avgTotalTime = successfulResults.length > 0 
    ? successfulResults.reduce((sum, r) => sum + (r.total_processing_time || r.processingTime || 0), 0) / successfulResults.length
    : 0
  
  return (
    <Box>
      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {successfulResults.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Successful Tests
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="error.main">
            {failedResults.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Failed Tests
          </Typography>
        </Paper>
        
        {avgApiTime > 0 && (
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {avgApiTime.toFixed(2)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg API Time
            </Typography>
            {avgTotalTime > avgApiTime && (
              <Typography variant="caption" color="text.secondary">
                ({avgTotalTime.toFixed(2)}s total)
              </Typography>
            )}
          </Paper>
        )}
        
        {fastestResult && (
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {fastestResult.provider}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fastest Provider
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatProcessingTime(fastestResult.api_call_time || fastestResult.processingTime || 0)}
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Results Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Transcription</TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <SpeedIcon fontSize="small" />
                  Time (s)
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <ConfidenceIcon fontSize="small" />
                  Confidence
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...sortedResults, ...failedResults].map((result) => (
              <TableRow 
                key={result.id}
                sx={{
                  backgroundColor: result.success ? 'success.50' : 'error.50',
                  '&:hover': {
                    backgroundColor: result.success ? 'success.100' : 'error.100',
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {result.success ? (
                      <SuccessIcon color="success" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                    <Typography variant="body2" fontWeight="600">
                      {result.success ? 'Success' : 'Failed'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ProviderIcon
                      provider_name={result.provider}
                      provider_icon_url={result.provider_icon_url}
                      size={24}
                    />
                    <Typography variant="body2" fontWeight="600">
                      {result.provider}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {result.modelName}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  {result.success && result.transcription ? (
                    <Tooltip title={result.transcription}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        "{result.transcription}"
                      </Typography>
                    </Tooltip>
                  ) : result.error ? (
                    <Typography variant="body2" color="error.main">
                      {result.error}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No transcription
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell align="center">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {result.processingTime ? (
                      <>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          <Chip
                            label={`API: ${formatProcessingTime(result.api_call_time || result.processingTime)}`}
                            size="small"
                            color={result === fastestResult ? 'success' : 'primary'}
                            variant={result === fastestResult ? 'filled' : 'outlined'}
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                          {result.total_processing_time && (
                            <Chip
                              label={`Total: ${formatProcessingTime(result.total_processing_time)}`}
                              size="small"
                              color="default"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          {result.provider}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>
                          {result.modelName}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  {result.confidence ? (
                    <Chip
                      label={`${(result.confidence * 100).toFixed(1)}%`}
                      size="small"
                      color={result.confidence > 0.8 ? 'success' : result.confidence > 0.6 ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Timeline Chart for Model Performance */}
      {successfulResults.length > 0 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            📊 Model Performance Timeline
          </Typography>
          
          {/* Timeline Chart */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {successfulResults
              .sort((a, b) => (a.api_call_time || a.processingTime || 0) - (b.api_call_time || b.processingTime || 0))
              .map((result, index) => {
                const phases = result.timing_phases || {
                  preparation_time: (result.overhead_time || 0) * 0.3,
                  network_time: result.api_call_time || result.processingTime || 0,
                  response_processing_time: (result.overhead_time || 0) * 0.7,
                  model_processing_time: (result.api_call_time || result.processingTime || 0) * 0.8
                }
                
                const totalTime = phases.preparation_time + phases.network_time + phases.response_processing_time
                const maxTime = Math.max(...successfulResults.map(r => r.total_processing_time || r.processingTime || 0))
                
                return (
                  <Box key={result.id} sx={{ mb: 2 }}>
                    {/* Model Label */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <ProviderIcon
                        provider_name={result.provider}
                        provider_icon_url={result.provider_icon_url}
                        size={20}
                      />
                      <Typography variant="body2" fontWeight="600" sx={{ minWidth: 200 }}>
                        {result.provider} - {result.modelName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total: {formatProcessingTime(totalTime)}
                      </Typography>
                    </Box>
                    
                    {/* Timeline Bar */}
                    <Box sx={{ 
                      display: 'flex', 
                      width: '100%', 
                      height: 24, 
                      borderRadius: 1, 
                      overflow: 'hidden',
                      border: '1px solid #e0e0e0',
                      position: 'relative'
                    }}>
                      {/* Preparation Phase */}
                      <Box sx={{
                        width: `${(phases.preparation_time / maxTime) * 100}%`,
                        backgroundColor: '#ffeb3b', // Yellow
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: phases.preparation_time > 0 ? '2px' : '0px'
                      }}>
                        {phases.preparation_time > maxTime * 0.05 && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#333' }}>
                            {formatProcessingTime(phases.preparation_time)}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Network Phase */}
                      <Box sx={{
                        width: `${(phases.network_time / maxTime) * 100}%`,
                        backgroundColor: '#2196f3', // Blue
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: phases.network_time > 0 ? '2px' : '0px'
                      }}>
                        {phases.network_time > maxTime * 0.05 && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'white' }}>
                            {formatProcessingTime(phases.network_time)}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Response Processing Phase */}
                      <Box sx={{
                        width: `${(phases.response_processing_time / maxTime) * 100}%`,
                        backgroundColor: '#4caf50', // Green
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: phases.response_processing_time > 0 ? '2px' : '0px'
                      }}>
                        {phases.response_processing_time > maxTime * 0.05 && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'white' }}>
                            {formatProcessingTime(phases.response_processing_time)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Phase Legend */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, backgroundColor: '#ffeb3b', borderRadius: '2px' }} />
                        <Typography variant="caption">Prep: {formatProcessingTime(phases.preparation_time)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, backgroundColor: '#2196f3', borderRadius: '2px' }} />
                        <Typography variant="caption">Network: {formatProcessingTime(phases.network_time)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, backgroundColor: '#4caf50', borderRadius: '2px' }} />
                        <Typography variant="caption">Response: {formatProcessingTime(phases.response_processing_time)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )
              })}
          </Box>
          
          {/* Legend */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
              Timeline Phases:
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: '#ffeb3b', borderRadius: '2px' }} />
                <Typography variant="body2">🔧 Preparation (File I/O, Request Setup)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: '#2196f3', borderRadius: '2px' }} />
                <Typography variant="body2">🌐 Network (API Request & Model Processing)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '2px' }} />
                <Typography variant="body2">⚙️ Response Processing (Cleanup & Parse)</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Simple Summary for Single Result */}
      {results.length === 1 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
            Test Result
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tested 1 model: {results[0].provider} - {results[0].modelName}
            {results[0].success ? (
              <> completed in <strong>{formatProcessingTime(results[0].processingTime || 0)}</strong>.</>
            ) : (
              <> failed with error.</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ResultsDisplay