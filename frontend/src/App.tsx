import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import ResultsPage from './pages/ResultsPage'
import ProviderDashboard from './pages/ProviderDashboard'

function App() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.1)',
        zIndex: -1,
      }
    }}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/test/asr" element={<HomePage />} />
          <Route path="/test/tts" element={<HomePage />} />
          <Route path="/test/ai" element={<HomePage />} />
          <Route path="/test/embedding" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/provider/:providerId" element={<ProviderDashboard />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App