import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Container,
  Alert,
  Fade,
} from '@mui/material'
import {
  AdminPanelSettings,
  Dashboard,
} from '@mui/icons-material'
import AdminLogin from '../components/AdminLogin'
import AdminDashboard from '../components/AdminDashboard'

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Check if there's a valid token in localStorage
    const token = localStorage.getItem('admin_access_token')
    const expires = localStorage.getItem('admin_token_expires')
    
    if (token && expires) {
      const expirationTime = parseInt(expires)
      if (Date.now() < expirationTime) {
        setAccessToken(token)
        setIsAuthenticated(true)
        
        // Verify token with backend
        verifyToken(token)
      } else {
        // Token expired, clear it
        localStorage.removeItem('admin_access_token')
        localStorage.removeItem('admin_token_expires')
      }
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Token verification failed')
      }

      const data = await response.json()
      if (!data.valid) {
        throw new Error('Invalid token')
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      handleLogout()
    }
  }

  const handleAuthenticated = (token: string) => {
    setAccessToken(token)
    setIsAuthenticated(true)
    setAuthError('')
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_token_expires')
    setAccessToken('')
    setIsAuthenticated(false)
    setAuthError('')
  }

  const handleLoginError = (error: string) => {
    setAuthError(error)
  }

  if (isAuthenticated && accessToken) {
    return (
      <Fade in timeout={300}>
        <Box>
          <AdminDashboard 
            accessToken={accessToken} 
            onLogout={handleLogout}
          />
        </Box>
      </Fade>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Fade in timeout={500}>
        <Box sx={{ textAlign: 'center' }}>
          {/* Header */}
          <Box sx={{ 
            mb: 6,
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <AdminPanelSettings 
              sx={{ 
                fontSize: '4rem', 
                color: 'white',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
              }} 
            />
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 2,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              Admin Dashboard
            </Typography>
            <Typography
              variant="h6"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                mb: 4, 
                maxWidth: 600, 
                mx: 'auto',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              Access comprehensive analytics, performance metrics, and system management tools for the ASR Speed Test Platform
            </Typography>
          </Box>

          {/* Error Alert */}
          {authError && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setAuthError('')}
            >
              {authError}
            </Alert>
          )}

          {/* Features Grid */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 3,
            mb: 6
          }}>
            <Box sx={{ 
              p: 3, 
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <Dashboard sx={{ fontSize: '2rem', color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="600" gutterBottom color="primary.main">
                Performance Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor provider performance, success rates, and response times across all ASR models
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <Box sx={{ fontSize: '2rem', color: 'primary.main', mb: 2 }}>📊</Box>
              <Typography variant="h6" fontWeight="600" gutterBottom color="primary.main">
                Language Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analyze performance across different languages and identify optimization opportunities
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <Box sx={{ fontSize: '2rem', color: 'primary.main', mb: 2 }}>🎵</Box>
              <Typography variant="h6" fontWeight="600" gutterBottom color="primary.main">
                Recording Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Understand how audio length affects processing time and model accuracy
              </Typography>
            </Box>

            <Box sx={{ 
              p: 3, 
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}>
              <Box sx={{ fontSize: '2rem', color: 'primary.main', mb: 2 }}>⚡</Box>
              <Typography variant="h6" fontWeight="600" gutterBottom color="primary.main">
                Real-time Monitoring
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track system usage, test volume, and performance trends over time
              </Typography>
            </Box>
          </Box>

          {/* Login Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<AdminPanelSettings />}
            onClick={() => setShowLoginDialog(true)}
            sx={{
              minWidth: 200,
              py: 1.5,
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
              },
            }}
          >
            Access Admin Dashboard
          </Button>

          {/* Environment Info */}
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(25, 118, 210, 0.3)'
          }}>
            <Typography variant="body2" color="primary" fontWeight="600">
              Authentication Required
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Admin access requires a valid token configured in the ADMIN_TOKEN environment variable.
              Contact your system administrator for access credentials.
            </Typography>
          </Box>
        </Box>
      </Fade>

      {/* Login Dialog */}
      <AdminLogin
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onAuthenticated={handleAuthenticated}
      />
    </Container>
  )
}

export default AdminPage