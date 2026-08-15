import type { DailyPlanInput } from './planning.types.js';

export class PlanningApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseMessage: string,
  ) {
    super(responseMessage);
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message = 'Invalid planning input'): never {
  throw new PlanningApiError(400, message);
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  if (Object.keys(value).some((key) => !allowed.has(key))) invalid();
}

export function parsePlanningDate(value: unknown, label: string) {
  if (typeof value !== 'string' || !datePattern.test(value)) invalid(`Invalid ${label}`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month! - 1 ||
    date.getUTCDate() !== day
  ) {
    invalid(`Invalid ${label}`);
  }
  return value;
}

export function parseDailyPlan(value: unknown): DailyPlanInput {
  const body = objectValue(value);
  rejectUnknownKeys(body, new Set(['focusTaskId', 'availableMinutes']));
  if (Object.keys(body).length === 0) invalid('At least one Daily Plan field is required');

  let focusTaskId: string | null = null;
  if ('focusTaskId' in body) {
    if (body.focusTaskId !== null && (
      typeof body.focusTaskId !== 'string' || !uuidPattern.test(body.focusTaskId)
    )) invalid('Invalid focusTaskId');
    focusTaskId = body.focusTaskId as string | null;
  }

  let availableMinutes: number | null = null;
  if ('availableMinutes' in body) {
    if (body.availableMinutes !== null && (
      !Number.isInteger(body.availableMinutes) ||
      (body.availableMinutes as number) < 0 ||
      (body.availableMinutes as number) > 1440
    )) invalid('Invalid availableMinutes');
    availableMinutes = body.availableMinutes as number | null;
  }

  return { availableMinutes, focusTaskId };
}

export function parseWeeklyFocuses(value: unknown) {
  const body = objectValue(value);
  rejectUnknownKeys(body, new Set(['titles']));
  if (!Array.isArray(body.titles) || body.titles.length > 3) {
    invalid('Weekly focuses must contain at most three titles');
  }
  const titles = body.titles.map((value) => {
    if (typeof value !== 'string') invalid('Invalid weekly focus title');
    const title = value.trim();
    if (!title || title.length > 200) invalid('Invalid weekly focus title');
    return title;
  });
  if (new Set(titles).size !== titles.length) invalid('Weekly focus titles must be unique');
  return titles;
}
