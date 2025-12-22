export type ZoomLevel = 'day' | 'week' | 'month'

export const ZOOM_LABELS: Record<ZoomLevel, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
}

export const ZOOM_DAY_WIDTH: Record<ZoomLevel, number> = {
  day: 36,
  week: 18,
  month: 10,
}

export const DEFAULT_DURATION_DAYS = 5
export const ROW_HEIGHT = 52
export const TIMELINE_PADDING_DAYS = 5
