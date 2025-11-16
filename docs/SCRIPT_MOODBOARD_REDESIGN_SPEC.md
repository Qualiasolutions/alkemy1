# Script & Moodboard Tab Redesign Specification

**Project:** Alkemy AI Studio V2.0 Alpha
**Document Type:** Component Redesign Specification
**Created:** 2025-11-16
**Designer:** Sally (UX Expert)
**Status:** Ready for Implementation

---

## 🎯 Executive Summary

This specification defines the visual and interaction redesign for the **Script Tab AI Summary** and **Moodboard Tab** components to match the polished aesthetic established in the **Cast & Locations Tab**.

### Target Aesthetic (From Cast & Locations)
- **Gradient cards** with smooth hover animations
- **Motion design** using Framer Motion (scale + y-translation)
- **Elegant status badges** with backdrop-blur effects
- **Professional color palette**: Teal/emerald gradients (#10A37F, emerald-500)
- **Micro-interactions**: Smooth transitions (300-600ms)
- **Visual hierarchy**: Clear information architecture with depth

---

## 📊 Current State Analysis

### Script Tab AI Summary (Lines 189-259)

**Current Components:**
```typescript
// Basic info cards - functional but lacks polish
const AnalysisInfoCard: React.FC<AnalysisInfoCardProps> = ({ icon, label, value }) => (
  <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-lg p-4">
    // Plain styling, no gradients or animations
  </div>
);

// Basic section containers
const AnalysisSection: React.FC<AnalysisSectionProps> = ({ title, children }) => (
  <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-color)] rounded-lg p-6">
    // Simple borders, no visual depth
  </div>
);
```

**Issues:**
- ❌ No motion animations or hover effects
- ❌ Plain borders without gradient overlays
- ❌ Lacks visual hierarchy and depth
- ❌ No status indicators or progress visualization
- ❌ Simple list displays without card-based layouts

### Moodboard Tab (Lines 200-299)

**Current Design:**
- Functional sidebar with basic styling
- Plain card layouts without gradient polish
- AI summary section lacks beautification
- Missing animated micro-interactions

**Issues:**
- ❌ No animated card effects
- ❌ Missing gradient overlays on hover
- ❌ AI summary displayed as plain text
- ❌ No visual feedback for generation states

---

## ✨ Redesign Specifications

### 1. Enhanced Analysis Info Cards

**Design Pattern:** Match Cast & Locations card style (lines 159-168)

```typescript
const EnhancedAnalysisInfoCard: React.FC<AnalysisInfoCardProps> = ({ icon, label, value }) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      } hover:border-teal-500/50 transition-all hover:shadow-2xl ${
        isDark ? 'hover:shadow-teal-500/20' : 'hover:shadow-teal-500/30'
      }`}
    >
      {/* Gradient glow overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        isDark ? 'from-teal-500/10 to-purple-500/10' : 'from-teal-400/20 to-purple-400/20'
      } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative p-6 flex items-center gap-4">
        <div className={`w-14 h-14 flex-shrink-0 rounded-xl flex items-center justify-center ${
          isDark
            ? 'bg-gradient-to-br from-teal-500/20 to-emerald-500/20'
            : 'bg-gradient-to-br from-teal-400/30 to-emerald-400/30'
        }`}>
          <div className="text-teal-400">{icon}</div>
        </div>
        <div>
          <div className={`text-3xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {value}
          </div>
          <div className={`text-sm uppercase tracking-wider font-semibold ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {label}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
```

**Visual Improvements:**
- ✅ Hover animation (y: -8, scale: 1.02)
- ✅ Gradient backgrounds with depth
- ✅ Teal/emerald color scheme
- ✅ Icon container with gradient background
- ✅ Professional shadow effects
- ✅ Larger, bolder typography

---

### 2. Enhanced Analysis Sections

**Design Pattern:** Card-based layout with visual hierarchy

```typescript
const EnhancedAnalysisSection: React.FC<AnalysisSectionProps> = ({ title, children }) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}
    >
      {/* Header with accent gradient */}
      <div className={`px-6 py-4 border-b ${
        isDark ? 'border-gray-800/50' : 'border-gray-200'
      } bg-gradient-to-r from-teal-500/10 to-emerald-500/10`}>
        <h4 className={`text-lg font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h4>
      </div>

      {/* Content area */}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};
```

**Visual Improvements:**
- ✅ Entry animation (fade + slide up)
- ✅ Gradient header with accent color
- ✅ Better border styling
- ✅ Improved padding and spacing
- ✅ Visual separation between header and content

---

### 3. AI Summary Display Enhancement

**Current State:**
```typescript
// Plain text display (Line 228-229)
<AnalysisSection title="Summary">
  <p className="text-[var(--color-text-secondary)]">{analysis.summary}</p>
</AnalysisSection>
```

**Enhanced Version:**

```typescript
const AIGeneratedSummary: React.FC<{ summary: string; isGenerating?: boolean }> = ({
  summary,
  isGenerating = false
}) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}
    >
      {/* AI Badge Header */}
      <div className={`px-6 py-4 border-b ${
        isDark ? 'border-gray-800/50' : 'border-gray-200'
      } bg-gradient-to-r from-purple-500/10 via-teal-500/10 to-emerald-500/10`}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={isGenerating ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon className="w-5 h-5 text-teal-400" />
          </motion.div>
          <h4 className={`text-lg font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            AI-Generated Summary
          </h4>
          <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            isDark
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
              : 'bg-teal-400/20 text-teal-600 border border-teal-400/30'
          }`}>
            Gemini 2.5 Pro
          </div>
        </div>
      </div>

      {/* Summary Content */}
      <div className="p-6">
        {isGenerating ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className={`h-4 rounded ${
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                style={{ width: `${90 - i * 10}%` }}
              />
            ))}
          </div>
        ) : (
          <p className={`text-base leading-relaxed ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {summary}
          </p>
        )}
      </div>

      {/* Subtle gradient footer accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500/50 via-teal-500/50 to-emerald-500/50" />
    </motion.div>
  );
};
```

**Visual Improvements:**
- ✅ AI badge with Sparkles icon
- ✅ Model attribution badge (Gemini 2.5 Pro)
- ✅ Animated loading skeleton
- ✅ Gradient header with multi-color accent
- ✅ Bottom gradient accent bar
- ✅ Better typography and spacing

---

### 4. List Display Enhancement

**Current State:**
```typescript
// Plain bullet lists (Lines 232-245)
<ul className="list-disc list-inside text-[var(--color-text-secondary)] space-y-1 h-32 overflow-y-auto">
  {analysis.props?.map((prop, i) => <li key={i}>{prop}</li>)}
</ul>
```

**Enhanced Version:**

```typescript
const EnhancedListDisplay: React.FC<{
  title: string;
  items: string[];
  icon?: React.ReactNode;
  accentColor?: string;
}> = ({
  title,
  items,
  icon = <CheckCircleIcon className="w-4 h-4" />,
  accentColor = 'teal'
}) => {
  const { isDark } = useTheme();

  const colorClasses = {
    teal: 'from-teal-500/10 to-emerald-500/10',
    purple: 'from-purple-500/10 to-pink-500/10',
    blue: 'from-blue-500/10 to-cyan-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      } hover:border-${accentColor}-500/30 transition-all`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isDark ? 'border-gray-800/50' : 'border-gray-200'
      } bg-gradient-to-r ${colorClasses[accentColor]}`}>
        <h5 className={`text-sm font-bold uppercase tracking-wider ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {title}
        </h5>
      </div>

      {/* Items */}
      <div className="p-4 max-h-40 overflow-y-auto custom-scrollbar">
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2"
              >
                <div className={`mt-0.5 text-${accentColor}-400 flex-shrink-0`}>
                  {icon}
                </div>
                <span className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={`text-sm italic ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            None specified
          </div>
        )}
      </div>
    </motion.div>
  );
};
```

**Visual Improvements:**
- ✅ Staggered item animations
- ✅ Custom icons per item
- ✅ Accent color theming
- ✅ Hover effect on card
- ✅ Better scrollbar styling
- ✅ Empty state handling

---

### 5. Moodboard AI Summary Enhancement

**Current State:**
```typescript
// Plain text display after generation (Line 114)
updateBoard(activeBoard.id, board => ({ ...board, aiSummary: summary }));
```

**Enhanced Version:**

```typescript
const MoodboardAISummary: React.FC<{
  summary: string | undefined;
  isGenerating: boolean;
  onRegenerate: () => void;
}> = ({ summary, isGenerating, onRegenerate }) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-gray-800/50'
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}
    >
      {/* Header with action button */}
      <div className={`px-6 py-4 border-b ${
        isDark ? 'border-gray-800/50' : 'border-gray-200'
      } bg-gradient-to-r from-purple-500/10 via-teal-500/10 to-pink-500/10 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <motion.div
            animate={isGenerating ? {
              rotate: 360,
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <SparklesIcon className="w-5 h-5 text-purple-400" />
          </motion.div>
          <h4 className={`text-lg font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            AI Visual Language Summary
          </h4>
        </div>

        <Button
          variant="secondary"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="!text-xs !py-2 !px-3"
        >
          <RefreshCwIcon className={`w-3 h-3 mr-1 ${
            isGenerating ? 'animate-spin' : ''
          }`} />
          Regenerate
        </Button>
      </div>

      {/* Content */}
      <div className="p-6">
        {isGenerating ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, width: 0 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  width: `${85 - i * 5}%`
                }}
                transition={{
                  opacity: { duration: 1.5, repeat: Infinity, delay: i * 0.15 },
                  width: { duration: 0.5, delay: i * 0.1 }
                }}
                className={`h-3 rounded ${
                  isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Parse summary into sections */}
            {summary.split('\n\n').map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`text-sm leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              No AI summary generated yet
            </p>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="h-1 bg-gradient-to-r from-purple-500/50 via-teal-500/50 to-pink-500/50" />
    </motion.div>
  );
};
```

**Visual Improvements:**
- ✅ Regenerate button in header
- ✅ Animated sparkles icon
- ✅ Loading skeleton with staggered animation
- ✅ Paragraph-based formatting
- ✅ Empty state with icon
- ✅ Multi-color gradient accents

---

## 🎨 Design Tokens

### Colors (Matching Cast & Locations)

```typescript
const DESIGN_TOKENS = {
  colors: {
    accent: {
      primary: '#10A37F',      // Teal-500
      secondary: '#0E8C6D',    // Teal-600
      purple: '#A855F7',       // Purple-500
      emerald: '#10B981',      // Emerald-500
    },
    gradients: {
      card: {
        dark: 'from-[#1A1A1A] to-[#0F0F0F]',
        light: 'from-white to-gray-50',
      },
      hover: {
        dark: 'from-teal-500/10 to-purple-500/10',
        light: 'from-teal-400/20 to-purple-400/20',
      },
      header: {
        teal: 'from-teal-500/10 to-emerald-500/10',
        purple: 'from-purple-500/10 via-teal-500/10 to-pink-500/10',
      }
    }
  },
  borders: {
    default: 'border-gray-800/50',      // Dark mode
    light: 'border-gray-200',           // Light mode
    hover: 'border-teal-500/50',        // Hover state
  },
  shadows: {
    card: 'shadow-2xl',
    hoverDark: 'shadow-teal-500/20',
    hoverLight: 'shadow-teal-500/30',
  },
  animations: {
    cardHover: {
      y: -8,
      scale: 1.02,
      duration: 0.3,
      ease: "easeOut"
    },
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      duration: 0.4
    },
    stagger: {
      delay: (index: number) => index * 0.05
    }
  }
};
```

---

## 📐 Layout Grid

### Script Tab Analysis Section Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Enhanced Info Card Grid - 3 columns]                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Cast: 5  │  │Locations │  │ Scenes   │                  │
│  │  (icon)  │  │  : 3     │  │  : 12    │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [AI Generated Summary - Full Width Card]                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🌟 AI-Generated Summary        [Gemini 2.5 Pro Badge]  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │  Summary content with proper spacing and typography...  ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Enhanced List Grid - 3 columns]                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Key Props │  │ Styling  │  │   Set    │                  │
│  │  • Item  │  │  • Item  │  │ Dressing │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐                                 │
│  │ Makeup & │  │  Sound   │                                 │
│  │   Hair   │  │   Cues   │                                 │
│  └──────────┘  └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Plan

### Phase 1: Core Components (Priority: HIGH)
**Files to Update:**
- `tabs/ScriptTab.tsx` (lines 16-38, 189-259)

**Changes:**
1. Replace `AnalysisInfoCard` with `EnhancedAnalysisInfoCard`
2. Replace `AnalysisSection` with `EnhancedAnalysisSection`
3. Add new `AIGeneratedSummary` component
4. Update list displays with `EnhancedListDisplay`

**Estimated Time:** 2-3 hours

---

### Phase 2: Moodboard Enhancement (Priority: MEDIUM)
**Files to Update:**
- `tabs/MoodboardTab.tsx` (lines 104-121, 274-299)

**Changes:**
1. Add `MoodboardAISummary` component
2. Update AI summary display section
3. Add regenerate functionality
4. Improve empty states

**Estimated Time:** 1-2 hours

---

### Phase 3: Polish & Testing (Priority: MEDIUM)
**Tasks:**
1. Test animations across different screen sizes
2. Verify dark/light mode consistency
3. Check accessibility (keyboard navigation, ARIA labels)
4. Optimize performance (reduce re-renders)
5. Add loading states and error handling

**Estimated Time:** 1-2 hours

---

## 🎯 Success Criteria

### Visual Consistency
- ✅ All tabs use matching gradient backgrounds
- ✅ Consistent hover animations (y: -8, scale: 1.02)
- ✅ Unified color palette (teal/emerald/purple)
- ✅ Matching border and shadow styles

### User Experience
- ✅ Smooth, professional animations (300-600ms)
- ✅ Clear visual hierarchy
- ✅ Loading states provide feedback
- ✅ Empty states are informative

### Technical
- ✅ No performance regressions
- ✅ Maintains existing functionality
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Responsive across breakpoints

---

## 📚 References

### Existing Patterns to Match
- **Cast & Locations Card:** `tabs/CastLocationsTab.tsx:159-300`
- **Status Badges:** `tabs/CastLocationsTab.tsx:171-214`
- **Hover Animations:** Uses Framer Motion `whileHover`
- **Color Scheme:** Teal (#10A37F), Emerald (#10B981), Purple (#A855F7)

### Design System Components
- **Framer Motion:** For all animations
- **Tailwind CSS:** For styling with custom gradients
- **Theme Context:** `useTheme()` for dark/light mode

---

## 💡 Additional Recommendations

### Future Enhancements
1. **Skeleton Loaders:** Add more sophisticated loading skeletons for all sections
2. **Tooltips:** Add informative tooltips on hover for badges and icons
3. **Export Functionality:** Allow exporting AI summaries as PDF/text
4. **Copy to Clipboard:** Quick copy buttons for AI-generated content
5. **Comparison View:** Side-by-side comparison of multiple moodboard summaries

### Performance Optimizations
1. **Lazy Loading:** Defer rendering of off-screen components
2. **Memoization:** Use `React.memo` for enhanced components
3. **Virtual Scrolling:** For long lists (props, styling, etc.)
4. **Image Optimization:** Lazy load images with blur-up effect

---

## 🎨 Component Library Reference

All enhanced components should be:
- **Reusable:** Extract to `/components` directory if used in multiple places
- **Themeable:** Support dark/light mode via `useTheme()`
- **Accessible:** Include proper ARIA labels and keyboard navigation
- **Performant:** Minimize re-renders with proper React optimization

---

**Document Version:** 1.0
**Last Updated:** 2025-11-16
**Next Review:** After Phase 1 implementation
