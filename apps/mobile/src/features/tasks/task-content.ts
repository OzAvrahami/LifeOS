// Match the existing API limits. Keep meaningful whitespace and line breaks.
export const TASK_TITLE_LIMIT = 500;
export const TASK_DESCRIPTION_LIMIT = 10_000;
export function normalizeTaskDescription(value: string): string | null {
  return value.trim() ? value : null;
}
export function taskContentError(title: string, description: string) {
  if (!title.trim() || title.trim().length > TASK_TITLE_LIMIT) return 'יש להזין כותרת של 1–500 תווים.';
  if (description.length > TASK_DESCRIPTION_LIMIT) return 'התיאור יכול להכיל עד 10,000 תווים.';
  return null;
}
