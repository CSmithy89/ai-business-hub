/**
 * Appearance Settings Component
 *
 * Allows users to customize theme, sidebar density, and font size.
 * Includes a live preview panel to show changes in real-time.
 *
 * Story 15.26: Implement Appearance Settings Page
 */

'use client';

import { Sun, Moon, Monitor, LayoutGrid, Minimize2, Type, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useAppearance,
  FONT_SIZE_VALUES,
  type SidebarDensity,
  type FontSize,
} from '@/hooks/use-appearance';

/**
 * Theme option card
 */
function ThemeOption({
  label,
  description,
  icon: Icon,
  isSelected,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} theme: ${description}${isSelected ? ' (selected)' : ''}`}
      aria-pressed={isSelected}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all',
        'hover:border-[rgb(var(--color-primary-400))] hover:bg-[rgb(var(--color-bg-secondary))]',
        isSelected
          ? 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-50))]'
          : 'border-[rgb(var(--color-border-default))]'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--color-primary-500))]">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-lg',
          isSelected
            ? 'bg-[rgb(var(--color-primary-500))] text-white'
            : 'bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text-secondary))]'
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className="font-medium text-[rgb(var(--color-text-primary))]">{label}</p>
        <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{description}</p>
      </div>
    </button>
  );
}

/**
 * Density option button
 */
function DensityOption({
  label,
  icon: Icon,
  isSelected,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} sidebar density${isSelected ? ' (selected)' : ''}`}
      aria-pressed={isSelected}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 transition-all',
        'hover:border-[rgb(var(--color-primary-400))]',
        isSelected
          ? 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-50))]'
          : 'border-[rgb(var(--color-border-default))]'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5',
          isSelected
            ? 'text-[rgb(var(--color-primary-500))]'
            : 'text-[rgb(var(--color-text-secondary))]'
        )}
      />
      <span
        className={cn(
          'font-medium',
          isSelected
            ? 'text-[rgb(var(--color-primary-600))]'
            : 'text-[rgb(var(--color-text-primary))]'
        )}
      >
        {label}
      </span>
      {isSelected && (
        <Check className="ml-auto h-4 w-4 text-[rgb(var(--color-primary-500))]" />
      )}
    </button>
  );
}

/**
 * Font size slider option
 */
