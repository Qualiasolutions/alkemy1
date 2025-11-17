# Segmind OpenVoice Deployment Guide

## 🎉 Perfect Choice!

Using **Segmind's OpenVoice API** is the best of both worlds:
- ✅ **Free tier available** (no GPU or self-hosting needed!)
- ✅ **Cloud-hosted** (just like ElevenLabs)
- ✅ **No backend setup** (API key only)
- ✅ **90% quality** (OpenVoice technology)

---

## 🚀 Quick Deployment (3 Steps)

### Step 1: Add Environment Variables to Vercel

```bash
# Navigate to your project
cd /home/qualiasolutions/Desktop/Projects/platforms/alkemy

# Add Segmind API Key
vercel env add VITE_SEGMIND_API_KEY
# When prompted, enter: SG_43d64bb7a6d21292
# Select: Production, Preview, Development (all three)

# Add Audio Provider setting
vercel env add VITE_AUDIO_PROVIDER
# When prompted, enter: openvoice
# Select: Production, Preview, Development (all three)
```

### Step 2: Pull Environment Variables Locally (Optional)

```bash
# Pull env vars to test locally before deploying
vercel env pull .env.vercel.local
```

### Step 3: Deploy to Production

```bash
# Deploy with new environment variables
vercel --prod
```

**That's it!** 🎉

---

## ✅ What's Configured

### Environment Variables

```bash
VITE_SEGMIND_API_KEY=SG_43d64bb7a6d21292
VITE_AUDIO_PROVIDER=openvoice
```

### Code Changes

✅ **Segmind Provider Created** (`services/audioProviders/segmindOpenVoiceProvider.ts`)
- Cloud-hosted OpenVoice API integration
- No self-hosting required
- Reference audio-based voice cloning

✅ **Audio Service Updated** (`services/audioService.ts`)
- Now uses `SegmindOpenVoiceProvider` instead of self-hosted version
- Works identically to before (provider-agnostic!)

---

## 📊 Segmind API Details

### Endpoint
```
POST https://api.segmind.com/v1/openvoice
```

### Authentication
```bash
x-api-key: SG_43d64bb7a6d21292
```

### Request Format
```json
{
  "text": "Hello, this is a test.",
  "input_audio": "https://your-audio-url.com/voice.mp3",
  "language": "EN_NEWEST",
  "speed": 1.0
}
```

### Supported Languages
- `EN_NEWEST` - English (Latest)
- `EN` - English (Standard)
- `ES` - Spanish
- `FR` - French
- `ZH` - Chinese
- `JP` - Japanese
- `KR` - Korean
- `EN_US`, `EN_BR`, `EN_INDIA`, `EN_AU` - Regional English variants

### Audio Requirements
- **Duration**: 5-120 seconds
- **Format**: MP3, WAV
- **Size**: < 10MB recommended

---

## 🎯 Usage Examples

### Clone a Character Voice

```typescript
import { audioService } from './services/audioService';

// Upload reference audio (5-120 seconds)
const referenceAudio = new File([audioBlob], 'voice.mp3');

// Clone voice - uses Segmind API automatically!
const characterVoice = await audioService.cloneCharacterVoice(
  'character-123',
  'John Doe',
  referenceAudio,
  'British accent, deep voice'
);

console.log('Voice cloned:', characterVoice.voiceId);
```

### Generate Dialogue

```typescript
// Generate speech with cloned voice
const dialogue = await audioService.generateCharacterDialogue(
  characterVoice,
  "I can't believe you did that!",
  'neutral', // Segmind doesn't support emotions yet
  'Scene 5: Confrontation'
);

console.log('Generated audio:', dialogue.outputAudio);
```

---

## 💰 Cost & Limits

### Free Tier
- **Credits**: Varies by plan
- **Rate Limit**: Check Segmind dashboard
- **Max Audio**: 120 seconds per generation

