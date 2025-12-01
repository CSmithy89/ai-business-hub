# Brand Asset Audit & Checklist Workflow Instructions

<critical>Asset requirements must be based on actual business channels and needs</critical>
<critical>File specifications must follow industry standards</critical>

## Purpose

This workflow audits brand asset needs and creates a comprehensive checklist of all required brand assets. It ensures nothing is missed before asset generation begins.

<workflow>

<step n="1" goal="Analyze Business Needs">
<action>Review business type and channels</action>
<action>Identify all brand touchpoints</action>

<business_assessment>
| Factor | Relevance | Assets Needed |
|--------|-----------|---------------|
| Website | Y/N | Favicon, OG images, headers |
| Social Media | Which platforms | Platform-specific assets |
| Email Marketing | Y/N | Headers, signatures |
| Print Materials | Y/N | Business cards, letterhead |
| Physical Location | Y/N | Signage, displays |
| Events | Y/N | Banners, name badges |
| Packaging | Y/N | Package design templates |
| App | Y/N | App icons, splash screens |
</business_assessment>
</step>

<step n="2" goal="Define Logo Assets">
<action>List all required logo variations</action>
<action>Specify formats and sizes</action>

<logo_package>
## Logo Package Contents

### Primary Logo
| Asset | Formats | Sizes | Priority |
|-------|---------|-------|----------|
| Full color | AI, EPS, SVG, PNG | Multiple | Essential |
| Single color (dark) | AI, EPS, SVG, PNG | Multiple | Essential |
| Single color (light) | AI, EPS, SVG, PNG | Multiple | Essential |
| Reversed | AI, EPS, SVG, PNG | Multiple | Essential |

### Secondary Logo
| Asset | Formats | Sizes | Priority |
|-------|---------|-------|----------|
| Full color | SVG, PNG | Multiple | High |
| Reversed | SVG, PNG | Multiple | High |

### Icon/Mark
| Asset | Formats | Sizes | Priority |
|-------|---------|-------|----------|
| App icon | PNG | 1024px master | Essential |
| Favicon | ICO, PNG | 16, 32, 180, 192, 512 | Essential |
| Social avatar | PNG | Platform-specific | Essential |
</logo_package>
</step>

<step n="3" goal="Define Social Media Assets">
<action>Identify active platforms</action>
<action>List required assets per platform</action>

<social_assets>
## Social Media Assets

### Facebook
| Asset | Dimensions | Format |
|-------|------------|--------|
| Profile photo | 180×180px | PNG |
| Cover photo | 820×312px | PNG/JPG |
| Post template | 1200×628px | PNG |
| Story template | 1080×1920px | PNG |

### Instagram
| Asset | Dimensions | Format |
|-------|------------|--------|
| Profile photo | 320×320px | PNG |
| Square post | 1080×1080px | PNG |
| Portrait post | 1080×1350px | PNG |
| Story/Reel | 1080×1920px | PNG |

### LinkedIn
| Asset | Dimensions | Format |
|-------|------------|--------|
| Profile photo | 400×400px | PNG |
| Cover photo | 1128×191px | PNG |
| Post template | 1200×628px | PNG |

### Twitter/X
| Asset | Dimensions | Format |
|-------|------------|--------|
| Profile photo | 400×400px | PNG |
| Header | 1500×500px | PNG |
| Post template | 1200×675px | PNG |

### YouTube
| Asset | Dimensions | Format |
|-------|------------|--------|
| Profile photo | 800×800px | PNG |
| Banner | 2560×1440px | PNG |
| Thumbnail | 1280×720px | PNG |
</social_assets>
</step>

<step n="4" goal="Define Collateral Assets">
<action>List business materials needed</action>
<action>Specify dimensions and formats</action>

<collateral_assets>
## Business Collateral

| Asset | Dimensions | Format | Priority |
|-------|------------|--------|----------|
| Business card | 3.5×2" / 88.9×50.8mm | PDF, AI | Essential |
| Letterhead | 8.5×11" / A4 | PDF, DOCX | Essential |
| Envelope (#10) | 4.125×9.5" | PDF, AI | High |
| Envelope (DL) | 110×220mm | PDF, AI | High |
| Presentation template | 16:9 | PPTX, KEY | Essential |
| Document template | Letter/A4 | DOCX, GDOC | High |
| Invoice template | Letter/A4 | PDF, XLSX | High |
| Proposal template | Letter/A4 | DOCX, PDF | Medium |
</collateral_assets>
</step>

<step n="5" goal="Define Digital Assets">
<action>List website and email assets</action>
<action>Specify technical requirements</action>

<digital_assets>
## Digital Assets

### Website
| Asset | Dimensions/Specs | Format |
|-------|-----------------|--------|
| Favicon (16px) | 16×16px | ICO |
| Favicon (32px) | 32×32px | PNG |
| Apple Touch Icon | 180×180px | PNG |
| Android Icon | 192×192px | PNG |
| OG Image | 1200×630px | PNG |
| Twitter Card | 1200×600px | PNG |

### Email
| Asset | Dimensions | Format |
|-------|------------|--------|
| Email header | 600px wide | PNG |
| Email signature | HTML + images | HTML, PNG |
| Newsletter header | 600px wide | PNG |
</digital_assets>
</step>

<step n="6" goal="Prioritize Assets">
<action>Create priority matrix</action>
<action>Identify launch essentials vs future needs</action>

<priority_matrix>
## Priority Matrix

### P1 - Launch Essential (Before go-live)
- Primary logo package
- Favicon set
- Social media profiles
- Business card
- Email signature

### P2 - Early Priority (First 30 days)
- Full social media templates
- Letterhead
- Presentation template
- Website assets

### P3 - Standard (First 90 days)
- Document templates
- Extended collateral
- Marketing templates

### P4 - As Needed
- Event materials
- Specialty items
- Extended formats
</priority_matrix>
</step>

<step n="7" goal="Define Specifications">
<action>Document file format requirements</action>
<action>Specify naming conventions</action>

<specifications>
## File Specifications

### Naming Convention
`[brand]-[asset]-[variant]-[size].[format]`

Example: `acme-logo-primary-color-@2x.png`

### Format Requirements
| Format | Color Space | Resolution | Use |
|--------|-------------|------------|-----|
| AI | CMYK | Vector | Master files |
| EPS | CMYK | Vector | Print production |
| SVG | sRGB | Vector | Web |
| PNG | sRGB | 72-300dpi | Digital |
| JPG | sRGB | 72-300dpi | Photos |
| PDF | CMYK | Vector | Print |
</specifications>
</step>

<step n="8" goal="Compile Checklist">
<action>Create master asset checklist</action>
<action>Include all categories</action>

<compile_document>
Generate asset-checklist.md with:
- Complete asset inventory
- Priority assignments
- File specifications
- Status tracking columns
</compile_document>
</step>

</workflow>

## Anti-Hallucination Protocol

- Only include assets relevant to identified channels
- Use exact platform dimensions from documentation
- Follow industry standard file specifications
- Base priorities on actual business needs
