# Story 6.3: Analytics Dashboard and Reports

**Epic**: Epic 6 - Project Quality Analytics & Feedback
**PRD Reference**: Section 6, Epic 6, Story 6.3
**Status**: Not Started
**Priority**: Medium (V2.2 Enhancement)
**Estimated Effort**: 6 story points
**Dependencies**: Story 6.1 (Creative Quality Analysis), Story 6.2 (Technical Performance Analytics)
**Last Updated**: 2025-11-09

---

## User Story

**As a** filmmaker,
**I want to** view comprehensive analytics visualizations and export professional reports,
**So that** I can review project quality, share insights with collaborators, and track improvement over time.

---

## Business Value

**Problem Statement**:
Analytics data from Stories 6.1 (creative quality) and 6.2 (technical performance) exist as raw metrics, but filmmakers need:
- **Visual Dashboards**: Intuitive charts and graphs to understand quality and performance at a glance
- **Professional Reports**: Exportable PDF reports for client presentations, team reviews, or portfolio documentation
- **Trend Tracking**: Historical comparison to track improvement across projects over time

Without these capabilities, analytics data remains underutilized and inaccessible to non-technical stakeholders.

**Value Proposition**:
A unified analytics dashboard with exportable reports enables filmmakers to:
- Identify quality issues visually (color consistency charts, lighting coherence graphs)
- Present technical performance to clients or collaborators (cost breakdowns, efficiency metrics)
- Track improvement over time (success rate trends, error rate reductions)
- Make data-driven decisions (optimize workflows based on visual insights)

**Success Metric**: >80% of filmmakers who enable analytics use the dashboard at least once per project; >50% export at least one PDF report.

---

## Acceptance Criteria

### AC1: Unified Analytics Dashboard UI
**Given** I have completed a project with analytics enabled (Stories 6.1 + 6.2),
**When** I navigate to the Analytics Tab,
**Then** I should see a unified dashboard with the following sections:

**Dashboard Layout**:
1. **Overview Summary** (top of page):
   - Project Name and Duration
   - Overall Quality Score (0-100, aggregate of creative + technical metrics)
   - Total Cost (USD)
   - Total Render Time
   - Last Analyzed: Timestamp
2. **Creative Quality Section** (from Story 6.1):
   - Color Consistency Score (0-100) with gauge chart
   - Lighting Coherence Score (0-100) with gauge chart
   - Look Bible Adherence Score (0-100) with gauge chart
   - Top 3 Creative Issues (badges with severity indicators)
3. **Technical Performance Section** (from Story 6.2):
   - Cost Breakdown (pie chart: image, video, audio)
   - Render Time Breakdown (bar chart: by operation type)
   - Error Rate (gauge chart: 0-100%)
   - Success Rate (gauge chart: 0-100%)
4. **Recommendations Section**:
   - Combined list of creative + technical suggestions (max 10, prioritized)
   - Each suggestion has: Icon, Title, Description, "Apply" or "Dismiss" button
5. **Trend Tracking Section**:
   - Quality score trends (line chart: last 5 projects)
   - Cost trends (line chart: last 5 projects)
   - Error rate trends (line chart: last 5 projects)

**Verification**:
- Complete 1 project with analytics enabled
- Verify all dashboard sections display
- Verify data accuracy (cross-check with raw metrics from 6.1 and 6.2)

---

### AC2: Interactive Visualizations
**Given** I am viewing the analytics dashboard,
**When** I interact with visualizations,
**Then** I should have the following capabilities:

**Interactive Features**:
1. **Hover Details**:
   - Hover over chart elements to see detailed values
   - Example: Pie chart slice shows "Image Generation: $2.35 (29% of total cost)"
2. **Click-to-Drill-Down**:
   - Click on chart elements to drill down into details
   - Example: Click "Error Rate" gauge → opens modal with detailed error breakdown
3. **Filterable Views**:
   - Filter by date range (last 7 days, 30 days, all time, custom range)
   - Filter by operation type (image, video, audio)
   - Filter by model (Flux, Imagen, Veo, etc.)
4. **Sortable Tables**:
   - Recommendation list sortable by priority, type, or date
   - Issue list sortable by severity, scene, or type
5. **Theme Compatibility**:
   - All charts respect current theme (dark mode, light mode)
   - Color palette uses existing theme colors from `useTheme()` hook

