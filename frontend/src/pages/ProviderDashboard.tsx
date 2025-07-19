import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Divider,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ArrowBack,
  Assessment,
  Speed,
  Language as LanguageIcon,
  TrendingUp,
  CheckCircle,
  Error,
  Timer,
  GraphicEq,
  Refresh,
  ExpandMore,
  Public,
  Code,
  Security,
  Settings,
} from '@mui/icons-material'

interface ProviderDashboardData {
  provider_info: {
    id: string
    name: string
    description: string
    base_url: string
    requires_api_key: boolean
    api_key_type: string
  }
  activation_status: {
    is_activated: boolean
    last_test_date: string
    last_test_result: string
    test_model_used: string
    test_language_used: string
    test_processing_time: number
  }
  supported_languages: Record<string, {
    name: string
    flag: string
    region: string
  }>
  available_models: Array<{
    id: string
    name: string
    description: string
    supported_languages: string[]
    features: string[]
  }>
  analytics: {
    total_tests: number
    avg_processing_time: number
    avg_confidence: number
    success_rate: number
  }
  summary: {
    total_languages: number
    total_models: number
    total_tests: number
    avg_processing_time: number
    avg_confidence: number
    success_rate: number
  }
}

const ProviderDashboard: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>()
  const navigate = useNavigate()
  
  const [data, setData] = useState<ProviderDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProviderData = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('admin_access_token')
      if (!token) {
        navigate('/admin')
        return
      }

      const response = await fetch(`/api/admin/provider/${providerId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/admin')
          return
        }
        throw new Error('Failed to fetch provider data')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load provider data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch provider data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (providerId) {
      fetchProviderData()
    }
  }, [providerId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Provider Dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin')}
          sx={{ mb: 2 }}
        >
          Back to Admin
        </Button>
        <Alert severity="error">
          {error || 'Provider not found'}
        </Alert>
      </Box>
    )
  }

  const groupLanguagesByRegion = () => {
    const grouped = Object.entries(data.supported_languages).reduce((acc, [code, lang]) => {
      if (!acc[lang.region]) {
        acc[lang.region] = []
      }
      acc[lang.region].push({ code, ...lang })
      return acc
    }, {} as Record<string, Array<{ code: string; name: string; flag: string; region: string }>>)

    // Sort regions with India first
    const sortedRegions = Object.keys(grouped).sort((a, b) => {
      if (a === 'India') return -1
      if (b === 'India') return 1
      return a.localeCompare(b)
    })

    return sortedRegions.map(region => ({
      region,
      languages: grouped[region].sort((a, b) => a.name.localeCompare(b.name))
    }))
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
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Back to Admin
          </Button>
          <Typography variant="h4" fontWeight="600" color="white" sx={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            {data.provider_info.name} Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={data.activation_status.is_activated ? 'Activated' : 'Not Activated'}
            color={data.activation_status.is_activated ? 'success' : 'error'}
            icon={data.activation_status.is_activated ? <CheckCircle /> : <Error />}
          />
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchProviderData} disabled={loading}>
              <Refresh sx={{ color: 'white' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Provider Info Card */}
      <Card sx={{
        mb: 3,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            Provider Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{data.provider_info.description}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Base URL</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{data.provider_info.base_url}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">API Key Required</Typography>
                <Chip
                  label={data.provider_info.requires_api_key ? `Yes (${data.provider_info.api_key_type})` : 'No'}
                  color={data.provider_info.requires_api_key ? 'warning' : 'success'}
                  icon={<Security />}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Provider ID</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{data.provider_info.id}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {data.summary.total_tests}
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
                    {data.summary.avg_processing_time.toFixed(2)}s
                  </Typography>
                  <Typography variant="body2">
                    Avg Processing Time
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
                <LanguageIcon sx={{ fontSize: '2rem' }} />
                <Box>
                  <Typography variant="h4" fontWeight="600">
                    {data.summary.total_languages}
                  </Typography>
                  <Typography variant="body2">
                    Supported Languages
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
                    {(data.summary.success_rate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    Success Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Models and Languages */}
      <Grid container spacing={3}>
        {/* Available Models */}
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
                <Code color="primary" />
                Available Models ({data.summary.total_models})
              </Typography>

              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {data.available_models.map((model, index) => (
                  <Accordion key={model.id}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {model.name}
                        </Typography>
                        <Chip label={`${model.supported_languages.length} languages`} size="small" />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {model.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>Features:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {model.features.map((feature, idx) => (
                            <Chip key={idx} label={feature} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Supported Languages */}
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
                <Public color="primary" />
                Supported Languages ({data.summary.total_languages})
              </Typography>

              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {groupLanguagesByRegion().map(({ region, languages }) => (
                  <Box key={region}>
                    <Typography variant="subtitle2" fontWeight="600" color="primary.main" sx={{ mt: 2, mb: 1 }}>
                      {region} {region === 'India' && '🇮🇳'}
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {languages.map((lang) => (
                      <Box key={lang.code} sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 1 }}>
                        <Typography sx={{ fontSize: '1.2rem', mr: 1.5, minWidth: 30 }}>
                          {lang.flag}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">{lang.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {lang.code}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Test Information */}
      {data.activation_status.last_test_date && (
        <Card sx={{
          mt: 3,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timer color="primary" />
              Last Test Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Test Date</Typography>
                <Typography variant="body1">
                  {new Date(data.activation_status.last_test_date).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Test Result</Typography>
                <Chip
                  label={data.activation_status.last_test_result}
                  color={data.activation_status.last_test_result === 'connection_success' ? 'success' : 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Model Used</Typography>
                <Typography variant="body1">{data.activation_status.test_model_used}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Processing Time</Typography>
                <Typography variant="body1">{data.activation_status.test_processing_time?.toFixed(2)}s</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default ProviderDashboard