# Visual Identity Development Workflow Instructions

<critical>Visual direction must derive from archetype - colors and styles have psychological associations</critical>
<critical>All color specifications must include HEX, RGB, CMYK, and Pantone codes</critical>
<critical>File format specifications must follow industry standards</critical>

## Purpose

This workflow develops the visual identity system for the brand. It defines HOW the brand looks through logo specifications, color palettes, typography, and imagery guidelines. This provides the foundation for all visual brand assets.

<workflow>

<step n="1" goal="Analyze Brand Strategy">
<action>Load outputs from brand-strategy workflow</action>
<action>Map archetype to visual characteristics</action>

<extract_data>
From brand-strategy outputs:
- Primary and secondary archetype
- Target personas and preferences
- Positioning statement
- Competitive visual landscape
- Brand voice attributes (for visual/verbal alignment)
</extract_data>

<archetype_visual_mapping>
Each archetype has visual associations:

| Archetype | Colors | Typography | Imagery | Style |
|-----------|--------|------------|---------|-------|
| Innocent | Pastels, white, light blue | Clean, simple sans-serif | Natural, wholesome | Clean, minimal |
| Sage | Navy, gray, gold | Serif, traditional | Educational, scholarly | Classic, refined |
| Explorer | Earth tones, green, blue | Bold, adventurous | Outdoor, expansive | Rugged, natural |
| Ruler | Black, gold, purple, navy | Elegant serif | Luxurious, refined | Premium, prestigious |
| Creator | Vibrant, unconventional | Unique, creative | Artistic, innovative | Original, expressive |
| Caregiver | Warm colors, soft tones | Friendly, rounded | People, nurturing | Warm, approachable |
| Magician | Purple, deep blue, silver | Mystical, unique | Transformative, ethereal | Magical, otherworldly |
| Hero | Red, blue, black | Strong, bold | Action, achievement | Dynamic, powerful |
| Rebel | Black, red, stark contrasts | Edgy, unconventional | Provocative, raw | Bold, disruptive |
| Lover | Red, pink, warm tones | Elegant, sensual | Intimate, beautiful | Romantic, luxurious |
| Jester | Bright, playful colors | Fun, quirky | Humorous, entertaining | Playful, energetic |
| Regular Guy | Down-to-earth colors | Simple, readable | Everyday, relatable | Honest, practical |
</archetype_visual_mapping>
</step>

<step n="2" goal="Design Logo System">
<action>Define logo type and structure</action>
<action>Specify all required variations</action>
<action>Establish usage rules</action>

<logo_type_selection>
Recommend logo type based on brand needs:

| Type | Best For | Examples |
|------|----------|----------|
| Wordmark | Name recognition, unique name | Google, Coca-Cola |
| Lettermark | Long names, acronyms | IBM, HBO, NASA |
| Brandmark | Visual simplicity, global reach | Apple, Nike, Twitter |
| Combination | Flexibility, new brands | Adidas, Burger King |
| Emblem | Heritage, institutions | Starbucks, Harley-Davidson |

**Recommendation**: {{type}} because {{rationale}}
</logo_type_selection>

<logo_variations>
## Required Logo Variations

| Variation | Use Case | Requirements |
|-----------|----------|--------------|
| Primary | Default usage | Full color, horizontal |
| Secondary | Compact spaces | Simplified version |
| Icon/Mark | Small applications | Symbol only |
| Horizontal | Wide spaces | Horizontal lockup |
| Vertical | Narrow spaces | Stacked lockup |
| Single-color | Printing limitations | Black or white |
| Reversed | Dark backgrounds | White/light version |

## Clear Space Rules
- Minimum clear space: {{multiplier}}x logo height
- Protected area where no other elements may appear

## Minimum Size
- Print: {{inches}} inches / {{mm}}mm height minimum
- Digital: {{pixels}}px height minimum
- Favicon: {{pixels}}px × {{pixels}}px
</logo_variations>

<logo_dont>
## Logo Don'ts
- Don't stretch or distort
- Don't rotate
- Don't change colors
- Don't add effects (shadows, gradients)
- Don't place on busy backgrounds
- Don't crop any part
- Don't rearrange elements
- Don't use unapproved variations
</logo_dont>

<output>
Generate logo-specifications.md with:
- Logo type recommendation
- All required variations
- Clear space rules
- Minimum sizes
- Don'ts with visual examples
- File format requirements
</output>
</step>

