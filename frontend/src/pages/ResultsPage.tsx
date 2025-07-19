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
  ArrowUpward,
  ArrowDownward,
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
  icon_url?: string
  logo_url?: string
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
  const [startDate, setStartDate] = useState(() => {
    // Default to last 7 days
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0]
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [quickSort, setQuickSort] = useState('newest')

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

  // Helper functions (moved before they're used)
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

  const getProviderIcon = (providerName: string) => {
    // First try to find by name (for results data)
    let provider = providers.find(p => p.name.toLowerCase() === providerName.toLowerCase())
    // Fallback to ID matching (for other cases)
    if (!provider) {
      provider = providers.find(p => p.id.toLowerCase() === providerName.toLowerCase())
    }
    return provider?.icon_url || null
  }

  const filteredResults = results.filter(result => {
    // Fix provider filter: match selectedProvider (ID) with provider name from results
    const selectedProviderName = selectedProvider 
      ? providers.find(p => p.id === selectedProvider)?.name || selectedProvider
      : null
    const matchesProvider = !selectedProvider || result.provider === selectedProviderName
    
    const matchesLanguage = !selectedLanguage || result.language_code === selectedLanguage
    const matchesSearch = !searchTerm || 
      result.transcription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.model_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Date filtering
    const resultDate = new Date(result.created_at)
    const matchesStartDate = !startDate || resultDate >= new Date(startDate)
    const matchesEndDate = !endDate || resultDate <= new Date(endDate + 'T23:59:59')
    
    return matchesProvider && matchesLanguage && matchesSearch && matchesStartDate && matchesEndDate
  })

  // Sort filtered results
  const sortedResults = [...filteredResults].sort((a, b) => {
    let aValue = a[sortBy as keyof TestResult]
    let bValue = b[sortBy as keyof TestResult]
    
    // Handle different data types
    if (sortBy === 'created_at') {
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    } else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue as string).toLowerCase()
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const paginatedResults = sortedResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  // Calculate leaderboard data with percentile ranking
  const leaderboard = React.useMemo(() => {
    const providerStats = new Map()
    
    filteredResults.forEach(result => {
      const provider = result.provider
      if (!providerStats.has(provider)) {
        providerStats.set(provider, {
          provider,
          totalTests: 0,
          totalTime: 0,
          totalConfidence: 0,
          fastestTime: Infinity,
          color: getProviderColor(provider)
        })
      }
      
      const stats = providerStats.get(provider)
      stats.totalTests++
      stats.totalTime += result.processing_time
      stats.totalConfidence += result.accuracy_score
      stats.fastestTime = Math.min(stats.fastestTime, result.processing_time)
    })
    
    // Calculate averages and create leaderboard array
    const leaderboardArray = Array.from(providerStats.values()).map(stats => ({
      ...stats,
      avgTime: stats.totalTime / stats.totalTests,
      avgConfidence: (stats.totalConfidence / stats.totalTests) * 100,
      score: (stats.totalConfidence / stats.totalTests) * 100 / (stats.totalTime / stats.totalTests) // Confidence/Time ratio
    }))
    
    // Sort by average processing time (fastest first)
    const sortedArray = leaderboardArray.sort((a, b) => a.avgTime - b.avgTime)
    
    // Calculate percentile rankings (fastest provider = 100th percentile)
    const arrayWithPercentiles = sortedArray.map((provider, index) => ({
      ...provider,
      percentile: Math.round(((sortedArray.length - index) / sortedArray.length) * 100)
    }))
    
    return arrayWithPercentiles
  }, [filteredResults])

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 0: return '🥇'
      case 1: return '🥈' 
      case 2: return '🥉'
      default: return `#${rank + 1}`
    }
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setPage(0)
  }

  const handleQuickSort = (sortType: string) => {
    setQuickSort(sortType)
    switch (sortType) {
      case 'fastest':
        setSortBy('processing_time')
        setSortOrder('asc')
        break
      case 'slowest':
        setSortBy('processing_time')
        setSortOrder('desc')
        break
      case 'highest_confidence':
        setSortBy('accuracy_score')
        setSortOrder('desc')
        break
      case 'lowest_confidence':
        setSortBy('accuracy_score')
        setSortOrder('asc')
        break
      case 'newest':
        setSortBy('created_at')
        setSortOrder('desc')
        break
      case 'oldest':
        setSortBy('created_at')
        setSortOrder('asc')
        break
      default:
        break
    }
    setPage(0)
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
            
            <TextField
              size="small"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 160 }}
            />
            
            <TextField
              size="small"
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ minWidth: 160 }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={quickSort}
                label="Sort By"
                onChange={(e) => handleQuickSort(e.target.value)}
              >
                <MenuItem value="newest">🕒 Newest First</MenuItem>
                <MenuItem value="oldest">🕰️ Oldest First</MenuItem>
                <MenuItem value="fastest">⚡ Fastest Time</MenuItem>
                <MenuItem value="slowest">🐌 Slowest Time</MenuItem>
                <MenuItem value="highest_confidence">🎯 Highest Confidence</MenuItem>
                <MenuItem value="lowest_confidence">📉 Lowest Confidence</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedProvider('')
                setSelectedLanguage('')
                setSearchTerm('')
                // Reset to default last 7 days
                const date = new Date()
                date.setDate(date.getDate() - 7)
                setStartDate(date.toISOString().split('T')[0])
                setEndDate(new Date().toISOString().split('T')[0])
                setQuickSort('newest')
                setSortBy('created_at')
                setSortOrder('desc')
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

          {/* Enhanced Leaderboard Section */}
          {!loading && leaderboard.length > 0 && (
            <Card 
              sx={{ 
                mb: 4, 
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 2,
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    🏆 Speed Champions
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Top 3 Fastest ASR Providers
                  </Typography>
                  <Chip 
                    size="medium" 
                    label={`Based on ${filteredResults.length} test results`}
                    variant="outlined"
                    sx={{ 
                      fontWeight: 600,
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }}
                  />
                </Box>
                
                <Grid container spacing={3}>
                  {leaderboard.slice(0, 3).map((provider, index) => (
                    <Grid item xs={12} md={4} key={provider.provider}>
                      <Card 
                        elevation={index === 0 ? 12 : 6}
                        sx={{ 
                          position: 'relative',
                          borderRadius: 3,
                          overflow: 'visible',
                          transform: index === 0 ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.3s ease',
                          border: '2px solid',
                          borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                          background: index === 0 
                            ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,223,0,0.05) 100%)' 
                            : index === 1 
                            ? 'linear-gradient(135deg, rgba(192,192,192,0.15) 0%, rgba(220,220,220,0.05) 100%)'
                            : 'linear-gradient(135deg, rgba(205,127,50,0.15) 0%, rgba(210,150,75,0.05) 100%)',
                          '&:hover': {
                            transform: index === 0 ? 'scale(1.08)' : 'scale(1.03)',
                            boxShadow: index === 0 ? '0 25px 50px rgba(255,215,0,0.3)' : '0 15px 30px rgba(0,0,0,0.2)'
                          }
                        }}
                      >
                        {/* Rank Badge */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -15,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 10,
                            backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                            color: 'white',
                            borderRadius: '20px',
                            padding: '8px 16px',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                        >
                          #{index + 1} {getMedalEmoji(index)}
                        </Box>
                        
                        <CardContent sx={{ pt: 4, pb: 3 }}>
                          {/* Provider Header */}
                          <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                              {getProviderIcon(provider.provider) ? (
                                <Box
                                  component="img"
                                  src={getProviderIcon(provider.provider)}
                                  alt={provider.provider}
                                  sx={{ 
                                    width: 48, 
                                    height: 48,
                                    borderRadius: '12px',
                                    objectFit: 'contain',
                                    backgroundColor: 'background.paper',
                                    p: 1,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLElement
                                    target.style.display = 'none'
                                    const avatar = target.parentElement?.querySelector('.fallback-avatar') as HTMLElement
                                    if (avatar) avatar.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <Avatar
                                className="fallback-avatar"
                                sx={{ 
                                  bgcolor: provider.color, 
                                  width: 48, 
                                  height: 48,
                                  fontSize: '1.25rem',
                                  fontWeight: 'bold',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  display: getProviderIcon(provider.provider) ? 'none' : 'flex'
                                }}
                              >
                                {provider.provider.charAt(0)}
                              </Avatar>
                            </Box>
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 1 }}>
                              {provider.provider}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${provider.totalTests} tests`}
                              variant="outlined"
                              sx={{ 
                                fontWeight: 500,
                                borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                              }}
                            />
                          </Box>
                          
                          {/* Performance Metrics */}
                          <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Average Time
                                  </Typography>
                                  <Typography variant="h5" fontWeight="700" color="primary.main">
                                    {provider.avgTime.toFixed(2)}s
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Percentile
                                  </Typography>
                                  <Typography variant="h5" fontWeight="700" color="secondary.main">
                                    {provider.percentile}th
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                          
                          {/* Best Time Chip */}
                          <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Chip
                              label={`⚡ Best: ${provider.fastestTime.toFixed(2)}s`}
                              color="success"
                              variant="filled"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                px: 2,
                                py: 1
                              }}
                            />
                          </Box>
                          
                          {/* Speed Comparison */}
                          <Box 
                            sx={{ 
                              textAlign: 'center',
                              pt: 2,
                              borderTop: '2px solid',
                              borderColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                              borderStyle: 'dashed'
                            }}
                          >
                            {index === 0 ? (
                              <Box>
                                <Typography variant="body1" fontWeight="700" sx={{ color: '#FFD700', mb: 0.5 }}>
                                  👑 Champion
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Fastest Provider
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                <Typography variant="body1" fontWeight="600" color="text.primary" sx={{ mb: 0.5 }}>
                                  {((provider.avgTime - leaderboard[0].avgTime) / leaderboard[0].avgTime * 100).toFixed(0)}% slower
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  than champion
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
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
                      <TableCell 
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('provider')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Provider
                          {sortBy === 'provider' && (
                            sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('language_code')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Language
                          {sortBy === 'language_code' && (
                            sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('model_id')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          Model
                          {sortBy === 'model_id' && (
                            sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>Transcription</TableCell>
                      <TableCell 
                        align="center"
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('processing_time')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Speed fontSize="small" />
                          Processing Time
                          {sortBy === 'processing_time' && (
                            sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('accuracy_score')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Visibility fontSize="small" />
                          Confidence
                          {sortBy === 'accuracy_score' && (
                            sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        align="center"
                        sx={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('created_at')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          Date
                          {sortBy === 'created_at' && (
                            sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResults.map((result) => (
                      <TableRow key={result.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {getProviderIcon(result.provider) ? (
                              <Box
                                component="img"
                                src={getProviderIcon(result.provider)}
                                alt={result.provider}
                                sx={{ 
                                  width: 24, 
                                  height: 24,
                                  borderRadius: '50%',
                                  objectFit: 'contain',
                                  backgroundColor: 'background.paper',
                                  p: 0.25
                                }}
                                onError={(e) => {
                                  // Fallback to avatar with first character if icon fails to load
                                  const target = e.target as HTMLElement
                                  target.style.display = 'none'
                                  const avatar = target.parentElement?.querySelector('.table-fallback-avatar') as HTMLElement
                                  if (avatar) avatar.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <Avatar
                              className="table-fallback-avatar"
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: getProviderColor(result.provider),
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: getProviderIcon(result.provider) ? 'none' : 'flex'
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
                count={sortedResults.length}
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