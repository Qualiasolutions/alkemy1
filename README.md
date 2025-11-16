<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Alkemy AI Studio V2.0 Alpha

Transform scripts into complete visual productions using AI-powered film generation.

[![Production Status](https://img.shields.io/badge/Status-Production%20Live-success)](https://alkemy1-7pkpum7dy.vercel.app)
[![Version](https://img.shields.io/badge/Version-V2.0%20Alpha-blue)]()
[![Epics Complete](https://img.shields.io/badge/Epics%20Complete-3%2F8-orange)]()
[![Last Deploy](https://img.shields.io/badge/Last%20Deploy-2025--11--12-brightgreen)]()

## Live Production

**Production URL:** https://alkemy1-7pkpum7dy.vercel.app

## Features

### Core Capabilities (Production Ready)

- **Script Analysis**: Upload scripts for AI-powered cast, location, and theme extraction
- **Moodboard Creation**: Visual style references and color palette generation
- **Character Identity System**: LoRA-based character consistency with 90-98% visual similarity
- **Location Management**: Generate and manage film locations with AI
- **Scene Assembly**: Compose scenes with characters and locations
- **Director Voice Enhancement**: Voice commands, TTS responses, style learning, continuity checking
- **Analytics Dashboard**: Creative quality analysis and performance metrics
- **Security**: RLS policies, secure functions, optimized database queries

### Technology Stack

- **Frontend**: React 19.2, TypeScript 5.8, Vite, TailwindCSS
- **AI Models**: Google Gemini 2.5 Pro, Imagen 3, Veo 3.1, Fal.ai Flux LoRA
- **3D**: Three.js, React Three Fiber, Gaussian Splatting (ready)
- **Video**: FFmpeg.wasm for client-side rendering
- **Backend**: Supabase (auth, database, storage)
- **Deployment**: Vercel

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/QualiaSound/alkemy.git
cd alkemy
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env.local` file with:
```env
# Core APIs (Required)
VITE_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# Supabase (Optional - for authentication)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Character Identity (Required for Epic 2)
FAL_API_KEY=your_fal_api_key

# Additional APIs (Optional)
REPLICATE_API_TOKEN=your_replicate_token
LUMA_API_KEY=your_luma_key
FLUX_API_KEY=your_flux_key
WAN_API_KEY=your_wan_key
BRAVE_SEARCH_API_KEY=your_brave_key
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open in browser:**
Navigate to http://localhost:5173

## Project Structure

```
alkemy/
├── components/           # React components
├── services/             # AI and API services
├── tabs/                 # Main application tabs
├── types/                # TypeScript definitions
├── supabase/
│   └── migrations/       # Database migrations
├── docs/
│   ├── setup/            # Setup guides
│   ├── epics/            # Epic documentation
│   ├── reports/          # Status and QA reports
│   ├── stories/          # Story documentation
│   └── qa/               # Quality assurance
└── public/               # Static assets
```

## Epic Status

| Epic | Status | Progress | Notes |
|------|--------|----------|-------|
| Epic 1: Director Voice | Complete | 4/4 stories | Voice I/O, style learning, continuity checking |
| Epic 2: Character Identity | Complete | 3/3 stories | LoRA training, 90-98% consistency |
| Epic 3: 3D Worlds | Not Started | 0/5 stories | Infrastructure ready |
| Epic 4: Voice Acting | Not Started | 0/4 stories | Awaiting prioritization |
| Epic 5: Audio Production | Not Started | 0/4 stories | Service stubs exist |
| Epic 6: Analytics | Complete | 2/4 stories | Quality analysis, performance metrics |
| Epic 7a: Community | Not Started | 0/4 stories | Future release |
| Epic 8: Testing | Not Started | 0/2 stories | Continuous |

## Recent Quality & Security Updates

### Security Improvements (83% Complete)
- Added SECURITY DEFINER and search_path to 5 vulnerable functions
- Protected against SQL injection and privilege escalation
- 1 remaining: Leaked password protection (requires Dashboard config)

### Performance Optimizations
- Optimized 6 RLS policies from O(n) to O(1) auth evaluation
- Added missing foreign key index
- Reduced auth function re-evaluation per row

### Build Information
- Bundle Size: 164KB (gzipped)
- Build Time: ~18 seconds
- TypeScript Errors: 0
- Production Ready: Yes

## Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Configure environment variables in Vercel Dashboard**

### Manual Build

```bash
npm run build
npm run preview  # Test production build locally
```

## Documentation

- **Product Roadmap**: [`docs/ROADMAP.html`](docs/ROADMAP.html)
- **Epic Status**: [`docs/EPIC_STATUS_UPDATE.md`](docs/EPIC_STATUS_UPDATE.md)
- **Setup Guide**: [`docs/setup/QUICKSTART.md`](docs/setup/QUICKSTART.md)
- **Supabase Setup**: [`docs/setup/SUPABASE_SETUP.md`](docs/setup/SUPABASE_SETUP.md)

## Testing

### Run Tests
```bash
npm test           # Run unit tests
npm run test:e2e   # Run E2E tests (requires manual interaction)
```

### Manual Testing Checklist
1. Upload a script in Moodboard tab
2. Generate cast and locations
3. Train character identity (Epic 2)
4. Generate scenes with characters
5. Use voice commands (Epic 1)
6. Check analytics dashboard

## Contributing

This is a private repository. For access or contributions, please contact the development team.

## License

Proprietary - All Rights Reserved

## Support

- **Issues**: [GitHub Issues](https://github.com/QualiaSound/alkemy/issues)
- **Documentation**: See `/docs` folder
- **API Keys**: Contact development team for access

## Next Steps

1. **Immediate**: End-to-end testing of Epic 2 (Character Identity)
2. **Short-term**: Start Epic 3 (3D World Generation)
3. **Medium-term**: Epic 4 (Voice Acting) or Epic 5 (Audio)
4. **Long-term**: Epic 7a (Community Features)

---

**Last Updated**: 2025-11-17
**Version**: V2.0 Alpha
**Status**: Production Live
