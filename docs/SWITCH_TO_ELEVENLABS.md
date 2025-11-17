# How to Switch to ElevenLabs (1 Minute Guide)

You're currently using **OpenVoice (Free)**. Here's how to switch to **ElevenLabs (Premium)** in under 1 minute.

## 🚀 3-Step Upgrade

### Step 1: Get ElevenLabs API Key (30 seconds)

1. Go to [elevenlabs.io](https://elevenlabs.io/sign-up)
2. Sign up and choose a plan
3. Copy your API key from the dashboard

### Step 2: Update Environment Variable (15 seconds)

Edit `.env.local`:

```bash
# Change these two lines:
VITE_AUDIO_PROVIDER=elevenlabs
VITE_ELEVENLABS_API_KEY=your_api_key_here
```

### Step 3: Restart Dev Server (15 seconds)

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

## ✅ Done!

**No code changes needed.** All your existing voice cloning and dialogue generation code works identically with ElevenLabs.

## 🔄 Switch Back to OpenVoice

Change one line in `.env.local`:

```bash
VITE_AUDIO_PROVIDER=openvoice
```

## 📊 What Changes?

| Feature | OpenVoice | ElevenLabs |
|---------|-----------|------------|
| Voice Quality | 90% | **98%** ⬆️ |
| Processing Speed | 3-8s | **1-2s** ⬆️ |
| Language Support | 6 | **29** ⬆️ |
| Cost | $0 | $99+/month |

## 💡 Pro Tip: Hybrid Approach

Use **both** providers:
- **OpenVoice**: Development and testing
- **ElevenLabs**: Final production audio

Switch between them by changing the environment variable!

---

**Questions?** See the [full setup guide](./AUDIO_PROVIDER_SETUP.md).