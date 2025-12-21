export const KB_AI_DRAFT_MAX_TOKENS = 900
export const KB_AI_SUMMARY_MAX_TOKENS = 600
export const KB_AI_ASK_MAX_TOKENS = 700
export const KB_AI_PROMPT_CHAR_LIMIT = 4000
export const KB_AI_QUESTION_CHAR_LIMIT = 1000
export const KB_AI_CONTEXT_CHAR_LIMIT = 6000
export const KB_AI_SUMMARY_CONTENT_CHAR_LIMIT = 6000
export const KB_AI_OUTPUT_CHAR_LIMIT = 12000
export const KB_AI_SUMMARY_MAX_KEY_POINTS = 6

export const KB_TASK_DRAFT_COMMENT_LIMIT = 8
export const KB_TASK_DRAFT_COMMENT_CHAR_LIMIT = 400
export const KB_TASK_DRAFT_CONTEXT_CHAR_LIMIT = 6000

export const KB_KNOWLEDGE_EXTRACTION_MIN_CONTENT_CHARS = 200
export const KB_KNOWLEDGE_EXTRACTION_MIN_CONTENT_WORDS = 40
export const KB_KNOWLEDGE_EXTRACTION_MAX_PREVIEW_COMMENTS = 8
export const KB_KNOWLEDGE_EXTRACTION_PREVIEW_COMMENT_CHAR_LIMIT = 300
export const KB_KNOWLEDGE_EXTRACTION_PREVIEW_CONTENT_CHAR_LIMIT = 4000
export const KB_KNOWLEDGE_EXTRACTION_FALLBACK_COMMENT_CHAR_LIMIT = 240

export const KB_GAP_DEFAULT_LIMIT = 10
export const KB_GAP_DEFAULT_TASK_WINDOW_DAYS = 90
export const KB_GAP_DEFAULT_MIN_FREQUENCY = 1
export const KB_GAP_MIN_QUESTION_FREQUENCY = 2
export const KB_GAP_TASK_LIMIT_DEFAULT = 500
export const KB_GAP_TASK_LIMIT_MIN = 50
export const KB_GAP_TASK_LIMIT_MAX = 2000

export function getKbGapTaskLimit(): number {
  const raw = Number.parseInt(process.env.KB_GAP_TASK_LIMIT ?? '', 10)
  if (Number.isFinite(raw)) {
    return clamp(raw, KB_GAP_TASK_LIMIT_MIN, KB_GAP_TASK_LIMIT_MAX)
  }
  return KB_GAP_TASK_LIMIT_DEFAULT
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
