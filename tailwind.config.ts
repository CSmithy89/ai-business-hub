import type { Config } from "tailwindcss";

/**
 * Hyvve - Tailwind CSS Configuration
 *
 * Extends Tailwind with custom design tokens for Hyvve.
 * Tokens are defined in src/styles/tokens.css as CSS custom properties.
 *
 * Brand: Warm, friendly, human - Coral primary, Teal accent, Cream backgrounds
 * @see /docs/design/BRAND-GUIDELINES.md
 * @see /docs/design/STYLE-GUIDE.md
 */

// Helper to reference CSS variables with RGB values
const rgb = (variable: string) => `rgb(var(${variable}))`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Primary - Coral (Hub's Color)
        primary: {
          50: rgb("--color-primary-50"),
          100: rgb("--color-primary-100"),
          200: rgb("--color-primary-200"),
          300: rgb("--color-primary-300"),
          400: rgb("--color-primary-400"),
          500: rgb("--color-primary-500"),
          600: rgb("--color-primary-600"),
          700: rgb("--color-primary-700"),
          800: rgb("--color-primary-800"),
          900: rgb("--color-primary-900"),
          DEFAULT: rgb("--color-primary-500"),
        },
        // Brand Secondary - Teal (Maya's Color)
        accent: {
          50: rgb("--color-accent-50"),
          100: rgb("--color-accent-100"),
          200: rgb("--color-accent-200"),
          300: rgb("--color-accent-300"),
          400: rgb("--color-accent-400"),
          500: rgb("--color-accent-500"),
          600: rgb("--color-accent-600"),
          700: rgb("--color-accent-700"),
          800: rgb("--color-accent-800"),
          900: rgb("--color-accent-900"),
          DEFAULT: rgb("--color-accent-500"),
        },
        // Direct brand color aliases
        coral: {
          50: rgb("--color-primary-50"),
          100: rgb("--color-primary-100"),
          500: rgb("--color-primary-500"),
          600: rgb("--color-primary-600"),
          700: rgb("--color-primary-700"),
          DEFAULT: rgb("--color-primary-500"),
        },
        teal: {
          50: rgb("--color-accent-50"),
          500: rgb("--color-accent-500"),
          600: rgb("--color-accent-600"),
          DEFAULT: rgb("--color-accent-500"),
        },
        // Slate scale for text
        slate: {
          50: rgb("--color-slate-50"),
          100: rgb("--color-slate-100"),
          200: rgb("--color-slate-200"),
          300: rgb("--color-slate-300"),
          400: rgb("--color-slate-400"),
          500: rgb("--color-slate-500"),
          600: rgb("--color-slate-600"),
          700: rgb("--color-slate-700"),
          800: rgb("--color-slate-800"),
          900: rgb("--color-slate-900"),
          950: rgb("--color-slate-950"),
        },
        // Semantic colors
        success: {
          50: rgb("--color-success-50"),
          100: rgb("--color-success-100"),
          200: rgb("--color-success-200"),
          300: rgb("--color-success-300"),
          400: rgb("--color-success-400"),
          500: rgb("--color-success-500"),
          600: rgb("--color-success-600"),
          700: rgb("--color-success-700"),
          DEFAULT: rgb("--color-success-500"),
        },
        warning: {
          50: rgb("--color-warning-50"),
          100: rgb("--color-warning-100"),
          200: rgb("--color-warning-200"),
          300: rgb("--color-warning-300"),
          400: rgb("--color-warning-400"),
          500: rgb("--color-warning-500"),
          600: rgb("--color-warning-600"),
          700: rgb("--color-warning-700"),
          DEFAULT: rgb("--color-warning-500"),
        },
        error: {
          50: rgb("--color-error-50"),
          100: rgb("--color-error-100"),
          200: rgb("--color-error-200"),
          300: rgb("--color-error-300"),
          400: rgb("--color-error-400"),
          500: rgb("--color-error-500"),
          600: rgb("--color-error-600"),
          700: rgb("--color-error-700"),
          DEFAULT: rgb("--color-error-500"),
        },
        info: {
          50: rgb("--color-info-50"),
          100: rgb("--color-info-100"),
          200: rgb("--color-info-200"),
          300: rgb("--color-info-300"),
          400: rgb("--color-info-400"),
          500: rgb("--color-info-500"),
          600: rgb("--color-info-600"),
          700: rgb("--color-info-700"),
          DEFAULT: rgb("--color-info-500"),
        },
        // AI Team Character Colors
        agent: {
          hub: {
            DEFAULT: rgb("--color-agent-hub"),
            light: rgb("--color-agent-hub-light"),
            dark: rgb("--color-agent-hub-dark"),
          },
          maya: {
            DEFAULT: rgb("--color-agent-maya"),
            light: rgb("--color-agent-maya-light"),
            dark: rgb("--color-agent-maya-dark"),
          },
          atlas: {
            DEFAULT: rgb("--color-agent-atlas"),
            light: rgb("--color-agent-atlas-light"),
            dark: rgb("--color-agent-atlas-dark"),
          },
          sage: {
            DEFAULT: rgb("--color-agent-sage"),
            light: rgb("--color-agent-sage-light"),
            dark: rgb("--color-agent-sage-dark"),
          },
          nova: {
            DEFAULT: rgb("--color-agent-nova"),
            light: rgb("--color-agent-nova-light"),
            dark: rgb("--color-agent-nova-dark"),
          },
          echo: {
            DEFAULT: rgb("--color-agent-echo"),
            light: rgb("--color-agent-echo-light"),
            dark: rgb("--color-agent-echo-dark"),
          },
          user: rgb("--color-agent-user"),
        },
        // Background colors - Warm cream theme
        background: {
          cream: rgb("--color-bg-cream"),
          white: rgb("--color-bg-white"),
          soft: rgb("--color-bg-soft"),
          muted: rgb("--color-bg-muted"),
          hover: rgb("--color-bg-hover"),
          primary: rgb("--color-bg-primary"),
          secondary: rgb("--color-bg-secondary"),
          tertiary: rgb("--color-bg-tertiary"),
        },
        // Text colors
        foreground: {
          primary: rgb("--color-text-primary"),
          secondary: rgb("--color-text-secondary"),
          muted: rgb("--color-text-muted"),
          disabled: rgb("--color-text-disabled"),
          inverse: rgb("--color-text-inverse"),
        },
        // Border colors with warm undertones
        border: {
          DEFAULT: rgb("--color-border-default"),
          subtle: rgb("--color-border-subtle"),
          strong: rgb("--color-border-strong"),
          focus: rgb("--color-border-focus"),
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
      },
      width: {
        "nav-collapsed": "var(--width-nav-collapsed)",
        "nav-expanded": "var(--width-nav-expanded)",
        "nav-max": "var(--width-nav-max)",
        "chat-min": "var(--width-chat-min)",
        "data-min": "var(--width-data-min)",
        "detail-default": "var(--width-detail-default)",
        "detail-max": "var(--width-detail-max)",
      },
      height: {
        header: "var(--height-header)",
        "status-bar": "var(--height-status-bar)",
      },
      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-default)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        inner: "var(--shadow-inner)",
        focus: "var(--shadow-focus)",
        primary: "var(--shadow-primary)",
        accent: "var(--shadow-accent)",
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        "modal-backdrop": "var(--z-modal-backdrop)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
        "command-palette": "var(--z-command-palette)",
      },
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
        slower: "var(--duration-slower)",
        character: "var(--duration-character)",
      },
      transitionTimingFunction: {
        linear: "var(--ease-linear)",
        in: "var(--ease-in)",
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        bounce: "var(--ease-bounce)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "character-thinking": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "character-celebrate": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "character-wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(20deg)" },
          "75%": { transform: "rotate(-10deg)" },
        },
        "logo-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "hover-lift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-normal) var(--ease-out)",
        "slide-up": "slide-up var(--duration-slow) var(--ease-out)",
        "slide-in-right": "slide-in-right var(--duration-slower) var(--ease-out)",
        "scale-in": "scale-in var(--duration-normal) var(--ease-out)",
        "typing-dot-1": "typing-dot 1.4s infinite ease-in-out",
        "typing-dot-2": "typing-dot 1.4s infinite ease-in-out 0.2s",
        "typing-dot-3": "typing-dot 1.4s infinite ease-in-out 0.4s",
        "character-thinking": "character-thinking 1s ease-in-out infinite",
        "character-celebrate": "character-celebrate 500ms ease-out",
        "character-wave": "character-wave 600ms ease-in-out",
        "logo-pulse": "logo-pulse 1.5s ease-in-out infinite",
      },
      screens: {
        xs: "480px",
        "3xl": "1920px",
      },
      backgroundImage: {
        "gradient-hero": "var(--gradient-hero)",
        "gradient-brand": "var(--gradient-brand)",
        "gradient-hub": "var(--gradient-hub)",
        "gradient-maya": "var(--gradient-maya)",
        "gradient-atlas": "var(--gradient-atlas)",
        "gradient-sage": "var(--gradient-sage)",
        "gradient-nova": "var(--gradient-nova)",
        "gradient-echo": "var(--gradient-echo)",
        "gradient-overlay": "var(--gradient-overlay)",
      },
    },
  },
  plugins: [],
};

export default config;