**Verification**:
- Test all interactive features (hover, click, filter, sort)
- Verify theme switching (light/dark mode) updates charts correctly
- Test drill-down modals open with correct data

---

### AC3: Exportable PDF Reports
**Given** I want to share analytics insights,
**When** I click "Export PDF Report" in the Analytics Tab,
**Then** I should receive a professionally formatted PDF with:

**PDF Report Contents**:
1. **Cover Page**:
   - Project Name
   - Date Range Analyzed
   - Report Generated: Timestamp
   - Alkemy AI Studio Branding
2. **Executive Summary** (1 page):
   - Overall Quality Score (large, prominent)
   - Key Metrics Summary (cost, time, errors, success rate)
   - Top 3 Strengths (highest-scoring areas)
   - Top 3 Improvement Areas (lowest-scoring areas)
3. **Creative Quality Analysis** (2-3 pages):
   - Color Consistency Score + Chart
   - Lighting Coherence Score + Chart
   - Look Bible Adherence Score + Chart
   - Detailed Issue List (table with scene, severity, description)
4. **Technical Performance Analysis** (2-3 pages):
   - Cost Breakdown (pie chart)
   - Render Time Analysis (bar chart)
   - Error Analysis (table with error types, counts, timestamps)
   - Efficiency Metrics (success rate, generations/hour, retries)
5. **Recommendations** (1-2 pages):
   - Combined creative + technical suggestions (numbered list)
   - Each suggestion has: Priority, Category, Action Item
6. **Trend Analysis** (1 page):
   - Quality score trends (line chart: last 5 projects)
   - Cost trends (line chart)
   - Error rate trends (line chart)
7. **Appendices** (optional):
   - Raw Data Tables (if user opts in)
   - Methodology Notes (how scores are calculated)

**PDF Export Options**:
- Include/exclude raw data appendices (checkbox)
- Date range selector (all time, last 30 days, custom range)
- Theme selector (light or dark mode for PDF)

**Verification**:
- Export PDF report
- Verify all sections present and correctly formatted
- Open PDF in multiple viewers (browser, Adobe Reader, Preview)
- Test with/without raw data appendices

---

### AC4: Trend Tracking Across Projects
**Given** I have completed multiple projects,
**When** I view the Trend Tracking section of the Analytics Tab,
**Then** I should see historical trends with:

**Trend Visualizations**:
1. **Quality Score Trends** (line chart):
   - X-axis: Project completion date
   - Y-axis: Overall quality score (0-100)
   - Data points: One per project (up to last 10 projects)
   - Trendline: Linear regression showing improvement/decline
2. **Cost Trends** (line chart):
   - X-axis: Project completion date
   - Y-axis: Total project cost (USD)
   - Data points: One per project
   - Target line: Optional cost goal (set by user)
3. **Error Rate Trends** (line chart):
   - X-axis: Project completion date
   - Y-axis: Error rate (%)
   - Data points: One per project
   - Trendline: Shows improvement/decline
4. **Efficiency Trends** (line chart):
   - X-axis: Project completion date
   - Y-axis: Generations per hour
   - Data points: One per project

**Trend Insights**:
- Automatic insights displayed above charts:
  - "Quality improving: +12% over last 5 projects"
  - "Costs trending down: -18% since 3 projects ago"
  - "Error rate stable: 8-12% range for last 10 projects"

**Verification**:
- Complete 5 projects with analytics enabled
- Verify trend charts display all projects
- Verify trendlines and insights are accurate
- Test with fewer than 5 projects (graceful degradation)

---

### AC5: Dashboard Customization and Filters
**Given** I want to focus on specific analytics areas,
**When** I interact with dashboard controls,
**Then** I should be able to customize the view:

**Customization Options**:
1. **Widget Visibility**:
   - Toggle sections on/off (Creative Quality, Technical Performance, Recommendations, Trends)
   - Save widget visibility preferences (localStorage: `alkemy_analytics_dashboard_prefs`)
2. **Date Range Filters**:
   - Filter all metrics by date range (last 7 days, 30 days, all time, custom)
   - Date range applies globally to all dashboard sections
3. **Model Filters**:
   - Filter performance metrics by model (Flux, Imagen, Veo, etc.)
   - Show only metrics for selected models
4. **Severity Filters** (for issues/recommendations):
   - Show only Critical, Warning, or Info severity items
   - Default: Show all severities