function FontSizeOption({
  label,
  pixels,
  isSelected,
  onClick,
}: {
  label: string;
  pixels: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} font size (${pixels}px)${isSelected ? ' (selected)' : ''}`}
      aria-pressed={isSelected}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border px-6 py-4 transition-all',
        'hover:border-[rgb(var(--color-primary-400))]',
        isSelected
          ? 'border-[rgb(var(--color-primary-500))] bg-[rgb(var(--color-primary-50))]'
          : 'border-[rgb(var(--color-border-default))]'
      )}
    >
      <span
        className={cn(
          'font-medium',
          isSelected
            ? 'text-[rgb(var(--color-primary-600))]'
            : 'text-[rgb(var(--color-text-primary))]'
        )}
        style={{ fontSize: `${pixels}px` }}
      >
        Aa
      </span>
      <span className="text-xs text-[rgb(var(--color-text-tertiary))]">
        {label} ({pixels}px)
      </span>
      {isSelected && (
        <Check className="h-4 w-4 text-[rgb(var(--color-primary-500))]" />
      )}
    </button>
  );
}

/**
 * Preview panel showing current appearance settings
 */
function AppearancePreview({
  theme,
  density,
  fontSize,
}: {
  theme: string;
  density: SidebarDensity;
  fontSize: FontSize;
}) {
  const isDark = theme === 'dark';
  const isCompact = density === 'compact';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Preview</CardTitle>
        <CardDescription>See how your changes look</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'rounded-lg border overflow-hidden',
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-background-cream border-gray-200'
          )}
        >
          {/* Mini header */}
          <div
            className={cn(
              'flex items-center justify-between px-3 py-2 border-b',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded',
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                )}
              />
              <div
                className={cn(
                  'h-3 w-16 rounded',
                  isDark ? 'bg-gray-600' : 'bg-gray-300'
                )}
              />
            </div>
            <div className="flex gap-1">
              <div
                className={cn(
                  'w-5 h-5 rounded',
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                )}
              />
              <div
                className={cn(
                  'w-5 h-5 rounded',
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                )}
              />
            </div>
          </div>

          <div className="flex">
            {/* Mini sidebar */}
            <div
              className={cn(
                'border-r flex flex-col gap-1',
                isCompact ? 'w-10 p-1' : 'w-14 p-2',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              )}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded',
                    isCompact ? 'h-6 w-full' : 'h-8 w-full',
                    i === 1
                      ? 'bg-primary'
                      : isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  )}
                />
              ))}
            </div>

            {/* Mini content area */}
            <div className="flex-1 p-3">
              <div
                className={cn(
                  'rounded h-4 mb-2',
                  isDark ? 'bg-gray-700' : 'bg-gray-300'
                )}
                style={{ width: '60%' }}
              />
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded h-2',
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    )}
                    style={{ width: `${100 - i * 10}%` }}
                  />
                ))}
              </div>

              {/* Mini card */}
              <div
                className={cn(
                  'mt-3 rounded-lg border p-2',
                  isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                )}
              >
                <div
                  className={cn(
                    'rounded h-2 mb-1',
                    isDark ? 'bg-gray-600' : 'bg-gray-300'
                  )}
                  style={{ width: '50%' }}
                />
                <div
                  className={cn(
                    'rounded h-2',
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  )}
                  style={{ width: '80%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current settings summary */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--color-bg-tertiary))] px-3 py-1 text-xs">
            {isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
            {theme === 'system' ? 'System' : isDark ? 'Dark' : 'Light'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--color-bg-tertiary))] px-3 py-1 text-xs">
            {isCompact ? <Minimize2 className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
            {isCompact ? 'Compact' : 'Comfortable'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--color-bg-tertiary))] px-3 py-1 text-xs">
            <Type className="h-3 w-3" />
            {FONT_SIZE_VALUES[fontSize]}px
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Appearance Settings Component
 */
export function AppearanceSettings() {
  const {
    theme,
    setTheme,
    resolvedTheme,
    sidebarDensity,
    setSidebarDensity,
    fontSize,
    setFontSize,
    mounted,
    resetToDefaults,
  } = useAppearance();

  // Use resolved theme for preview (handles 'system' case)
  const previewTheme = resolvedTheme || 'light';

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how HYVVE looks to you. Select a single theme or sync with your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption
              label="Light"
              description="Warm coral theme"
              icon={Sun}
              isSelected={mounted && theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <ThemeOption
              label="Dark"
              description="Easy on the eyes"
              icon={Moon}
              isSelected={mounted && theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeOption
              label="System"
              description="Follow OS preference"
              icon={Monitor}
              isSelected={mounted && theme === 'system'}
              onClick={() => setTheme('system')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Density */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar Density</CardTitle>
          <CardDescription>
            Control the spacing and size of navigation elements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <DensityOption
              label="Comfortable"
              icon={LayoutGrid}
              isSelected={sidebarDensity === 'comfortable'}
              onClick={() => setSidebarDensity('comfortable')}
            />
            <DensityOption
              label="Compact"
              icon={Minimize2}
              isSelected={sidebarDensity === 'compact'}
              onClick={() => setSidebarDensity('compact')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>
            Adjust the base font size for better readability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <FontSizeOption
              label="Small"
              pixels={14}
              isSelected={fontSize === 'small'}
              onClick={() => setFontSize('small')}
            />
            <FontSizeOption
              label="Medium"
              pixels={16}
              isSelected={fontSize === 'medium'}
              onClick={() => setFontSize('medium')}
            />
            <FontSizeOption
              label="Large"
              pixels={18}
              isSelected={fontSize === 'large'}
              onClick={() => setFontSize('large')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Accent Color (Coming Soon) */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Customize your primary accent color.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-primary-500))] ring-2 ring-offset-2 ring-[rgb(var(--color-primary-500))]">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-[rgb(var(--color-text-primary))]">
                Coral (Brand Color)
              </p>
              <p className="text-sm text-[rgb(var(--color-text-tertiary))]">
                More colors coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <AppearancePreview
        theme={previewTheme}
        density={sidebarDensity}
        fontSize={fontSize}
      />

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
