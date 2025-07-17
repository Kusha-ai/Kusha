import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Typography,
  Chip,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material'
import { Language as LanguageIcon } from '@mui/icons-material'

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
  const groupedLanguages = groupLanguagesByRegion(languages)
  
  const handleChange = (event: SelectChangeEvent) => {
    onLanguageChange(event.target.value)
  }
  
  const selectedLangData = languages.find(lang => lang.code === selectedLanguage)
  
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
      <FormControl fullWidth variant="outlined">
        <InputLabel id="language-select-label">Select Language</InputLabel>
        <Select
          labelId="language-select-label"
          value={selectedLanguage}
          onChange={handleChange}
          label="Select Language"
          renderValue={(selected) => {
            if (!selected) return ''
            const lang = languages.find(l => l.code === selected)
            if (!lang) return selected
            
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '1.2rem' }}>{lang.flag}</Typography>
                <Typography>{lang.name}</Typography>
                <Chip 
                  label={lang.region} 
                  size="small" 
                  variant="outlined" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    '& .MuiChip-label': { px: 1 }
                  }} 
                />
              </Box>
            )
          }}
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 400,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                },
              },
            },
          }}
        >
          {groupedLanguages.map(({ region, languages: regionLanguages }) => [
            <MenuItem key={`header-${region}`} disabled sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              backgroundColor: 'grey.50',
              '&:hover': { backgroundColor: 'grey.50' }
            }}>
              <Typography variant="subtitle2" fontWeight="600">
                {region}
              </Typography>
            </MenuItem>,
            ...regionLanguages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <Typography sx={{ fontSize: '1.2rem', minWidth: 24 }}>
                    {lang.flag}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1">{lang.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {lang.code}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))
          ])}
        </Select>
      </FormControl>
      
      {selectedLangData && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography sx={{ fontSize: '1.5rem' }}>{selectedLangData.flag}</Typography>
            <Typography variant="h6" fontWeight="600">
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