<step n="3" goal="Develop Color Palette">
<action>Select primary brand colors</action>
<action>Build extended palette</action>
<action>Define usage ratios</action>

<color_selection>
Base color selection on:
1. Archetype associations
2. Industry conventions
3. Competitor differentiation
4. Accessibility requirements
5. User preferences (if provided)
</color_selection>

<color_specifications>
## Primary Palette (2-3 colors)

### Primary Brand Color
| Format | Value |
|--------|-------|
| Name | {{color_name}} |
| HEX | #{{hex}} |
| RGB | {{r}}, {{g}}, {{b}} |
| CMYK | {{c}}, {{m}}, {{y}}, {{k}} |
| Pantone | PMS {{number}} |
| HSL | {{h}}°, {{s}}%, {{l}}% |

**Usage**: {{primary_usage}}

### Secondary Brand Color
| Format | Value |
|--------|-------|
| Name | {{color_name}} |
| HEX | #{{hex}} |
| RGB | {{r}}, {{g}}, {{b}} |
| CMYK | {{c}}, {{m}}, {{y}}, {{k}} |
| Pantone | PMS {{number}} |

**Usage**: {{secondary_usage}}

### Accent Color
| Format | Value |
|--------|-------|
| Name | {{color_name}} |
| HEX | #{{hex}} |
| RGB | {{r}}, {{g}}, {{b}} |
| CMYK | {{c}}, {{m}}, {{y}}, {{k}} |
| Pantone | PMS {{number}} |

**Usage**: {{accent_usage}}

## Extended Palette

### Neutral Colors
- White: #FFFFFF
- Light Gray: #{{hex}}
- Medium Gray: #{{hex}}
- Dark Gray: #{{hex}}
- Black: #{{hex}}

### Semantic Colors
- Success: #{{hex}}
- Warning: #{{hex}}
- Error: #{{hex}}
- Info: #{{hex}}

### Tints & Shades
For each primary color, provide:
- 10% tint
- 25% tint
- 50% tint
- 75% shade
- 90% shade
</color_specifications>

<color_usage>
## Color Ratios (60-30-10 Rule)
- Primary: 60% of visual presence
- Secondary: 30% of visual presence
- Accent: 10% of visual presence

## Accessibility
- Ensure WCAG AA contrast ratios (4.5:1 for text)
- Test color combinations for colorblind users
- Provide accessible alternatives
</color_usage>

<output>
Generate color-palette.md with:
- Complete color specifications
- Usage guidelines
- Accessibility notes
- Color combination rules
</output>
</step>

<step n="4" goal="Select Typography System">
<action>Choose font families</action>
<action>Define type hierarchy</action>
<action>Specify usage rules</action>

<typography_selection>
## Font Selection Criteria

Consider:
1. Archetype alignment (personality match)
2. Legibility (print and screen)
3. Versatility (weights and styles)
4. Licensing (web, app, print)
5. Accessibility (x-height, letter spacing)
6. Brand differentiation
</typography_selection>

<type_system>
## Primary Font (Headlines)
**Font Family**: {{font_name}}
**Weights**: {{weights}}
**Use For**: Headlines, titles, hero text
**Fallback Stack**: {{fallbacks}}
**Source**: {{google_fonts/adobe/licensed}}

## Secondary Font (Body)
**Font Family**: {{font_name}}
**Weights**: {{weights}}
**Use For**: Body copy, paragraphs
**Fallback Stack**: {{fallbacks}}
**Source**: {{source}}

## Accent Font (Optional)
**Font Family**: {{font_name}}
**Use For**: Pull quotes, callouts
**Fallback Stack**: {{fallbacks}}

## Monospace Font (If needed)
**Font Family**: {{font_name}}
**Use For**: Code, data, technical content
**Fallback Stack**: {{fallbacks}}

## Type Scale
Based on {{ratio}} ratio (e.g., 1.25 Major Third)

| Level | Size (px) | Weight | Line Height | Letter Spacing |
|-------|-----------|--------|-------------|----------------|
| H1 | {{px}} | {{weight}} | {{lh}} | {{ls}} |
| H2 | {{px}} | {{weight}} | {{lh}} | {{ls}} |
| H3 | {{px}} | {{weight}} | {{lh}} | {{ls}} |
| H4 | {{px}} | {{weight}} | {{lh}} | {{ls}} |
| Body | {{px}} | {{weight}} | {{lh}} | {{ls}} |
| Small | {{px}} | {{weight}} | {{lh}} | {{ls}} |
| Caption | {{px}} | {{weight}} | {{lh}} | {{ls}} |
</type_system>

