# Brand Asset Generation Workflow Instructions

<critical>All assets must follow brand guidelines exactly - no deviations</critical>
<critical>File specifications must match industry standards</critical>
<critical>Logo generation requires actual design tools - this workflow provides specifications</critical>

## Purpose

This workflow generates all brand assets according to the asset checklist and brand guidelines. It provides detailed specifications for asset creation and organizes deliverables for handoff.

**Important**: Actual logo and graphic design requires design software (Illustrator, Figma, etc.). This workflow provides specifications, templates, and guidance for asset creation.

<workflow>

<step n="1" goal="Setup Folder Structure">
<action>Create organized directory structure</action>
<action>Prepare for asset organization</action>

<folder_structure>
```
{{brand-name}}-brand-assets/
├── 01-logos/
│   ├── primary/
│   │   ├── vector/
│   │   │   ├── {{brand}}-logo-primary-color.ai
│   │   │   ├── {{brand}}-logo-primary-color.eps
│   │   │   └── {{brand}}-logo-primary-color.svg
│   │   ├── png/
│   │   │   ├── {{brand}}-logo-primary-color-@1x.png
│   │   │   ├── {{brand}}-logo-primary-color-@2x.png
│   │   │   └── {{brand}}-logo-primary-color-@3x.png
│   │   └── reversed/
│   ├── secondary/
│   ├── icon/
│   └── favicon/
├── 02-colors/
│   ├── {{brand}}-color-palette.ase
│   └── {{brand}}-color-swatches.pdf
├── 03-typography/
│   ├── fonts/
│   └── type-specimens.pdf
├── 04-social-media/
│   ├── facebook/
│   ├── instagram/
│   ├── linkedin/
│   ├── twitter/
│   └── youtube/
├── 05-business-collateral/
│   ├── business-card/
│   ├── letterhead/
│   ├── envelope/
│   └── templates/
├── 06-digital/
│   ├── website/
│   └── email/
├── 07-templates/
│   ├── presentation/
│   └── documents/
└── README.txt
```
</folder_structure>
</step>

<step n="2" goal="Generate Logo Assets">
<action>Export logo in all required formats</action>
<action>Create all variations</action>

<logo_specifications>
## Logo Export Specifications

### Vector Formats

**Adobe Illustrator (.ai)**
- Color mode: CMYK
- Artboard: Trimmed to artwork
- Fonts: Outlined
- Save as: AI (latest version)

**EPS (.eps)**
- Version: EPS 10
- Color mode: CMYK
- Fonts: Outlined
- Include preview

**SVG (.svg)**
- Color mode: sRGB
- Optimize for web
- Convert fonts to outlines
- Remove metadata

### Raster Formats

**PNG (.png)**
- Color space: sRGB
- Bit depth: 24-bit (8-bit with transparency)
- Background: Transparent
- Sizes: @1x, @2x, @3x

**Size Guide**:
| Use Case | @1x | @2x | @3x |
|----------|-----|-----|-----|
| Small | 100px | 200px | 300px |
| Medium | 200px | 400px | 600px |
| Large | 400px | 800px | 1200px |

### Favicon Package

| File | Size | Format |
|------|------|--------|
| favicon.ico | 16×16, 32×32 | ICO |
| favicon-16x16.png | 16×16 | PNG |
| favicon-32x32.png | 32×32 | PNG |
| apple-touch-icon.png | 180×180 | PNG |
| android-chrome-192x192.png | 192×192 | PNG |
| android-chrome-512x512.png | 512×512 | PNG |
| site.webmanifest | - | JSON |
</logo_specifications>
</step>

<step n="3" goal="Generate Social Media Assets">
<action>Create profile and cover images</action>
<action>Build post templates</action>

<social_specifications>
## Social Media Asset Specifications

### Profile Photos
Export logo icon at:
- Facebook: 180×180px PNG
- Instagram: 320×320px PNG
- LinkedIn: 400×400px PNG
- Twitter: 400×400px PNG
- YouTube: 800×800px PNG

### Cover/Header Images
Create branded covers:
- Facebook: 820×312px
- LinkedIn: 1128×191px
- Twitter: 1500×500px
- YouTube: 2560×1440px (safe area: 1546×423px center)

