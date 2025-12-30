/**
 * Generative Layout Components
 *
 * React components for rendering dynamic layouts composed by AI agents.
 * Uses Framer Motion for smooth transitions between layouts.
 *
 * Components:
 * - GenerativeLayoutRenderer: Main dispatcher that selects layout component
 * - SingleLayout: Full-width single widget
 * - SplitLayout: Side-by-side comparison
 * - WizardLayout: Multi-step flow with progress
 * - GridLayout: Dashboard-style grid
 * - SlotRenderer: Renders individual slots using widget registry
 *
 * @see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.3
 * Epic: DM-06 | Story: DM-06.3
 */
'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type {
  GenerativeLayout,
  LayoutSlot,
  SplitLayoutConfig,
  WizardLayoutConfig,
  GridLayoutConfig,
  WidgetComponent,
  WidgetRegistry,
} from '@/lib/generative-ui/layout-types';

// =============================================================================
// WIDGET REGISTRY
// =============================================================================

/**
 * Global widget registry mapping widget names to React components.
 * Widgets must be registered before they can be used in layouts.
 */
const WIDGET_REGISTRY: WidgetRegistry = {};

/**
 * Register a widget component with the registry.
 *
 * @param name - Widget type name (e.g., "TaskCard", "Metrics")
 * @param component - React component to render for this widget type
 *
 * @example
 * ```typescript
 * registerWidget('TaskCard', TaskCardWidget);
 * registerWidget('Metrics', MetricsWidget);
 * ```
 */
export function registerWidget<T = Record<string, unknown>>(
  name: string,
  component: WidgetComponent<T>
): void {
  WIDGET_REGISTRY[name] = component as WidgetComponent;
}

/**
 * Get a widget component from the registry.
 *
 * @param name - Widget type name
 * @returns Widget component or undefined if not found
 */
export function getWidget(name: string): WidgetComponent | undefined {
  return WIDGET_REGISTRY[name];
}

/**
 * Get all registered widget names.
 */
export function getRegisteredWidgets(): string[] {
  return Object.keys(WIDGET_REGISTRY);
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const layoutVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const slotVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
  }),
};

// =============================================================================
// SLOT RENDERER
// =============================================================================

interface SlotRendererProps {
  slot: LayoutSlot;
  className?: string;
}

/**
 * Renders a single slot using the widget registry.
 * Shows a fallback for unknown widget types.
 */
