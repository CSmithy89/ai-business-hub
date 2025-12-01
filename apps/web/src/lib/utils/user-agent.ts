import { UAParser } from 'ua-parser-js'
import {
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Globe
} from 'lucide-react'

export interface ParsedUserAgent {
  browser: {
    name: string
    version: string
    icon?: any
  }
  os: {
    name: string
    version: string
  }
  device: {
    type: 'desktop' | 'mobile' | 'tablet'
    vendor: string
    model: string
    icon?: any
  }
}

/**
 * Parse user agent string to extract browser, OS, and device information
 *
 * @param userAgent - Browser user agent string
 * @returns Parsed user agent details with icons
 */
export function parseUserAgent(userAgent: string | undefined | null): ParsedUserAgent {
  if (!userAgent) {
    return {
      browser: {
        name: 'Unknown',
        version: '',
        icon: Globe,
      },
      os: {
        name: 'Unknown',
        version: '',
      },
      device: {
        type: 'desktop',
        vendor: '',
        model: '',
        icon: Monitor,
      },
    }
  }

  const parser = new UAParser()
  const result = parser.setUA(userAgent).getResult()

  // Determine device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (result.device.type === 'mobile') {
    deviceType = 'mobile'
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet'
  }

  // Get device icon
  let deviceIcon = Monitor
  if (deviceType === 'mobile') {
    deviceIcon = Smartphone
  } else if (deviceType === 'tablet') {
    deviceIcon = Tablet
  }

  // Get browser icon
  let browserIcon = Globe
  const browserName = result.browser.name?.toLowerCase() || ''
  if (browserName.includes('chrome')) {
    browserIcon = Chrome
  }

  return {
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || '',
      icon: browserIcon,
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || '',
    },
    device: {
      type: deviceType,
      vendor: result.device.vendor || '',
      model: result.device.model || '',
      icon: deviceIcon,
    },
  }
}

/**
 * Format user agent into a readable display string
 *
 * @param userAgent - Browser user agent string
 * @returns Formatted display string (e.g., "Chrome 120 on Windows 11")
 */
export function formatUserAgent(userAgent: string | undefined | null): string {
  const parsed = parseUserAgent(userAgent)

  const browserInfo = parsed.browser.version
    ? `${parsed.browser.name} ${parsed.browser.version}`
    : parsed.browser.name

  const osInfo = parsed.os.version
    ? `${parsed.os.name} ${parsed.os.version}`
    : parsed.os.name

  return `${browserInfo} on ${osInfo}`
}
