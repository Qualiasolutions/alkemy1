# Alkemy AI Studio - Quick Start Guide

**Production URL**: https://alkemy1-5mhhufxiz-qualiasolutionscy.vercel.app
**Version**: V2.0 Alpha (Deployed 2025-11-10)
**Status**: ✅ LIVE IN PRODUCTION

---

## What's New in V2.0 Alpha

### 1. Analytics Tab ✨ NEW
Navigate to **Production → Analytics** to access:
- **Creative Quality Analysis**: AI-powered scoring for color, lighting, and look bible adherence
- **Technical Performance Metrics**: Real-time cost tracking, render times, and success rates
- **Optimization Suggestions**: Actionable tips to reduce costs and improve efficiency
- **CSV Export**: Download metrics for offline analysis

### 2. Voice Input ✨ NEW
Use hands-free voice commands in the Director Widget:
1. Click the **microphone button** 🎙️ in the AI Director chat
2. Grant microphone permission (one-time)
3. Speak your command: "Generate 3 images of Sarah 16:9"
4. Review transcript and hit Enter to execute

**Supported Commands**:
- Image generation: "Generate [N] flux images of [character/location] [aspect]"
- Upscaling: "Upscale the [character/location] image"
- Technical queries: "Calculate DOF for f/2.8 at 3m with 85mm"
- Lens recommendations: "Recommend lens for close-up shot"

### 3. Enhanced Moodboard Search
Improved image search with multi-source aggregation (Pexels, Unsplash, Brave)

---

## Project Status at a Glance

| Feature | Status | Notes |
|---------|--------|-------|
| **Script Analysis** | ✅ STABLE | Gemini 2.5 Pro, no changes |
| **Moodboard** | ✅ STABLE | Multi-source search improved |
| **Cast & Locations** | ✅ STABLE | Image generation working |
| **3D Worlds** | ✅ STABLE | World Labs service |
| **Compositing** | ✅ STABLE | Shot assembly functional |
| **Timeline** | ✅ STABLE | Video editing working |
| **Analytics** | ✨ NEW | Quality + performance tracking |
| **Voice Input** | ✨ NEW | Hands-free commands |

---

## Development Quick Reference

### Local Development
```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Open browser
http://localhost:3000/
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

### Environment Setup
Create `.env.local` with required API keys:
```bash
GEMINI_API_KEY=your_gemini_key_here
FLUX_API_KEY=your_flux_key_here  # Optional
BRAVE_SEARCH_API_KEY=your_brave_key_here  # Optional
```

See `.env.example` for complete list.

---

## Key Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **Project Status** | Overall project health | `/PROJECT_STATUS.md` |
| **Production Deployment Report** | V2.0 Alpha deployment details | `/docs/PRODUCTION_DEPLOYMENT_REPORT_V2.0_ALPHA.md` |
| **Implementation Status** | Sprint progress tracking | `/docs/IMPLEMENTATION_STATUS.md` |
| **Sprint Plan** | 10-week roadmap | `/docs/SPRINT_PLAN_V2.0.md` |
| **Session Summary** | Latest session work | `/docs/SESSION_SUMMARY.md` |
| **QA Gates** | Quality assurance decisions | `/docs/qa/gates/` |

---

## Known Issues (Non-Blocking)

### 1. Simulated Quality Scores (Analytics Tab)
- **Impact**: Quality analysis shows demo data, not real computer vision
- **Workaround**: UI demonstrates expected behavior
- **Fix**: Planned for Sprint 2.1 (Gemini Vision API integration)

### 2. Unsplash API 404s (Image Search)
- **Impact**: Some reference images may fail to load
- **Workaround**: Automatic fallback to Pexels and Brave Search
- **Fix**: Update demo data or implement local caching

### 3. Voice Accuracy Not Manually Tested
- **Impact**: Cannot verify >75% accuracy in automation
- **Evidence**: Epic R3a research validated 78% accuracy
- **Fix**: Manual QA session scheduled

---

## Support & Contact

**Issues**: Report bugs at https://github.com/anthropics/claude-code/issues
**Documentation**: See `/docs/` directory for detailed guides
**Production Logs**: Check Vercel dashboard for runtime errors

---

## Quick Commands

```bash
# Check production status
vercel list alkemy1

# View production logs
vercel logs https://alkemy1-5mhhufxiz-qualiasolutionscy.vercel.app

# Rollback to previous deployment
vercel rollback

# Pull environment variables
vercel env pull .env.vercel.production --environment=production
```

---

**Last Updated**: 2025-11-10
**Next Milestone**: Sprint 3 (Epic 6.3-6.4) - PDF export, comparison mode
