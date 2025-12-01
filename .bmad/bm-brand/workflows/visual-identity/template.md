# Visual Identity Guide

> **Generated**: {{date}}
> **Business**: {{business_name}}
> **Primary Archetype**: {{archetype}}
> **Status**: {{status}}

---

## Executive Summary

{{visual_summary}}

### Visual Identity at a Glance

| Element | Specification |
|---------|---------------|
| **Logo Type** | {{logo_type}} |
| **Primary Color** | {{primary_color}} #{{hex}} |
| **Primary Font** | {{primary_font}} |
| **Visual Style** | {{visual_style}} |

---

## 1. Logo System

### Logo Type

**Selected**: {{logo_type}}

**Rationale**: {{logo_rationale}}

### Logo Variations

| Variation | Use Case | Description |
|-----------|----------|-------------|
| Primary | Default usage | {{description}} |
| Secondary | Compact spaces | {{description}} |
| Icon/Mark | App icons, favicons | {{description}} |
| Horizontal | Wide banners | {{description}} |
| Vertical | Narrow spaces | {{description}} |
| Single-color (dark) | Print limitations | {{description}} |
| Single-color (light) | Dark backgrounds | {{description}} |

### Clear Space

**Minimum Clear Space**: {{multiplier}}× height of logo mark

```
┌─────────────────────────────┐
│         ↕ 1x               │
│      ┌─────────┐           │
│ ←1x→ │  LOGO   │ ←1x→      │
│      └─────────┘           │
│         ↕ 1x               │
└─────────────────────────────┘
```

### Minimum Sizes

| Application | Minimum Size |
|-------------|--------------|
| Print | {{inches}}" / {{mm}}mm height |
| Digital | {{px}}px height |
| Favicon | {{px}}px × {{px}}px |
| App Icon | {{px}}px × {{px}}px |

### Logo Don'ts

| Don't | Example |
|-------|---------|
| Stretch or distort | [Visual: Distorted logo] |
| Rotate the logo | [Visual: Rotated logo] |
| Change brand colors | [Visual: Wrong colors] |
| Add drop shadows | [Visual: Shadow effect] |
| Place on busy backgrounds | [Visual: Cluttered background] |
| Crop any portion | [Visual: Cropped logo] |
| Rearrange elements | [Visual: Rearranged] |
| Add outlines or effects | [Visual: Effects added] |

### File Formats Required

| Format | Type | Use Case |
|--------|------|----------|
| .AI | Vector | Master file (Adobe Illustrator) |
| .EPS | Vector | Print production |
| .SVG | Vector | Web, digital applications |
| .PDF | Vector | Print, sharing |
| .PNG | Raster | Digital, transparency needed |
| .JPG | Raster | Social media, web |

---

## 2. Color Palette

### Primary Palette

#### Primary Brand Color: {{primary_name}}

| Format | Value |
|--------|-------|
| **HEX** | #{{hex}} |
| **RGB** | {{r}}, {{g}}, {{b}} |
| **CMYK** | {{c}}%, {{m}}%, {{y}}%, {{k}}% |
| **Pantone** | PMS {{number}} C |
| **HSL** | {{h}}°, {{s}}%, {{l}}% |

**Usage**: {{primary_usage}}

**Psychology**: {{color_meaning}}

---

#### Secondary Brand Color: {{secondary_name}}

| Format | Value |
|--------|-------|
| **HEX** | #{{hex}} |
| **RGB** | {{r}}, {{g}}, {{b}} |
| **CMYK** | {{c}}%, {{m}}%, {{y}}%, {{k}}% |
| **Pantone** | PMS {{number}} C |

**Usage**: {{secondary_usage}}

---

#### Accent Color: {{accent_name}}

| Format | Value |
|--------|-------|
| **HEX** | #{{hex}} |
| **RGB** | {{r}}, {{g}}, {{b}} |
| **CMYK** | {{c}}%, {{m}}%, {{y}}%, {{k}}% |
| **Pantone** | PMS {{number}} C |

**Usage**: {{accent_usage}}

---

### Color Ratios

```
Primary (60%)    ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░
Secondary (30%)  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████████████████░░░░░░
Accent (10%)     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░███████
```

### Extended Palette

#### Neutrals

| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| White | #FFFFFF | 255, 255, 255 | Backgrounds, space |
| Light Gray | #{{hex}} | {{r}}, {{g}}, {{b}} | Subtle backgrounds |
| Medium Gray | #{{hex}} | {{r}}, {{g}}, {{b}} | Borders, dividers |
| Dark Gray | #{{hex}} | {{r}}, {{g}}, {{b}} | Secondary text |
| Black | #{{hex}} | {{r}}, {{g}}, {{b}} | Primary text |

#### Semantic Colors

| Purpose | Color | HEX | Usage |
|---------|-------|-----|-------|
| Success | {{name}} | #{{hex}} | Confirmations, positive |
| Warning | {{name}} | #{{hex}} | Cautions, alerts |
| Error | {{name}} | #{{hex}} | Errors, destructive |
| Info | {{name}} | #{{hex}} | Information, tips |

#### Tints & Shades

**Primary Color Tints/Shades**:

| Level | HEX | Usage |
|-------|-----|-------|
| 10% Tint | #{{hex}} | Subtle backgrounds |
| 25% Tint | #{{hex}} | Light accents |
| 50% Tint | #{{hex}} | Medium emphasis |
| 75% Shade | #{{hex}} | Darker elements |
| 90% Shade | #{{hex}} | Heavy contrast |

### Color Accessibility

