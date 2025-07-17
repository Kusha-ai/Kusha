import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material'
import {
  Analytics as AnalyticsIcon,
  Refresh,
  Download,
  FilterList,
  CheckCircle,
  Error,
  Speed,
  Visibility,
} from '@mui/icons-material'
import { formatProcessingTime } from '../utils/timeFormat'

interface TestResult {
  id: number
  provider: string
  model_id: string
  language_code: string
  audio_duration: number
  processing_time: number
  transcription: string
  accuracy_score: number
  created_at: string
}

interface Provider {
  id: string
  name: string
}

interface Language {
  code: string
  name: string
  flag: string
  region: string
}

const PROVIDER_COLORS: Record<string, string> = {
  'sarv': '#ff6b35',
  'google': '#4285f4',
  'elevenlabs': '#7c3aed',
  'fireworks': '#f59e0b'
}

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const fetchResults = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/test-results-extended?limit=1000')
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      
      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err)
    }
  }

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/languages')
      if (response.ok) {
        const data = await response.json()
        setLanguages(data.languages || [])
      }
    } catch (err) {
      console.error('Failed to fetch languages:', err)
    }
  }

  useEffect(() => {
    fetchResults()
    fetchProviders()
    fetchLanguages()
  }, [])

  const filteredResults = results.filter(result => {
    const matchesProvider = !selectedProvider || result.provider === selectedProvider
    const matchesLanguage = !selectedLanguage || result.language_code === selectedLanguage
    const matchesSearch = !searchTerm || 
      result.transcription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.model_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesProvider && matchesLanguage && matchesSearch
  })

  const paginatedResults = filteredResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getProviderColor = (provider: string) => {
    return PROVIDER_COLORS[provider.toLowerCase()] || '#9e9e9e'
  }

  const getLanguageFlag = (languageCode: string) => {
    const language = languages.find(l => l.code === languageCode)
    return language?.flag || '🌐'
  }

  const getLanguageName = (languageCode: string) => {
    const language = languages.find(l => l.code === languageCode)
    return language?.name || languageCode
  }

  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    return provider?.name || providerId
  }

  const getSuccessRate = () => {
    if (filteredResults.length === 0) return 0
    const successCount = filteredResults.filter(r => r.accuracy_score > 0).length
    return (successCount / filteredResults.length) * 100
  }

  const getAverageProcessingTime = () => {
    if (filteredResults.length === 0) return 0
    const sum = filteredResults.reduce((acc, r) => acc + r.processing_time, 0)
    return sum / filteredResults.length
  }

  const getAverageConfidence = () => {
    if (filteredResults.length === 0) return 0
    const sum = filteredResults.reduce((acc, r) => acc + r.accuracy_score, 0)
    return sum / filteredResults.length
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
          Test Results
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
          View and analyze historical ASR test results with advanced filtering
        </Typography>
      </Box>
      
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {filteredResults.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tests
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {getSuccessRate().toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {getAverageProcessingTime().toFixed(2)}s
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Processing Time
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {(getAverageConfidence() * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Confidence
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Card sx={{ background: 'rgba(255, 255, 255, 0.95)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnalyticsIcon sx={{ mr: 2, fontSize: '2rem', color: 'primary.main' }} />
              <Typography variant="h5" fontWeight="600">
                Historical Results
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchResults} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Data">
                <IconButton>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterList sx={{ color: 'text.secondary' }} />
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={selectedProvider}
                label="Provider"
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Providers</em>
                </MenuItem>
                {providers.map((provider) => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={selectedLanguage}
                label="Language"
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Languages</em>
                </MenuItem>
                {languages.map((language) => (
                  <MenuItem key={language.code} value={language.code}>
                    {language.flag} {language.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              size="small"
              label="Search transcription"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedProvider('')
                setSelectedLanguage('')
                setSearchTerm('')
                setPage(0)
              }}
            >
              Clear Filters
            </Button>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider</TableCell>
                      <TableCell>Language</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Transcription</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Speed fontSize="small" />
                          Processing Time
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Visibility fontSize="small" />
                          Confidence
                        </Box>
                      </TableCell>
                      <TableCell align="center">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResults.map((result) => (
                      <TableRow key={result.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: getProviderColor(result.provider),
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {getProviderName(result.provider).substring(0, 1).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight="600">
                              {getProviderName(result.provider)}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {getLanguageFlag(result.language_code)}
                            </Typography>
                            <Typography variant="body2">
                              {getLanguageName(result.language_code)}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={result.model_id}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        
                        <TableCell>
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
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            label={formatProcessingTime(result.processing_time)}
                            size="small"
                            color={result.processing_time < 1 ? 'success' : result.processing_time < 3 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            label={`${(result.accuracy_score * 100).toFixed(1)}%`}
                            size="small"
                            color={result.accuracy_score > 0.8 ? 'success' : result.accuracy_score > 0.6 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {new Date(result.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(result.created_at).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredResults.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default ResultsPage