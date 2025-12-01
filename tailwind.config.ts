import type { Config } from "tailwindcss";

/**
 * AI Business Hub - Tailwind CSS Configuration
 *
 * Extends Tailwind with custom design tokens for the Hub.
 * Tokens are defined in src/styles/tokens.css as CSS custom properties.
 *
 * @see /docs/design/style-guide.md for design documentation
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
        neutral: {
          0: rgb("--color-neutral-0"),
          50: rgb("--color-neutral-50"),
          100: rgb("--color-neutral-100"),
          200: rgb("--color-neutral-200"),
          300: rgb("--color-neutral-300"),
          400: rgb("--color-neutral-400"),
          500: rgb("--color-neutral-500"),
          600: rgb("--color-neutral-600"),
          700: rgb("--color-neutral-700"),
          800: rgb("--color-neutral-800"),
          900: rgb("--color-neutral-900"),
          950: rgb("--color-neutral-950"),
        },
        success: {
          50: rgb("--color-success-50"),
          500: rgb("--color-success-500"),
          600: rgb("--color-success-600"),
          DEFAULT: rgb("--color-success-500"),
        },
        warning: {
          50: rgb("--color-warning-50"),
          500: rgb("--color-warning-500"),
          600: rgb("--color-warning-600"),
          DEFAULT: rgb("--color-warning-500"),
        },
        error: {
          50: rgb("--color-error-50"),
          500: rgb("--color-error-500"),
          600: rgb("--color-error-600"),
          DEFAULT: rgb("--color-error-500"),
        },
        agent: {
          orchestrator: {
            DEFAULT: rgb("--color-agent-orchestrator"),
            light: rgb("--color-agent-orchestrator-light"),
            dark: rgb("--color-agent-orchestrator-dark"),
          },
          crm: {
            DEFAULT: rgb("--color-agent-crm"),
            light: rgb("--color-agent-crm-light"),
            dark: rgb("--color-agent-crm-dark"),
          },
          pm: {
            DEFAULT: rgb("--color-agent-pm"),
            light: rgb("--color-agent-pm-light"),
            dark: rgb("--color-agent-pm-dark"),
          },
          finance: {
            DEFAULT: rgb("--color-agent-finance"),
            light: rgb("--color-agent-finance-light"),
            dark: rgb("--color-agent-finance-dark"),
          },
          user: rgb("--color-agent-user"),
        },
        background: {
          primary: rgb("--color-bg-primary"),
          secondary: rgb("--color-bg-secondary"),
          tertiary: rgb("--color-bg-tertiary"),
          muted: rgb("--color-bg-muted"),
        },
        foreground: {
          primary: rgb("--color-text-primary"),
          secondary: rgb("--color-text-secondary"),
          muted: rgb("--color-text-muted"),
          inverse: rgb("--color-text-inverse"),
        },
        border: {
          DEFAULT: rgb("--color-border-default"),
          muted: rgb("--color-border-muted"),
          strong: rgb("--color-border-strong"),
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      width: {
        "nav-collapsed": "var(--width-nav-collapsed)",
        "nav-expanded": "var(--width-nav-expanded)",
        "chat-min": "var(--width-chat-min)",
        "data-min": "var(--width-data-min)",
      },
      height: {
        header: "var(--height-header)",
        "status-bar": "var(--height-status-bar)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-default)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        focus: "var(--shadow-focus)",
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        tooltip: "var(--z-tooltip)",
        toast: "var(--z-toast)",
        "command-palette": "var(--z-command-palette)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
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
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in var(--duration-normal) var(--ease-out)",
        "slide-in-right": "slide-in-right var(--duration-slow) var(--ease-out)",
        "scale-in": "scale-in var(--duration-normal) var(--ease-out)",
        "typing-dot-1": "typing-dot 1.4s infinite ease-in-out",
        "typing-dot-2": "typing-dot 1.4s infinite ease-in-out 0.2s",
        "typing-dot-3": "typing-dot 1.4s infinite ease-in-out 0.4s",
      },
      screens: {
        xs: "480px",
        "3xl": "1920px",
      },
    },
  },
  plugins: [],
};

export default config;