| Combination | Contrast Ratio | WCAG Level |
|-------------|----------------|------------|
| Primary on White | {{ratio}}:1 | {{AA/AAA}} |
| White on Primary | {{ratio}}:1 | {{AA/AAA}} |
| Dark Gray on White | {{ratio}}:1 | {{AA/AAA}} |
| Black on Light Gray | {{ratio}}:1 | {{AA/AAA}} |

---

## 3. Typography

### Font Families

#### Primary Font: {{primary_font}}

**Use For**: Headlines, titles, hero text

| Property | Value |
|----------|-------|
| **Family** | {{font_name}} |
| **Weights** | {{weights}} |
| **Style** | {{sans-serif/serif}} |
| **Source** | {{source}} |
| **License** | {{license_type}} |

**Fallback Stack**: `{{font_name}}, {{fallback1}}, {{fallback2}}, {{generic}}`

---

#### Secondary Font: {{secondary_font}}

**Use For**: Body copy, paragraphs, general text

| Property | Value |
|----------|-------|
| **Family** | {{font_name}} |
| **Weights** | {{weights}} |
| **Style** | {{style}} |
| **Source** | {{source}} |

**Fallback Stack**: `{{font_name}}, {{fallback1}}, {{generic}}`

---

#### Monospace Font: {{mono_font}}

**Use For**: Code, data, technical content

**Family**: {{font_name}}
**Fallback Stack**: `{{font_name}}, {{fallback}}, monospace`

---

### Type Scale

**Base Size**: {{base}}px
**Scale Ratio**: {{ratio}} ({{scale_name}})

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| H1 | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| H2 | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| H3 | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| H4 | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| H5 | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| H6 | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| Body Large | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| Body | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| Body Small | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| Caption | {{px}}px | {{weight}} | {{lh}} | {{ls}} |
| Overline | {{px}}px | {{weight}} | {{lh}} | {{ls}} |

### Typography Guidelines

**Paragraph Spacing**: {{multiplier}}× line height

**Maximum Line Length**: {{characters}} characters (for readability)

**Weight Usage**:
- Regular (400): Body text
- Medium (500): Emphasis, subheads
- Bold (700): Headlines, strong emphasis
- Extra Bold (800): Display, hero text

---

## 4. Imagery

### Photography Style

| Attribute | Direction |
|-----------|-----------|
| **Color Treatment** | {{treatment}} |
| **Lighting** | {{lighting}} |
| **Composition** | {{composition}} |
| **Subject Focus** | {{focus}} |
| **Mood** | {{mood}} |
| **Editing** | {{editing}} |

### Photography Do's

- {{photo_do_1}}
- {{photo_do_2}}
- {{photo_do_3}}
- {{photo_do_4}}

### Photography Don'ts

- {{photo_dont_1}}
- {{photo_dont_2}}
- {{photo_dont_3}}
- {{photo_dont_4}}

---

### Illustration Style

| Attribute | Specification |
|-----------|---------------|
| **Type** | {{type}} |
| **Color Approach** | {{colors}} |
| **Detail Level** | {{detail}} |
| **Character Style** | {{style}} |

---

### Iconography

| Attribute | Specification |
|-----------|---------------|
| **Style** | {{outline/filled/duotone}} |
| **Stroke Weight** | {{px}}px |
| **Corner Radius** | {{px}}px |
| **Grid Size** | {{px}}px |
| **Optical Alignment** | {{guidelines}} |

**Required Icon Categories**:
- Navigation
- Actions
- Status/State
- Social media
- Feature/Product

---

## 5. Visual Elements

### Brand Patterns

**Style**: {{pattern_style}}
**Elements**: {{elements}}
**Colors**: {{color_usage}}

**Usage**:
- {{pattern_usage_1}}
- {{pattern_usage_2}}

---

### Graphic Devices

#### Shapes

**Primary Shape**: {{shape}}
**Usage**: {{usage}}

#### Dividers

**Style**: {{style}}
**Color**: {{color}}
**Weight**: {{weight}}

#### Containers

**Border Radius**: {{px}}px
**Shadow**: {{shadow_spec}}
**Background**: {{background}}

---

### Layout & Spacing

#### Grid System

| Property | Value |
|----------|-------|
| **Columns** | {{number}} |
| **Gutter** | {{px}}px |
| **Margin** | {{px}}px |

#### Spacing Scale

**Base Unit**: {{base}}px

| Token | Value | Usage |
|-------|-------|-------|
| XS | {{px}}px | Tight spacing |
| S | {{px}}px | Related elements |
| M | {{px}}px | Standard spacing |
| L | {{px}}px | Section spacing |
| XL | {{px}}px | Major sections |
| XXL | {{px}}px | Page sections |

---

## 6. Quick Reference

### Brand Colors (Quick Copy)

```
Primary:   #{{hex}}
Secondary: #{{hex}}
Accent:    #{{hex}}
Dark:      #{{hex}}
Light:     #{{hex}}
```

### Font Stack (Quick Copy)

```css
/* Headlines */
font-family: '{{primary_font}}', {{fallbacks}};

/* Body */
font-family: '{{secondary_font}}', {{fallbacks}};

/* Code */
font-family: '{{mono_font}}', monospace;
```

### Minimum Logo Sizes

- Print: {{size}}
- Web: {{px}}px
- Icon: {{px}}px

---

## Handoff Notes

### For Brand Guidelines Workflow
- Include all visual specifications
- Reference this document for visual section

### For Asset Generation Workflow
- Use logo specifications for file creation
- Apply color palette to all assets
- Use typography for text-based assets

---

*Generated by BM-Brand Visual Identity Workflow*
*Part of AI Business Hub Module Pipeline: BMV → BMP → BM-Brand → BM-PM → BME*
