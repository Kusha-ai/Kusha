import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Analytics,
  Speed,
  Language,
  Assessment,
  TrendingUp,
  CheckCircle,
  Error,
  Timer,
  GraphicEq,
  Refresh,
  Download,
  Logout,
  VpnKey,
} from '@mui/icons-material'
import { formatTableTime } from '../utils/timeFormat'
import ApiKeyManager from './ApiKeyManager'

interface AdminDashboardProps {
  accessToken: string
  onLogout: () => void
}

interface DashboardData {
  provider_performance: any
  language_performance: any
  recording_analysis: any
  test_volume: any
  recent_tests: any[]
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ accessToken, onLogout }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [currentTab, setCurrentTab] = useState(0)

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/analytics/dashboard?days=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          return
        }
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      
      if (data.success) {
        setDashboardData(data.data)
      } else {
        setError(data.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [selectedPeriod])

  // formatDuration function removed - now using utility function

  const getProviderStats = () => {
    if (!dashboardData?.provider_performance?.providers) return []
    
    return dashboardData.provider_performance.providers.buckets.map((bucket: any) => ({
      name: bucket.key,
      tests: bucket.doc_count,
      avgTime: bucket.avg_processing_time?.value || 0,
      avgConfidence: bucket.avg_confidence?.value || 0,
      avgSpeed: bucket.avg_inference_speed?.value || 0,
      languages: bucket.languages?.buckets?.length || 0,
    }))
  }

  const getLanguageStats = () => {
    if (!dashboardData?.language_performance?.languages) return []
    
    return dashboardData.language_performance.languages.buckets.map((bucket: any) => ({
      name: bucket.key,
      tests: bucket.doc_count,
      avgTime: bucket.avg_processing_time?.value || 0,
      avgConfidence: bucket.avg_confidence?.value || 0,
      avgSpeed: bucket.avg_inference_speed?.value || 0,
      providers: bucket.providers?.buckets?.length || 0,
    }))
  }

  const getRecordingAnalysis = () => {
    if (!dashboardData?.recording_analysis?.duration_buckets) return []
    
    return dashboardData.recording_analysis.duration_buckets.buckets.map((bucket: any) => ({
      duration: `${bucket.key}-${bucket.key + 5}s`,
      tests: bucket.doc_count,
      avgTime: bucket.avg_processing_time?.value || 0,
      avgConfidence: bucket.avg_confidence?.value || 0,
      avgSpeed: bucket.avg_inference_speed?.value || 0,
    }))
  }

  const getRecentTests = () => {
    if (!dashboardData?.recent_tests) return []
    
    return dashboardData.recent_tests.slice(0, 10).map((test: any) => ({
      provider: test.provider,
      model: test.model_name || test.model_id,
      language: test.language,
      duration: test.audio_duration || 0,
      processingTime: test.processing_time || 0,
      confidence: test.confidence || 0,
      success: test.success,
      timestamp: new Date(test.timestamp),
    }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: '2rem', color: 'white' }} />
          <Typography variant="h4" fontWeight="600" color="white" sx={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            Admin Dashboard
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {currentTab === 0 && (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  label="Time Period"
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                </Select>
              </FormControl>
              
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchDashboardData} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          <Button
            variant="contained"
            startIcon={<Logout />}
            onClick={onLogout}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ 
        mb: 3,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              fontSize: '1rem',
              fontWeight: 600,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<Analytics />}
            label="Analytics Dashboard"
            iconPosition="start"
            sx={{ 
              minHeight: 72,
              gap: 1,
            }}
          />
          <Tab
            icon={<VpnKey />}
            label="API Key Management"
            iconPosition="start"
            sx={{ 
              minHeight: 72,
              gap: 1,
            }}
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {dashboardData?.recent_tests?.length || 0}
                  </Typography>
                  <Typography variant="body2">
                    Total Tests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Speed sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {getProviderStats().length}
                  </Typography>
                  <Typography variant="body2">
                    Active Providers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Language sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {getLanguageStats().length}
                  </Typography>
                  <Typography variant="body2">
                    Languages Tested
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {((getProviderStats().reduce((acc, p) => acc + p.avgConfidence, 0) / Math.max(1, getProviderStats().length)) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Avg Confidence
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Provider Performance */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics color="primary" />
                Provider Performance
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider</TableCell>
                      <TableCell align="right">Tests</TableCell>
                      <TableCell align="right">Avg Time</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getProviderStats().map((provider, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip label={provider.name} size="small" />
                        </TableCell>
                        <TableCell align="right">{provider.tests}</TableCell>
                        <TableCell align="right">{formatTableTime(provider.avgTime)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={provider.avgConfidence * 100}
                              sx={{ width: 60, height: 6 }}
                            />
                            <Typography variant="body2">
                              {(provider.avgConfidence * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Language Performance */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language color="primary" />
                Language Performance
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Language</TableCell>
                      <TableCell align="right">Tests</TableCell>
                      <TableCell align="right">Avg Time</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getLanguageStats().slice(0, 8).map((language, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip label={language.name} size="small" color="secondary" />
                        </TableCell>
                        <TableCell align="right">{language.tests}</TableCell>
                        <TableCell align="right">{formatTableTime(language.avgTime)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={language.avgConfidence * 100}
                              sx={{ width: 60, height: 6 }}
                              color="secondary"
                            />
                            <Typography variant="body2">
                              {(language.avgConfidence * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recording Length Analysis */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GraphicEq color="primary" />
                Recording Length Analysis
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Duration</TableCell>
                      <TableCell align="right">Tests</TableCell>
                      <TableCell align="right">Avg Time</TableCell>
                      <TableCell align="right">Speed Factor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getRecordingAnalysis().map((analysis, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip label={analysis.duration} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{analysis.tests}</TableCell>
                        <TableCell align="right">{formatTableTime(analysis.avgTime)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color={analysis.avgSpeed > 1 ? 'error' : 'success'}>
                            {analysis.avgSpeed.toFixed(2)}x
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tests */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            height: '100%',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer color="primary" />
                Recent Tests
              </Typography>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {getRecentTests().map((test, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {test.success ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Error color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="600">
                              {test.provider}
                            </Typography>
                            <Chip label={test.language} size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {test.timestamp.toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption">
                              {formatTableTime(test.processingTime)}
                            </Typography>
                            <Typography variant="caption">
                              {(test.confidence * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < getRecentTests().length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        </Box>
      )}

      {/* API Key Management Tab */}
      {currentTab === 1 && (
        <ApiKeyManager accessToken={accessToken} />
      )}
    </Box>
  )
}

export default AdminDashboard