5. **Comparison Mode**:
   - Compare current project to:
     - Previous project
     - Average of last 5 projects
     - Best project (highest quality score)
   - Side-by-side comparison view

**Verification**:
- Test all filter types (date, model, severity)
- Verify widget visibility persists across sessions
- Test comparison mode with multiple projects

---

### AC6: Real-Time Dashboard Updates
**Given** I am actively working on a project with the Analytics Tab open,
**When** new operations complete (image generation, video rendering, etc.),
**Then** the dashboard should update in real-time:

**Update Behavior**:
- Metrics refresh automatically when new operations complete
- Charts animate to show new data (smooth transitions via Framer Motion)
- No full page reload required
- Update indicator appears briefly (e.g., "Dashboard updated" Toast)
- Update frequency: Every 5 seconds (debounced to avoid excessive updates)

**Manual Refresh**:
- "Refresh" button forces immediate update
- Refresh timestamp displayed ("Last updated: 2 minutes ago")

**Verification**:
- Open Analytics Tab
- Generate images/videos in another tab
- Verify dashboard updates within 5 seconds
- Test manual refresh button

---

### AC7: Shareable Dashboard Links
**Given** I want to share analytics with collaborators,
**When** I click "Share Dashboard" in the Analytics Tab,
**Then** I should be able to generate a shareable link:

**Shareable Link Features**:
- **Public View** (if user enables):
  - Generate unique URL (e.g., `https://alkemy1.vercel.app/analytics/share/abc123xyz`)
  - Public URL shows read-only analytics dashboard
  - No authentication required to view
  - Configurable expiration (24 hours, 7 days, 30 days, never)
- **Private View** (default):
  - Link requires authentication (user must log in to Alkemy)
  - Only users with project access can view analytics
- **Link Management**:
  - View active shared links (list with expiration dates)
  - Revoke links (delete shared access)
  - Copy link to clipboard (one-click)

**Privacy Controls**:
- User must explicitly enable sharing (confirmation dialog)
- Warning: "This link will allow anyone to view your project analytics"
- Option to password-protect shared links

**Verification**:
- Generate shareable link (public and private)
- Open link in incognito window (verify access control)
- Test expiration (link becomes invalid after expiration)
- Test revoke (link stops working immediately)

---

### AC8: Analytics Dashboard Accessibility
**Given** I am using assistive technologies,
**When** I navigate the Analytics Tab,
**Then** the dashboard should be fully accessible:

**Accessibility Features**:
1. **Screen Reader Support**:
   - All charts have `aria-label` descriptions (e.g., "Color consistency score: 85 out of 100")
   - Data tables have proper header associations
   - Recommendations list is keyboard navigable
2. **Keyboard Navigation**:
   - Tab through all interactive elements (charts, filters, buttons)
   - Enter/Space to activate buttons and drill-down
   - Escape to close modals
3. **Color Contrast**:
   - All text meets WCAG AA contrast standards (4.5:1 for normal text)
   - Charts use accessible color palettes (colorblind-friendly)
