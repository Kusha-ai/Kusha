import React, { useState } from 'react'
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Autocomplete,
  TextField,
  Paper,
  InputAdornment,
} from '@mui/material'
import { 
  Language as LanguageIcon,
  Search as SearchIcon 
} from '@mui/icons-material'

interface Language {
  code: string
  name: string
  flag: string
  region: string
}

interface LanguageSelectorProps {
  languages: Language[]
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  loading: boolean
}

// Group languages by region
const groupLanguagesByRegion = (languages: Language[]) => {
  const grouped = languages.reduce((acc, lang) => {
    if (!acc[lang.region]) {
      acc[lang.region] = []
    }
    acc[lang.region].push(lang)
    return acc
  }, {} as Record<string, Language[]>)
  
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

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguage,
  onLanguageChange,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const groupedLanguages = groupLanguagesByRegion(languages)
  
  const selectedLangData = languages.find(lang => lang.code === selectedLanguage)
  
  // Filter languages based on search term
  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.region.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading languages...
        </Typography>
      </Box>
    )
  }
  
  return (
    <Box>
      <Autocomplete
        fullWidth
        options={filteredLanguages}
        getOptionLabel={(option) => option.name}
        value={selectedLangData || null}
        onChange={(_, newValue) => {
          onLanguageChange(newValue?.code || '')
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search and select language"
            placeholder="Type to search languages..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Typography sx={{ fontSize: '1.2rem', minWidth: 24 }}>
                {option.flag}
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">{option.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.code}
                </Typography>
              </Box>
              <Chip 
                label={option.region} 
                size="small" 
                variant="outlined" 
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 1 }
                }} 
              />
            </Box>
          </Box>
        )}
        groupBy={(option) => option.region}
        renderGroup={(params) => (
          <Box key={params.key}>
            <Typography 
              variant="subtitle2" 
              fontWeight="600" 
              color="primary.main"
              sx={{ 
                px: 2, 
                py: 1, 
                backgroundColor: 'grey.50',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}
            >
              {params.group} {params.group === 'India' && '🇮🇳'}
            </Typography>
            {params.children}
          </Box>
        )}
        PaperComponent={({ children, ...other }) => (
          <Paper {...other} sx={{ maxHeight: 400 }}>
            {children}
          </Paper>
        )}
        noOptionsText="No languages found"
        clearOnBlur={false}
        selectOnFocus
        handleHomeEndKeys
      />
      
      {selectedLangData && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          borderRadius: 2,
          border: '1px solid rgba(102, 126, 234, 0.2)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography sx={{ fontSize: '1.5rem' }}>{selectedLangData.flag}</Typography>
            <Typography variant="h6" fontWeight="600" color="primary.main">
              {selectedLangData.name}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Language Code: {selectedLangData.code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Region: {selectedLangData.region}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default LanguageSelector