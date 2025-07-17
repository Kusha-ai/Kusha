import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  Security,
} from '@mui/icons-material'

interface AdminLoginProps {
  open: boolean
  onClose: () => void
  onAuthenticated: (token: string) => void
}

const AdminLogin: React.FC<AdminLoginProps> = ({ open, onClose, onAuthenticated }) => {
  const [adminToken, setAdminToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showToken, setShowToken] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adminToken.trim()) {
      setError('Admin token is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: adminToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Authentication failed')
      }

      const data = await response.json()
      
      // Store the access token
      localStorage.setItem('admin_access_token', data.access_token)
      localStorage.setItem('admin_token_expires', (Date.now() + data.expires_in * 1000).toString())
      
      onAuthenticated(data.access_token)
      setAdminToken('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAdminToken('')
    setError('')
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AdminPanelSettings color="primary" sx={{ fontSize: '2rem' }} />
          <Box>
            <Typography variant="h5" fontWeight="600">
              Admin Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your admin token to access the dashboard
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Security color="primary" />
            <Typography variant="body2" color="text.secondary">
              Admin token is required to access analytics and configuration
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="Admin Token"
            type={showToken ? 'text' : 'password'}
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            disabled={loading}
            required
            autoFocus
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowToken(!showToken)}
                    edge="end"
                  >
                    {showToken ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ 
            backgroundColor: 'rgba(25, 118, 210, 0.1)', 
            padding: 2, 
            borderRadius: 2,
            border: '1px solid rgba(25, 118, 210, 0.3)'
          }}>
            <Typography variant="body2" color="primary" fontWeight="600">
              Environment Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              The admin token is configured in the ADMIN_TOKEN environment variable.
              Default: <code>asr-admin-token-2025</code>
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !adminToken.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AdminLogin