4. **Focus Indicators**:
   - Clear focus outlines on all interactive elements
   - Focus trap in modals (keyboard doesn't escape modal)
5. **Alternative Text**:
   - All visualizations have text-based alternatives (data tables)
   - "View Data Table" button for each chart

**Verification**:
- Test with screen reader (NVDA, VoiceOver, JAWS)
- Navigate dashboard using only keyboard (no mouse)
- Run accessibility audit (Lighthouse, axe DevTools)
- Test with colorblind simulation tools

---

## Integration Verification

### IV1: Dashboard Integrates With Creative and Technical Analytics
**Requirement**: Dashboard correctly displays data from both Story 6.1 (creative quality) and Story 6.2 (technical performance) without conflicts.

**Verification Steps**:
1. Complete project with both creative and technical analytics enabled
2. Navigate to Analytics Tab
3. Verify Creative Quality section displays metrics from Story 6.1
4. Verify Technical Performance section displays metrics from Story 6.2
5. Verify recommendations combine both creative and technical suggestions

**Expected Result**: All data displays accurately, no metric conflicts or data corruption.

---

### IV2: PDF Export Includes All Analytics Data
**Requirement**: Exported PDF reports contain complete data from both creative and technical analytics.

**Verification Steps**:
1. Complete project with full analytics
2. Export PDF report
3. Verify PDF contains creative quality analysis (color, lighting, Look Bible)
4. Verify PDF contains technical performance analysis (cost, time, errors)
5. Verify PDF contains trend analysis (if multiple projects exist)

**Expected Result**: PDF is comprehensive and professionally formatted.

---

### IV3: Trend Tracking Works Across Multiple Projects
**Requirement**: Trend tracking aggregates data from multiple projects without data loss or corruption.

**Verification Steps**:
1. Complete 5 projects with analytics enabled
2. Navigate to Analytics Tab
3. Verify trend charts display all 5 projects
4. Verify data points are accurate (cross-check with individual project analytics)
5. Verify trendlines and insights are correct

**Expected Result**: Trends accurately reflect historical project data.

---

## Migration/Compatibility

### MC1: Dashboard Works With Partial Analytics Data
**Requirement**: Dashboard gracefully handles projects with only creative quality OR only technical performance data (not both).

**Verification Steps**:
1. Complete project with only creative quality analysis (no technical tracking)
2. Navigate to Analytics Tab
3. Verify Creative Quality section displays
4. Verify Technical Performance section shows "No data available" placeholder
5. Repeat with only technical performance data (no creative analysis)

**Expected Result**: Dashboard displays available data, shows placeholders for missing sections.

---

### MC2: Existing Projects Can Generate Retroactive Reports
**Requirement**: Projects completed before Story 6.3 can still generate PDF reports (with limited data).

**Verification Steps**:
1. Load project created before analytics feature
2. Navigate to Analytics Tab
3. Verify dashboard shows "Limited data - analytics not enabled during project"
4. Enable analytics tracking
5. Complete new operations (generate images/videos)
6. Verify dashboard updates with new data
7. Export PDF report (verify it includes disclaimer about partial data)

**Expected Result**: Retroactive reports work with available data, clear messaging about limitations.

---

## Technical Implementation Notes

### Component Architecture

**New Component**: `tabs/AnalyticsTab.tsx`

**State**:
```typescript
const [creativeQuality, setCreativeQuality] = useState<CreativeQualityReport | null>(null);
const [performanceMetrics, setPerformanceMetrics] = useState<TechnicalPerformanceMetrics | null>(null);
const [trendData, setTrendData] = useState<ProjectTrend[]>([]);
const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
const [visibleWidgets, setVisibleWidgets] = useState<string[]>([
  'creative', 'technical', 'recommendations', 'trends'
]);
const [selectedFilters, setSelectedFilters] = useState<{
  models: string[];
  severity: ('critical' | 'warning' | 'info')[];
}>({ models: [], severity: [] });
```

**Child Components**:
- `AnalyticsSummary.tsx` - Overview summary section
- `CreativeQualityWidget.tsx` - Creative quality visualizations (from Story 6.1)
- `TechnicalPerformanceWidget.tsx` - Technical performance visualizations (from Story 6.2)
- `RecommendationsWidget.tsx` - Combined recommendations list
- `TrendChartWidget.tsx` - Historical trend visualizations
- `AnalyticsFilters.tsx` - Filter controls (date range, models, severity)
- `PDFExportButton.tsx` - PDF generation and download
- `ShareDashboardButton.tsx` - Shareable link generation

### Charting Library

**Recommendation**: Use a lightweight, accessible charting library:
- **Recharts** (React-friendly, accessible, <100KB gzipped)
- OR **Victory** (accessible, customizable)
- OR **Chart.js with react-chartjs-2** (mature, well-documented)

**Chart Types Needed**:
- Gauge charts (quality scores, success rate, error rate)
- Pie charts (cost breakdown)
- Bar charts (render time breakdown)
- Line charts (trend tracking)
- Tables (issue lists, recommendations)

**Example Implementation** (using Recharts):
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CostBreakdownChart = ({ data }: { data: { name: string; value: number }[] }) => {
  const { colors } = useTheme();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors.accent_primary} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

### PDF Generation

**Library**: `jsPDF` + `html2canvas` for client-side PDF generation

**PDF Generation Workflow**:
1. User clicks "Export PDF Report"
2. Render hidden HTML template with analytics data
3. Convert HTML to canvas using `html2canvas`
4. Generate PDF from canvas using `jsPDF`
5. Download PDF file (`project-analytics-report-YYYY-MM-DD.pdf`)

**Example Implementation**:
```typescript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

async function generatePDFReport(
  creativeQuality: CreativeQualityReport,
  performanceMetrics: TechnicalPerformanceMetrics,
  includeRawData: boolean
): Promise<Blob> {
  // Render hidden HTML template with analytics data
  const reportHTML = renderReportTemplate(creativeQuality, performanceMetrics, includeRawData);
  document.body.appendChild(reportHTML);

  // Convert to canvas
  const canvas = await html2canvas(reportHTML, { scale: 2 });

  // Generate PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  // Cleanup
  document.body.removeChild(reportHTML);

  return pdf.output('blob');
}
```

### Shareable Link System

**URL Structure**: `/analytics/share/:shareId`

**Share Data Storage** (Supabase):
```sql
CREATE TABLE analytics_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_id TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  password_hash TEXT, -- Optional password protection
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_shares_share_id ON analytics_shares(share_id);
```

**Share Route** (React Router):
```typescript
// In App.tsx routes
<Route path="/analytics/share/:shareId" element={<SharedAnalyticsPage />} />
```

**SharedAnalyticsPage Component**:
- Fetches share data by `shareId`
- Verifies share is not expired
- If password-protected, prompts for password
- Renders read-only analytics dashboard

### localStorage Keys

**Dashboard Preferences**:
- `alkemy_analytics_dashboard_prefs`: `{ visibleWidgets: string[]; dateRange: string; theme: string }`
- `alkemy_analytics_filters`: `{ models: string[]; severity: string[] }`

---

## Definition of Done

- [ ] Unified analytics dashboard UI implemented (overview, creative, technical, recommendations, trends)
- [ ] Interactive visualizations functional (hover, click, filter, sort)
- [ ] Exportable PDF reports working (all sections, customizable options)
- [ ] Trend tracking across projects implemented (quality, cost, error rate, efficiency)
- [ ] Dashboard customization and filters functional (widget visibility, date range, model, severity)
- [ ] Real-time dashboard updates working (5-second refresh, manual refresh button)
- [ ] Shareable dashboard links functional (public/private, expiration, revoke)
- [ ] Accessibility features implemented (screen reader, keyboard nav, color contrast)
- [ ] Integration verification complete (creative + technical data, PDF export, trend tracking)
- [ ] Migration/compatibility verified (partial data support, retroactive reports)
- [ ] Charting library integrated (Recharts/Victory/Chart.js)
- [ ] PDF generation working (jsPDF + html2canvas)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Code reviewed and approved by engineering lead
- [ ] User acceptance testing with 5+ filmmakers (>80% dashboard usage, >50% PDF export target)
- [ ] CLAUDE.md updated with analytics dashboard documentation

---

## Dependencies

### Prerequisite
- **Story 6.1** (Creative Quality Analysis): Provides creative quality metrics
- **Story 6.2** (Technical Performance Analytics): Provides performance metrics

### Related Stories
- **Story 6.4** (Director Integration): Director uses dashboard data for suggestions

### External Dependencies
- Charting library (Recharts, Victory, or Chart.js)
- PDF generation library (jsPDF + html2canvas)
- Supabase (optional, for shareable links and cloud sync)
- localStorage (required, for dashboard preferences)

---

## Testing Strategy

### Unit Tests
- Chart components (verify data rendering)
- PDF generation logic (verify PDF structure)
- Filter logic (date range, model, severity filtering)

### Integration Tests
- Dashboard data integration (creative + technical analytics)
- PDF export workflow (from dashboard to download)
- Shareable link workflow (create, access, revoke)

### End-to-End Tests (Playwright)
- Complete project with analytics enabled
- Navigate to Analytics Tab, verify all sections display
- Export PDF report, verify download
- Generate shareable link, open in incognito window

### Manual Testing
- User acceptance testing (5+ filmmakers, usability + export workflow)
- Accessibility testing (screen reader, keyboard-only navigation)
- Browser compatibility (Chrome, Firefox, Safari, Edge)

---

## References

- **PRD**: `docs/prd.md` - Section 6, Epic 6, Story 6.3
- **Story 6.1**: Creative quality analysis data source
- **Story 6.2**: Technical performance data source
- **Charting Libraries**: Recharts (https://recharts.org), Victory (https://formidable.com/open-source/victory/)
- **PDF Generation**: jsPDF (https://github.com/parallax/jsPDF), html2canvas (https://html2canvas.hertzen.com/)

---

**END OF STORY**

*Next Steps: Implement after Stories 6.1 and 6.2 are complete, then integrate with Story 6.4 (Director Agent Analytics Integration).*