### Post Templates
Design reusable templates:
| Platform | Dimensions | Include |
|----------|------------|---------|
| Facebook | 1200×628px | Logo, brand colors, text area |
| Instagram Square | 1080×1080px | Logo, brand colors, text area |
| Instagram Portrait | 1080×1350px | Logo, brand colors, text area |
| LinkedIn | 1200×628px | Logo, brand colors, text area |
| Twitter | 1200×675px | Logo, brand colors, text area |

### Story Templates
Design for vertical format:
- All platforms: 1080×1920px
- Safe zones for UI elements
- Include logo position
- Text safe area
</social_specifications>
</step>

<step n="4" goal="Generate Collateral Assets">
<action>Create business card design</action>
<action>Create letterhead template</action>
<action>Build presentation template</action>

<collateral_specifications>
## Business Card Specifications

**Dimensions**: 3.5" × 2" (88.9mm × 50.8mm)
**Bleed**: 0.125" (3.175mm)
**Safe Zone**: 0.125" from trim

**Front Content**:
- Logo
- Name
- Title
- Contact info

**Back Options**:
- Logo only
- Pattern
- Tagline

**Export**:
- PDF/X-1a for print
- 300 DPI minimum
- CMYK color

---

## Letterhead Specifications

**Dimensions**: 8.5" × 11" (US) / A4 (International)
**Margins**: 0.5" minimum

**Header Elements**:
- Logo (corner or centered)
- Contact info

**Footer Elements**:
- Address
- Website/email
- Legal text (if required)

**Export**:
- PDF for print
- DOCX for editing
- Google Docs template

---

## Presentation Template

**Format**: 16:9 (1920×1080px)

**Required Slides**:
1. Title slide
2. Section divider
3. Content - text
4. Content - image left
5. Content - image right
6. Two column
7. Quote slide
8. Data/chart slide
9. Thank you/contact

**Branding**:
- Logo on each slide
- Brand colors
- Typography
- Footer elements
</collateral_specifications>
</step>

<step n="5" goal="Generate Digital Assets">
<action>Create favicon package</action>
<action>Create email assets</action>
<action>Create OG images</action>

<digital_specifications>
## Email Signature

**HTML Signature**:
- Width: 600px max
- Include: Logo, name, title, contact
- Font: Web-safe (Arial, Helvetica)
- Links: Styled to brand color

**Image Signature**:
- Width: 300px
- Format: PNG
- Include: Logo, minimal text

---

## Open Graph Image

**Dimensions**: 1200×630px
**Content**:
- Logo
- Brand colors
- Optional: Tagline

---

## Twitter Card

**Dimensions**: 1200×600px
**Content**: Similar to OG image
</digital_specifications>
</step>

<step n="6" goal="Apply Messaging">
<action>Add tagline to relevant assets</action>
<action>Include key messages in templates</action>

<messaging_application>
Apply brand messaging to:
- Presentation templates (tagline on title slide)
- Social media templates (key messages)
- Email signatures (tagline option)
- Business cards (tagline if fits)
</messaging_application>
</step>

<step n="7" goal="Quality Check">
<action>Verify all assets against checklist</action>
<action>Check brand compliance</action>

<quality_checklist>
For each asset verify:
- [ ] Correct dimensions
- [ ] Proper color mode (RGB/CMYK)
- [ ] Brand colors accurate
- [ ] Logo usage correct
- [ ] Typography correct
- [ ] File format correct
- [ ] Naming convention followed
- [ ] Quality acceptable
</quality_checklist>
</step>

<step n="8" goal="Package for Delivery">
<action>Organize final package</action>
<action>Create README</action>
<action>Generate manifest</action>

<delivery_package>
## Asset Package Contents

Create README.txt with:
- Package contents overview
- Folder structure explanation
- File naming convention
- Color codes quick reference
- Font information
- Contact for questions

Create manifest.md with:
- Complete asset inventory
- File locations
- Version info
- Generation date
</delivery_package>
</step>

</workflow>

## Anti-Hallucination Protocol

- Use exact specifications from brand guidelines
- Follow platform-documented dimensions
- Do not invent file formats or sizes
- Acknowledge when actual design tools are required