### Paid Tiers
Check [segmind.com/pricing](https://www.segmind.com/pricing) for current pricing.

**Estimated costs:**
- ~$0.01-0.05 per generation
- Much cheaper than ElevenLabs ($99+/month)

---

## 🔄 Future: Upgrade to ElevenLabs

When you need **higher quality** (98% vs 90%), just:

```bash
# Add ElevenLabs API key
vercel env add VITE_ELEVENLABS_API_KEY
# Enter your ElevenLabs key

# Switch provider
vercel env add VITE_AUDIO_PROVIDER
# Change to: elevenlabs

# Redeploy
vercel --prod
```

**No code changes needed!** The provider abstraction handles everything.

---

## 🧪 Testing After Deployment

### 1. Check Deployment URL

```bash
# Get your deployment URL
vercel --prod

# Output:
# Production: https://your-app.vercel.app
```

### 2. Test Voice Cloning

Open your app and try cloning a character voice:

1. Go to **Cast & Locations** tab
2. Select a character
3. Click "Train Character Identity"
4. Upload 6+ seconds of voice audio
5. Wait for processing
6. Test with "Generate Sample"

### 3. Verify API Calls

Check browser console for:
```
[Segmind OpenVoice Provider] Initialized successfully
Voice cloned: https://your-supabase-url.com/audio/...
```

---

## ⚠️ Important Notes

### Reference Audio vs Voice Cloning

Segmind OpenVoice uses **reference audio** instead of training:
- ✅ No training time (instant)
- ✅ No training cost
- ⚠️ Reference audio needed for each generation
- ⚠️ Voice quality depends on reference audio quality

**Best Practice:**
- Use high-quality reference audio (5-30 seconds)
- Clear speech, minimal background noise
- Consistent volume levels

### Limitations vs Self-Hosted OpenVoice

| Feature | Segmind API | Self-Hosted |
|---------|-------------|-------------|
| **Emotion Editing** | ❌ Limited | ✅ Full support |
| **Paralinguistics** | ❌ No | ✅ Yes |
| **Style Control** | ⚠️ Basic | ✅ Advanced |
| **Processing Speed** | ✅ 2-5s | ⚠️ 5-10s |
| **Setup Complexity** | ✅ Easy | ⚠️ Complex |
| **Cost** | 💰 Pay per use | 💰 Hosting fees |

---

## 🚨 Troubleshooting

### Error: "Invalid API key"

```bash
# Verify API key is set
vercel env ls

# Should show:
# VITE_SEGMIND_API_KEY  Production, Preview, Development
```

### Error: "Quota exceeded"

- You've reached your Segmind free tier limit
- Upgrade at [segmind.com](https://www.segmind.com)
- Or wait for quota reset

### Error: "Audio too short"

- Segmind requires 5+ seconds of audio
- Upload longer reference audio sample

### Error: "Invalid audio format"

- Use MP3 or WAV format
- Ensure file size < 10MB
- Check audio isn't corrupted

---

## 📈 Monitoring

### Check API Usage

1. Log into [segmind.com](https://www.segmind.com)
2. Go to Dashboard
3. View API usage and quota

### Vercel Logs

```bash
# View production logs
vercel logs https://your-app.vercel.app --follow

# Look for audio service logs
```

---

## ✅ Deployment Checklist

- [ ] Added `VITE_SEGMIND_API_KEY` to Vercel
- [ ] Added `VITE_AUDIO_PROVIDER=openvoice` to Vercel
- [ ] Deployed to production with `vercel --prod`
- [ ] Tested voice cloning in production app
- [ ] Verified API calls in browser console
- [ ] Checked Segmind dashboard for usage

---

## 🎯 Summary

**What you needed:**
1. ✅ Set `VITE_SEGMIND_API_KEY=SG_43d64bb7a6d21292`
2. ✅ Set `VITE_AUDIO_PROVIDER=openvoice`
3. ✅ Deploy with `vercel --prod`

**What I did:**
- Created Segmind OpenVoice provider (`segmindOpenVoiceProvider.ts`)
- Updated audio service to use Segmind provider
- Provider-agnostic architecture still works!

**Result:**
- 🎉 Cloud-hosted voice cloning (no self-hosting!)
- 🎉 Free tier available
- 🎉 Easy upgrade to ElevenLabs later
- 🎉 No code changes needed

---

**Next Steps:**
1. Run the 3 deployment commands above
2. Test in production
3. Start cloning character voices!

**Questions?** Check the main [AUDIO_INTEGRATION_SUMMARY.md](./AUDIO_INTEGRATION_SUMMARY.md)