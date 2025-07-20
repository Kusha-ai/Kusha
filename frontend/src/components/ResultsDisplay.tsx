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
  provider_icon_url?: string
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
                        <Chip
                          label={formatProcessingTime(result.processingTime)}
                          size="small"
                          color={result === fastestResult ? 'success' : 'default'}
                          variant={result === fastestResult ? 'filled' : 'outlined'}
                        />
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
      
      {/* Timing Analysis by Provider */}
      {successfulResults.length > 1 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            ⏱️ Processing Time Analysis
          </Typography>
          
          {/* Provider Timing Breakdown */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mb: 2 }}>
            {Object.entries(
              successfulResults.reduce((acc, result) => {
                const provider = result.provider
                if (!acc[provider]) {
                  acc[provider] = []
                }
                acc[provider].push(result)
                return acc
              }, {} as Record<string, TestResult[]>)
            ).map(([provider, providerResults]) => {
              const avgTime = providerResults.reduce((sum, r) => sum + (r.processingTime || 0), 0) / providerResults.length
              const minTime = Math.min(...providerResults.map(r => r.processingTime || 0))
              const maxTime = Math.max(...providerResults.map(r => r.processingTime || 0))
              
              return (
                <Paper key={provider} sx={{ p: 2, border: '1px solid', borderColor: 'grey.300' }}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                    🏢 {provider}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                      📊 Average: <strong>{formatProcessingTime(avgTime)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      🚀 Fastest: <strong>{formatProcessingTime(minTime)}</strong>
                    </Typography>
                    <Typography variant="body2">
                      🐌 Slowest: <strong>{formatProcessingTime(maxTime)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Models tested: {providerResults.length}
                    </Typography>
                  </Box>
                  
                  {/* Individual Model Times */}
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="600" color="primary.main">
                      Model Performance:
                    </Typography>
                    {providerResults
                      .sort((a, b) => (a.processingTime || 0) - (b.processingTime || 0))
                      .map((result, index) => (
                      <Box key={result.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {result.modelName}
                        </Typography>
                        <Chip
                          label={formatProcessingTime(result.processingTime || 0)}
                          size="small"
                          color={index === 0 ? 'success' : 'default'}
                          variant={index === 0 ? 'filled' : 'outlined'}
                          sx={{ 
                            fontSize: '0.6rem', 
                            height: 20,
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )
            })}
          </Box>
          
          {/* Overall Summary */}
          <Typography variant="body2" color="text.secondary">
            📈 Tested {results.length} models across {Object.keys(successfulResults.reduce((acc, r) => ({...acc, [r.provider]: true}), {})).length} providers with {successfulResults.length} successful transcriptions.
            {fastestResult && (
              <> The fastest overall result was <strong>{fastestResult.provider}'s {fastestResult.modelName}</strong> 
              in <strong>{formatProcessingTime(fastestResult.processingTime || 0)}</strong>.</>
            )}
          </Typography>
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