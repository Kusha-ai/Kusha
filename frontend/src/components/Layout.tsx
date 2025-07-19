import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Mic as MicIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Menu as MenuIcon,
  VoiceChat as TTSIcon,
  Psychology as AIIcon,
  Hub as EmbeddingIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [testMenuAnchorEl, setTestMenuAnchorEl] = React.useState<null | HTMLElement>(null)
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleMenuClose = () => {
    setAnchorEl(null)
  }
  
  const handleTestMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTestMenuAnchorEl(event.currentTarget)
  }
  
  const handleTestMenuClose = () => {
    setTestMenuAnchorEl(null)
  }
  
  const testSubMenuItems = [
    { label: 'ASR', path: '/test/asr', icon: <MicIcon /> },
    { label: 'TTS', path: '/test/tts', icon: <TTSIcon /> },
    { label: 'AI', path: '/test/ai', icon: <AIIcon /> },
    { label: 'Embedding', path: '/test/embedding', icon: <EmbeddingIcon /> },
  ]

  const menuItems = [
    { label: 'Test', path: '/test', icon: <MicIcon />, hasSubmenu: true },
    { label: 'Results', path: '/results', icon: <AnalyticsIcon /> },
    { label: 'Admin', path: '/admin', icon: <SettingsIcon /> },
  ]
  
  const handleNavigation = (path: string) => {
    navigate(path)
    handleMenuClose()
    handleTestMenuClose()
  }
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar 
        position="static" 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          color: 'primary.main',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <MicIcon sx={{ mr: 2, fontSize: '2rem', color: 'primary.main' }} />
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              Kusha
            </Typography>
          </Box>
          
          {isMobile ? (
            <>
              <IconButton
                edge="end"
                color="primary"
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    selected={location.pathname === item.path}
                    sx={{ minWidth: 150 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.icon}
                      {item.label}
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {menuItems.map((item) => (
                item.hasSubmenu ? (
                  <Box key={item.path}>
                    <Button
                      onClick={(e) => handleTestMenuOpen(e)}
                      startIcon={item.icon}
                      endIcon={<ExpandMoreIcon />}
                      variant={location.pathname.startsWith('/test') ? 'contained' : 'text'}
                      sx={{
                        color: location.pathname.startsWith('/test') ? 'white' : 'primary.main',
                        '&:hover': {
                          backgroundColor: location.pathname.startsWith('/test') 
                            ? 'primary.dark' 
                            : 'rgba(102, 126, 234, 0.1)',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                    <Menu
                      anchorEl={testMenuAnchorEl}
                      open={Boolean(testMenuAnchorEl)}
                      onClose={handleTestMenuClose}
                      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                    >
                      {testSubMenuItems.map((subItem) => (
                        <MenuItem
                          key={subItem.path}
                          onClick={() => handleNavigation(subItem.path)}
                          selected={location.pathname === subItem.path}
                          sx={{ minWidth: 120 }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {subItem.icon}
                            {subItem.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                ) : (
                  <Button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    startIcon={item.icon}
                    variant={location.pathname === item.path ? 'contained' : 'text'}
                    sx={{
                      color: location.pathname === item.path ? 'white' : 'primary.main',
                      '&:hover': {
                        backgroundColor: location.pathname === item.path 
                          ? 'primary.dark' 
                          : 'rgba(102, 126, 234, 0.1)',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                )
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth="xl" 
        sx={{ 
          flexGrow: 1, 
          py: 4,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>
      
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          © 2025 Kusha - App & Elastic Components
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Comprehensive AI platform • App & Elastic • ASR • TTS • AI Models • Embeddings
        </Typography>
      </Box>
    </Box>
  )
}

export default Layout