export function SlotRenderer({ slot, className }: SlotRendererProps) {
  const Widget = WIDGET_REGISTRY[slot.widget];

  if (!Widget) {
    return (
      <Card className={cn('border-dashed border-destructive/50', className)}>
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Unknown widget: {slot.widget}
            </p>
            <p className="text-sm text-muted-foreground">
              This widget type is not registered in the widget registry.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={slotVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Widget data={slot.data} title={slot.title} slotId={slot.id} />
    </motion.div>
  );
}

// =============================================================================
// SINGLE LAYOUT
// =============================================================================

interface SingleLayoutProps {
  layout: GenerativeLayout;
  className?: string;
}

/**
 * Single-widget layout component.
 * Renders one slot at full width.
 */
export function SingleLayout({ layout, className }: SingleLayoutProps) {
  const slot = layout.slots[0];

  if (!slot) {
    return (
      <div className={cn('text-center text-muted-foreground', className)}>
        No widget to display
      </div>
    );
  }

  return (
    <div
      className={cn('w-full', className)}
      data-testid="single-layout"
      role="region"
      aria-label={layout.metadata?.title || 'Single widget layout'}
    >
      <SlotRenderer slot={slot} className="w-full" />
    </div>
  );
}

// =============================================================================
// SPLIT LAYOUT
// =============================================================================

interface SplitLayoutProps {
  layout: GenerativeLayout;
  className?: string;
}

/**
 * Split layout component.
 * Renders two slots side-by-side (horizontal) or stacked (vertical).
 */
export function SplitLayout({ layout, className }: SplitLayoutProps) {
  const config = layout.config as SplitLayoutConfig;
  const [leftSlot, rightSlot] = layout.slots;
  const rawRatio = config.ratio || [1, 1];
  // Guard against division by zero - fall back to equal split
  const totalRatio = rawRatio[0] + rawRatio[1];
  const ratio = totalRatio > 0 ? rawRatio : [1, 1];
  const safeTotal = totalRatio > 0 ? totalRatio : 2;

  if (!leftSlot || !rightSlot) {
    return (
      <div className={cn('text-center text-muted-foreground', className)}>
        Split layout requires two widgets
      </div>
    );
  }

  const isVertical = config.direction === 'vertical';
  const leftWidth = (ratio[0] / safeTotal) * 100;
  const rightWidth = (ratio[1] / safeTotal) * 100;

  return (
    <div
      className={cn(
        'w-full',
        isVertical ? 'flex flex-col gap-4' : 'flex gap-4',
        className
      )}
      data-testid="split-layout"
      role="region"
      aria-label={layout.metadata?.title || 'Split comparison layout'}
    >
      <div
        className="flex-shrink-0"
        style={{ width: isVertical ? '100%' : `${leftWidth}%` }}
      >
        {leftSlot.title && (
          <h4 className="mb-2 font-medium text-muted-foreground">
            {leftSlot.title}
          </h4>
        )}
        <SlotRenderer slot={leftSlot} />
      </div>
      <div
        className="flex-shrink-0"
        style={{ width: isVertical ? '100%' : `${rightWidth}%` }}
      >
        {rightSlot.title && (
          <h4 className="mb-2 font-medium text-muted-foreground">
            {rightSlot.title}
          </h4>
        )}
        <SlotRenderer slot={rightSlot} />
      </div>
    </div>
  );
}

// =============================================================================
// WIZARD LAYOUT
// =============================================================================

interface WizardLayoutProps {
  layout: GenerativeLayout;
  className?: string;
  onStepChange?: (step: number) => void;
}

/**
 * Wizard layout component.
 * Renders a multi-step flow with progress indicator and navigation.
 */
export function WizardLayout({
  layout,
  className,
  onStepChange,
}: WizardLayoutProps) {
  const config = layout.config as WizardLayoutConfig;
  const [currentStep, setCurrentStep] = useState(config.currentStep || 0);
  const [direction, setDirection] = useState(0);

  // Guard against division by zero and out-of-range steps
  const rawTotalSteps = config.totalSteps || layout.slots.length;
  const totalSteps = Math.max(1, Math.min(rawTotalSteps, layout.slots.length || 1));
  const showProgress = config.showProgress !== false;
  const allowSkip = config.allowSkip || false;

  const safeCurrentStep =
    layout.slots.length > 0
      ? Math.min(currentStep, layout.slots.length - 1)
      : 0;
  const currentSlot = layout.slots[safeCurrentStep];
  const progressPercent = ((safeCurrentStep + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((prev) => {
        const next = prev + 1;
        onStepChange?.(next);
        return next;
      });
    }
  }, [currentStep, totalSteps, onStepChange]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => {
        const next = prev - 1;
        onStepChange?.(next);
        return next;
      });
    }
  }, [currentStep, onStepChange]);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  return (
    <div
      className={cn('w-full', className)}
      data-testid="wizard-layout"
      role="region"
      aria-label={layout.metadata?.title || 'Wizard layout'}
    >
      {/* Progress indicator */}
      <div className="mb-6">
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Step {safeCurrentStep + 1} of {totalSteps}
              </span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </div>

      {/* Step title */}
      {currentSlot?.title && (
        <h4 className="mb-4 text-base font-medium">{currentSlot.title}</h4>
      )}

      {/* Step content with animations */}
      <div className="min-h-[200px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentSlot && (
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <SlotRenderer slot={currentSlot} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {allowSkip && currentStep < totalSteps - 1 && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={currentStep === totalSteps - 1}
            className="gap-2"
          >
            {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
            {currentStep < totalSteps - 1 && (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// GRID LAYOUT
// =============================================================================

interface GridLayoutProps {
  layout: GenerativeLayout;
  className?: string;
}

/**
 * Grid layout component.
 * Renders multiple widgets in a responsive grid.
 */
export function GridLayout({ layout, className }: GridLayoutProps) {
  const config = layout.config as GridLayoutConfig;
  const columns = config.columns || 2;
  const gap = config.gap || 4;
  const minItemWidth = config.minItemWidth || 200;

  // Build responsive grid classes based on columns
  const getGridColsClass = (cols: number): string => {
    switch (cols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getGapClass = (gapValue: number): string => {
    const gapMap: Record<number, string> = {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
    };
    return gapMap[gapValue] || 'gap-4';
  };

  return (
    <div
      className={cn('w-full', className)}
      data-testid="grid-layout"
      role="region"
      aria-label={layout.metadata?.title || 'Grid layout'}
    >
      <div
        className={cn('grid', getGridColsClass(columns), getGapClass(gap))}
        style={{ minWidth: minItemWidth }}
      >
        {layout.slots.map((slot, index) => (
          <motion.div
            key={slot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {slot.title && (
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                {slot.title}
              </h4>
            )}
            <SlotRenderer slot={slot} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// GENERATIVE LAYOUT RENDERER
// =============================================================================

interface GenerativeLayoutRendererProps {
  layout: GenerativeLayout;
  className?: string;
  onSlotClick?: (slotId: string) => void;
}

/**
 * Main layout renderer component.
 * Dispatches to the appropriate layout component based on layout type.
 * Uses AnimatePresence for smooth transitions between layouts.
 */
export function GenerativeLayoutRenderer({
  layout,
  className,
  // Reserved for future slot click handling
  onSlotClick: _onSlotClick,
}: GenerativeLayoutRendererProps) {
  const LayoutComponent = useMemo(() => {
    switch (layout.type) {
      case 'single':
        return SingleLayout;
      case 'split':
        return SplitLayout;
      case 'wizard':
        return WizardLayout;
      case 'grid':
        return GridLayout;
      default:
        return SingleLayout;
    }
  }, [layout.type]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={layout.id}
        variants={layoutVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn('w-full', className)}
        data-testid="generative-layout-renderer"
      >
        <Card className="overflow-hidden">
          {layout.metadata?.title && (
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {layout.metadata.title}
              </CardTitle>
              {layout.metadata?.description && (
                <p className="text-sm text-muted-foreground">
                  {layout.metadata.description}
                </p>
              )}
            </CardHeader>
          )}
          <CardContent className="pt-4">
            <LayoutComponent
              layout={layout}
              className=""
            />
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
