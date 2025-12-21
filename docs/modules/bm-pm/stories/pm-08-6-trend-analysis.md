# PM-08.6: Trend Analysis / Analytics Export

**Epic:** PM-08 - Prism Agent & Predictive Analytics
**Story:** PM-08.6 - Trend Analysis / Analytics Export
**Type:** Feature
**Points:** 5
**Status:** Done

---

## User Story

**As a** project lead
**I want** to export analytics data in various formats
**So that** I can share insights with stakeholders and integrate data with other systems

---

## Acceptance Criteria

### 1. CSV Export (AC-6.1)

- [ ] Export button available on analytics dashboard
- [ ] CSV includes: velocity metrics, scope metrics, completion metrics
- [ ] CSV includes timestamps and project metadata
- [ ] CSV download triggers immediately on click
- [ ] Filename format: `{project-name}-analytics-{date}.csv`
- [ ] CSV properly handles special characters and escaping
- [ ] Large datasets (>10k rows) handled without timeout

### 2. PDF Report Export (AC-6.2)

- [ ] PDF export option available alongside CSV
- [ ] PDF includes summary section with key metrics
- [ ] PDF includes trend charts (velocity, scope, completion)
- [ ] PDF includes risk summary section
- [ ] PDF includes team performance overview
- [ ] PDF generation completes within 10 seconds
- [ ] Filename format: `{project-name}-report-{date}.pdf`
- [ ] PDF styling matches application branding

### 3. Export API Endpoints (AC-6.3)

- [ ] `GET /analytics/:projectId/export/csv` endpoint
- [ ] `GET /analytics/:projectId/export/pdf` endpoint
- [ ] Both endpoints require project read access
- [ ] Endpoints support date range parameters
- [ ] Response includes proper Content-Type headers
- [ ] Response includes Content-Disposition for download

### 4. Trend Data Structure (AC-6.4)

- [ ] `getTrendData()` service method aggregates all trends
- [ ] Trend data includes velocity over time
- [ ] Trend data includes scope changes over time
- [ ] Trend data includes completion rate over time
- [ ] Trend data includes team productivity metrics
- [ ] Data formatted for chart rendering

### 5. Export History (AC-6.5)

- [ ] Track export history per project (optional)
- [ ] Record export type, date, user
- [ ] Allow re-downloading recent exports

---

## Technical Notes

### Implementation Approach

1. **CSV Generation:**
   - Use NestJS StreamableFile for large datasets
   - Aggregate data from existing analytics methods
   - Proper CSV formatting with headers

2. **PDF Generation:**
   - Use @react-pdf/renderer or PDFKit for server-side PDF
   - Include embedded charts as images
   - Apply consistent branding

3. **API Design:**
   ```typescript
   // CSV Export
   GET /analytics/:projectId/export/csv
   Query: { startDate?, endDate?, metrics?: string[] }
   Response: text/csv stream

   // PDF Export
   GET /analytics/:projectId/export/pdf
   Query: { startDate?, endDate? }
   Response: application/pdf stream
   ```

4. **Data Sources:**
   - Reuse existing analytics service methods
   - `getVelocityTrend()`, `getScopeTrend()`, etc.
   - `getDashboardData()` for summary

---

## Dependencies

- PM-08-4: Analytics Dashboard (provides base metrics)
- PM-08-5: Team Performance Metrics (included in exports)

---

## Definition of Done

- [ ] CSV export functional and tested
- [ ] PDF export functional and tested
- [ ] API endpoints documented
- [ ] Export permissions enforced
- [ ] Performance validated (<10s for PDF)
- [ ] Code review approved
