# API Key Authentication Fix

## Problem Identified

Your Vercel environment contains an **AI Studio API key** (format: `AQ.*****`) which is NOT compatible with the Google Gemini API for programmatic access.

### Error Details
```
{
  "error": {
    "code": 401,
    "message": "API keys are not supported by this API. Expected OAuth2 access token...",
    "status": "UNAUTHENTICATED"
  }
}
```

## Root Cause

- **AI Studio Keys** (`AQ.*`) are only for use within Google's AI Studio web interface
- **Google AI API Keys** (`AIza*`) are required for programmatic API access
- The Gemini API endpoints reject AI Studio keys with a 401 UNAUTHENTICATED error

## Solution: Generate a Proper API Key

### Step 1: Generate a Google AI API Key

1. Visit: https://aistudio.google.com/apikey
2. Click **"Create API key"**
3. Select your Google Cloud project (or create a new one)
4. Copy the generated key (format: `AIzaSy...` - 39 characters)

### Step 2: Update Vercel Environment Variables

Run these commands from your project directory:

```bash
# Remove the old AI Studio key
vercel env rm GEMINI_API_KEY production

# Add the new Google AI API key
vercel env add GEMINI_API_KEY production
# When prompted, paste your new AIza... key

# Also update preview and development environments
vercel env add GEMINI_API_KEY preview
vercel env add GEMINI_API_KEY development
```

### Step 3: Redeploy

```bash
# Trigger a new deployment with the updated environment
vercel --prod
```

## Code Changes Made

The following improvements were implemented to prevent this issue:

1. **API Key Format Validation** (`services/apiKeys.ts`)
   - Detects AI Studio keys and rejects them with helpful error messages
   - Validates Google AI API key format (AIza*, 39 characters)
   - Provides detailed error messages with links to generate proper keys

2. **Enhanced Error Handling** (`services/aiService.ts`)
   - Catches authentication errors before making API calls
   - Provides user-friendly error messages
   - Automatically clears invalid keys and prompts for re-entry
   - Distinguishes between authentication errors (need user action) and quota errors (can use fallback)

3. **Client Validation** (`requireGeminiClient()`)
   - Validates API key format before initializing the Google GenAI client
   - Dispatches `invalid-api-key` event to trigger UI prompts
   - Prevents wasted API calls with invalid credentials

## Verification

After updating the environment variables and redeploying:

1. The app should load without authentication errors
2. Image generation should work with all models (Imagen, Gemini Flash Image, Nano Banana)
3. The Director chat widget should respond correctly
4. Console logs will show: `[API Keys] Initialization: { hasEnvKey: true, keySource: 'environment' }`

## Local Testing

To test locally with a proper API key:

```bash
# Create .env.local with your new API key
echo "GEMINI_API_KEY=AIzaSy..." > .env.local

# Build and preview
npm run build
npm run preview
```

## Summary

✅ **Fixed**: Added comprehensive API key validation and error handling
⚠️ **Action Required**: Update Vercel environment variables with a Google AI API key (AIza* format)
📚 **Generate Key**: https://aistudio.google.com/apikey
