import {
  commitmentLifeAreas,
  type CommitmentLifeArea,
  type CommitmentListFilters,
  type CreateCommitmentInput,
  type UpdateCommitmentInput,
} from './commitment.types.js';

export class CommitmentApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseMessage: string,
  ) {
    super(responseMessage);
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bodyKeys = new Set(['title', 'description', 'date', 'startTime', 'endTime', 'lifeArea']);

function invalid(message = 'Invalid Commitment input'): never {
  throw new CommitmentApiError(400, message);
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  if (Object.keys(value).some((key) => !allowed.has(key))) invalid();
}

function parseTitle(value: unknown) {
  if (typeof value !== 'string') invalid('Invalid title');
  const title = value.trim();
  if (!title || title.length > 500) invalid('Invalid title');
  return title;
}

function parseDescription(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.length > 5000) invalid('Invalid description');
  return value.trim() || null;
}

export function parseCommitmentDate(value: unknown, label = 'date') {
  if (typeof value !== 'string' || !datePattern.test(value)) invalid(`Invalid ${label}`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month! - 1
    || date.getUTCDate() !== day
  ) invalid(`Invalid ${label}`);
  return value;
}

function parseTime(value: unknown, label: string) {
  if (typeof value !== 'string' || !timePattern.test(value)) invalid(`Invalid ${label}`);
  return value;
}

function parseLifeArea(value: unknown): CommitmentLifeArea | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || !commitmentLifeAreas.some((area) => area === value)) {
    invalid('Invalid lifeArea');
  }
  return value as CommitmentLifeArea;
}

export function validateCommitmentTimeRange(startTime: string, endTime: string | null) {
  if (endTime !== null && endTime <= startTime) {
    invalid('endTime must be after startTime');
  }
}

export function parseCommitmentId(value: unknown) {
  if (typeof value !== 'string' || !uuidPattern.test(value)) invalid('Invalid Commitment id');
  return value;
}

export function parseCommitmentFilters(value: Record<string, unknown>): CommitmentListFilters {
  rejectUnknownKeys(value, new Set(['date', 'dateFrom', 'dateTo']));
  const filters: CommitmentListFilters = {};
  if (value.date !== undefined) filters.date = parseCommitmentDate(value.date);
  if (value.dateFrom !== undefined) filters.dateFrom = parseCommitmentDate(value.dateFrom, 'dateFrom');
  if (value.dateTo !== undefined) filters.dateTo = parseCommitmentDate(value.dateTo, 'dateTo');
  if (filters.date && (filters.dateFrom || filters.dateTo)) invalid('Use date or a date range, not both');
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    invalid('dateFrom must not be after dateTo');
  }
  return filters;
}

export function parseCreateCommitment(value: unknown): CreateCommitmentInput {
  const body = objectValue(value);
  rejectUnknownKeys(body, bodyKeys);
  if (!('title' in body) || !('date' in body) || !('startTime' in body)) invalid();

  const input: CreateCommitmentInput = {
    date: parseCommitmentDate(body.date),
    description: parseDescription(body.description),
    endTime: body.endTime === null || body.endTime === undefined
      ? null
      : parseTime(body.endTime, 'endTime'),
    lifeArea: parseLifeArea(body.lifeArea),
    startTime: parseTime(body.startTime, 'startTime'),
    title: parseTitle(body.title),
  };
  validateCommitmentTimeRange(input.startTime, input.endTime);
  return input;
}

export function parseUpdateCommitment(value: unknown): UpdateCommitmentInput {
  const body = objectValue(value);
  rejectUnknownKeys(body, bodyKeys);
  if (Object.keys(body).length === 0) invalid('At least one Commitment field is required');

  const input: UpdateCommitmentInput = {};
  if ('title' in body) input.title = parseTitle(body.title);
  if ('description' in body) input.description = parseDescription(body.description);
  if ('date' in body) input.date = parseCommitmentDate(body.date);
  if ('startTime' in body) input.startTime = parseTime(body.startTime, 'startTime');
  if ('endTime' in body) {
    input.endTime = body.endTime === null ? null : parseTime(body.endTime, 'endTime');
  }
  if ('lifeArea' in body) input.lifeArea = parseLifeArea(body.lifeArea);
  return input;
}