<output>
Generate typography-guide.md with:
- Font selections with rationale
- Complete type scale
- Usage guidelines
- Pairing rules
- Web implementation notes
</output>
</step>

<step n="5" goal="Define Imagery Direction">
<action>Establish photography style</action>
<action>Define illustration approach</action>
<action>Create iconography guidelines</action>

<photography_direction>
## Photography Style

**Color Treatment**: {{warm/cool/natural/muted/vibrant}}
**Lighting**: {{natural/studio/dramatic/soft}}
**Composition**: {{centered/rule-of-thirds/dynamic}}
**Subject Focus**: {{people/product/lifestyle/abstract}}
**Mood**: {{professional/casual/energetic/calm}}
**Filters/Effects**: {{none/subtle/signature}}

### Do's
- {{photo_do_1}}
- {{photo_do_2}}
- {{photo_do_3}}

### Don'ts
- {{photo_dont_1}}
- {{photo_dont_2}}
- {{photo_dont_3}}
</photography_direction>

<illustration_style>
## Illustration Style (if applicable)

**Type**: {{flat/3D/hand-drawn/line-art/isometric}}
**Color**: {{brand_colors/extended/custom}}
**Detail Level**: {{minimal/moderate/detailed}}
**Character Style**: {{geometric/organic/realistic}}

### Guidelines
- {{illustration_guideline_1}}
- {{illustration_guideline_2}}
</illustration_style>

<iconography>
## Iconography

**Style**: {{outline/filled/duotone/glyph}}
**Stroke Weight**: {{px}}px
**Corner Radius**: {{px}}px / {{percentage}}%
**Grid System**: {{px}}px base
**Optical Sizing**: {{guidelines}}

### Icon Set Requirements
- Navigation icons
- Action icons
- Status icons
- Social media icons
- Feature icons
</iconography>

<output>
Generate imagery-guidelines.md with:
- Photography direction
- Illustration style (if applicable)
- Iconography specifications
- Example images (descriptions)
</output>
</step>

<step n="6" goal="Create Visual Elements">
<action>Define brand patterns</action>
<action>Create graphic devices</action>
<action>Establish layout principles</action>

<visual_elements>
## Brand Patterns

**Pattern Style**: {{geometric/organic/abstract}}
**Elements Used**: {{from_logo/custom_shapes}}
**Color Application**: {{primary/secondary/monochrome}}
**Usage**: {{backgrounds/accents/texture}}

## Graphic Devices

### Shapes
- Primary shape: {{shape}}
- Usage: {{how_to_use}}

### Dividers
- Style: {{solid/dashed/custom}}
- Color: {{specification}}

### Containers
- Border radius: {{px}}
- Shadow: {{specification}}
- Background: {{specification}}

## Layout Principles

### Grid System
- Columns: {{number}}
- Gutter: {{px}}
- Margin: {{px}}

### Spacing Scale
Based on {{base}}px base unit:
- XS: {{px}}
- S: {{px}}
- M: {{px}}
- L: {{px}}
- XL: {{px}}
- XXL: {{px}}
</visual_elements>

<output>
Generate visual-elements.md with:
- Pattern specifications
- Graphic devices
- Layout principles
- Spacing system
</output>
</step>

<step n="7" goal="Validate Visual Identity">
<action>Check consistency across elements</action>
<action>Verify accessibility compliance</action>
<action>Compile visual identity guide</action>

<consistency_check>
- [ ] Colors align with archetype
- [ ] Typography supports brand voice
- [ ] Imagery reinforces positioning
- [ ] All elements work together harmoniously
- [ ] System is flexible for various applications
- [ ] Accessibility requirements met
</consistency_check>

<compile_document>
Generate visual-identity-guide.md combining:
1. Visual identity overview
2. Logo system
3. Color palette
4. Typography system
5. Imagery direction
6. Visual elements
7. Quick reference
8. File format specifications
</compile_document>
</step>

</workflow>

## Anti-Hallucination Protocol

- Visual direction must derive from archetype
- Color codes must be accurate and convertible
- Typography must be available and licensed
- File specifications must follow industry standards
- Do not invent specific logo designs (provide specifications only)
