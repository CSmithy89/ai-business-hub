import type { Config } from "tailwindcss";
import rootConfig from "../../tailwind.config";

/**
 * Next.js App Tailwind Configuration
 * Extends root Tailwind config with app-specific content paths
 */

const config: Config = {
  ...rootConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
