# API Reference

## Core Endpoints

### Languages
- `GET /api/languages` - Get all supported languages
- `GET /api/models/language/{language_code}` - Get models for specific language (includes activation status)

### Testing
- `POST /api/test-multiple-models` - Test multiple models simultaneously (includes provider icons)
- `GET /api/test-results` - Get historical test results

### Providers
- `GET /api/providers` - Get all available providers

## Admin Authentication
- `POST /api/admin/auth` - Authenticate with admin token to get JWT
- `GET /api/admin/verify` - Verify admin JWT token

## Admin Management Endpoints

### API Key Management
- `GET /api/admin/api-keys` - Get all API keys with provider information and icons
- `POST /api/admin/api-keys/{provider_id}` - Save/update API key for specific provider
- `DELETE /api/admin/api-keys/{provider_id}` - Delete API key for specific provider
- `POST /api/admin/api-keys/{provider_id}/test` - Test provider connection
- `POST /api/admin/api-keys/{provider_id}/test-transcription` - Test provider with audio file

### Provider Control
- `POST /api/admin/api-keys/{provider_id}/deactivate` - Deactivate provider
- `POST /api/admin/api-keys/{provider_id}/reactivate` - Reactivate provider  
- `POST /api/admin/activate-all-providers` - Activate all providers with valid API keys

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics with date range filtering

## Response Formats

### Standard Success Response
```json
{
  "success": true,
  "provider": "string",
  "model_id": "string", 
  "language_code": "string",
  "transcription": "string",
  "confidence": 0.95,
  "processing_time": 1250,
  "timing_phases": {
    "preparation_time": 50,
    "network_time": 1200,
    "response_processing_time": 25,
    "model_processing_time": 1200
  },
  "error": null
}
```

### Standard Error Response
```json
{
  "success": false,
  "provider": "string",
  "model_id": "string",
  "language_code": "string", 
  "error": "Detailed error message",
  "transcription": "",
  "confidence": 0.0,
  "processing_time": 0
}
```

## Authentication

Admin endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

Get JWT token by authenticating with admin token:
```bash
curl -X POST "/api/admin/auth" \
  -H "Content-Type: application/json" \
  -d '{"token": "kusha-admin-token-2025"}'
```