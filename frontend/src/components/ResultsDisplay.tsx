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

interface ResultsDisplayProps {
  results: TestResult[]
}

const PROVIDER_COLORS: Record<string, string> = {
  'google': '#4285f4',
  'sarv': '#ff6b35',
  'elevenlabs': '#7c3aed',
  'fireworks': '#f59e0b'
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
  
  // Sort by processing time (fastest first)
  const sortedResults = [...successfulResults].sort((a, b) => 
    (a.processingTime || 0) - (b.processingTime || 0)
  )
  
  const fastestResult = sortedResults[0]
  const avgProcessingTime = successfulResults.length > 0 
    ? successfulResults.reduce((sum, r) => sum + (r.processingTime || 0), 0) / successfulResults.length
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
        
        {avgProcessingTime > 0 && (
          <Paper sx={{ p: 2, flex: 1, minWidth: 200, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {avgProcessingTime.toFixed(2)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average Time
            </Typography>
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
              {formatProcessingTime(fastestResult.processingTime || 0)}
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
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: PROVIDER_COLORS[result.provider.toLowerCase()] || 'grey.500',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {result.provider.substring(0, 1).toUpperCase()}
                    </Avatar>
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
                  {result.processingTime ? (
                    <Chip
                      label={formatProcessingTime(result.processingTime)}
                      size="small"
                      color={result === fastestResult ? 'success' : 'default'}
                      variant={result === fastestResult ? 'filled' : 'outlined'}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
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
      
      {/* Summary */}
      {results.length > 1 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
            Test Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tested {results.length} models with {successfulResults.length} successful transcriptions.
            {fastestResult && (
              <> The fastest result was from {fastestResult.provider} with {fastestResult.modelName} 
              in {formatProcessingTime(fastestResult.processingTime || 0)}.</>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ResultsDisplay