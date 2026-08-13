import {
  CreateTaskInput,
  TaskListFilters,
  TaskPlanningInput,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from './task.types.js';

export class TaskApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseMessage: string,
  ) {
    super(responseMessage);
  }
}

const taskStatuses = new Set<TaskStatus>(['open', 'in_progress', 'completed', 'cancelled']);
const taskPriorities = new Set<TaskPriority>(['normal', 'important']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function invalid(message = 'Invalid task input'): never {
  throw new TaskApiError(400, message);
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  if (Object.keys(value).some((key) => !allowed.has(key))) invalid();
}

export function parseTaskId(value: string) {
  if (!uuidPattern.test(value)) invalid('Invalid task id');
  return value;
}

function parseDate(value: unknown, label: string): string {
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

function parseNullableDate(value: unknown, label: string): string | null {
  return value === null ? null : parseDate(value, label);
}

function parseTitle(value: unknown) {
  if (typeof value !== 'string') invalid('Title is required');
  const title = value.trim();
  if (!title || title.length > 500) invalid('Title must contain 1 to 500 characters');
  return title;
}

function parseNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > 10_000) invalid(`Invalid ${label}`);
  return value;
}

function parseEstimatedMinutes(value: unknown): number | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || (value as number) < 0) invalid('Invalid estimatedMinutes');
  return value as number;
}

function parsePosition(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0) invalid('Invalid position');
  return value as number;
}

function parsePriority(value: unknown): TaskPriority {
  if (typeof value !== 'string' || !taskPriorities.has(value as TaskPriority)) {
    invalid('Invalid priority');
  }
  return value as TaskPriority;
}

function parseStatus(value: unknown): TaskStatus {
  if (typeof value !== 'string' || !taskStatuses.has(value as TaskStatus)) {
    invalid('Invalid status');
  }
  return value as TaskStatus;
}

function parsePlanning(value: unknown): TaskPlanningInput {
  const planning = objectValue(value);
  if (planning.type === 'inbox') {
    rejectUnknownKeys(planning, new Set(['type']));
    return { type: 'inbox' };
  }
  if (planning.type === 'week') {
    rejectUnknownKeys(planning, new Set(['type', 'weekStart']));
    return { type: 'week', weekStart: parseDate(planning.weekStart, 'weekStart') };
  }
  if (planning.type === 'day') {
    rejectUnknownKeys(planning, new Set(['type', 'plannedDate']));
    return { type: 'day', plannedDate: parseDate(planning.plannedDate, 'plannedDate') };
  }
  return invalid('Invalid planning destination');
}

const writableKeys = new Set([
  'title',
  'description',
  'estimatedMinutes',
  'priority',
  'dueDate',
  'position',
  'planning',
]);

export function parseCreateTask(value: unknown): CreateTaskInput {
  const body = objectValue(value);
  rejectUnknownKeys(body, writableKeys);
  const input: CreateTaskInput = { title: parseTitle(body.title) };
  if ('description' in body) input.description = parseNullableString(body.description, 'description');
  if ('estimatedMinutes' in body) input.estimatedMinutes = parseEstimatedMinutes(body.estimatedMinutes);
  if ('priority' in body) input.priority = parsePriority(body.priority);
  if ('dueDate' in body) input.dueDate = parseNullableDate(body.dueDate, 'dueDate');
  if ('position' in body) input.position = parsePosition(body.position);
  if ('planning' in body) input.planning = parsePlanning(body.planning);
  return input;
}

export function parseUpdateTask(value: unknown): UpdateTaskInput {
  const body = objectValue(value);
  rejectUnknownKeys(body, new Set([...writableKeys, 'status']));
  if (Object.keys(body).length === 0) invalid('At least one task field is required');

  const input: UpdateTaskInput = {};
  if ('title' in body) input.title = parseTitle(body.title);
  if ('description' in body) input.description = parseNullableString(body.description, 'description');
  if ('estimatedMinutes' in body) input.estimatedMinutes = parseEstimatedMinutes(body.estimatedMinutes);
  if ('priority' in body) input.priority = parsePriority(body.priority);
  if ('dueDate' in body) input.dueDate = parseNullableDate(body.dueDate, 'dueDate');
  if ('position' in body) input.position = parsePosition(body.position);
  if ('planning' in body) input.planning = parsePlanning(body.planning);
  if ('status' in body) input.status = parseStatus(body.status);

  if (input.status === 'in_progress' && Object.keys(body).length !== 1) {
    invalid('Starting a task must be requested as a single transition');
  }
  if (input.planning && input.status && input.status !== 'open') {
    invalid('A planning move can only use open status');
  }
  return input;
}

export function parseTaskFilters(query: Record<string, unknown>): TaskListFilters {
  rejectUnknownKeys(query, new Set(['status', 'plannedDate', 'weekStart', 'placement']));
  const filters: TaskListFilters = {};
  if (query.status !== undefined) filters.status = parseStatus(query.status);
  if (query.plannedDate !== undefined) filters.plannedDate = parseDate(query.plannedDate, 'plannedDate');
  if (query.weekStart !== undefined) filters.weekStart = parseDate(query.weekStart, 'weekStart');
  if (query.placement !== undefined) {
    if (query.placement !== 'inbox') invalid('Invalid placement');
    filters.placement = 'inbox';
  }
  const planningFilters = [filters.plannedDate, filters.weekStart, filters.placement].filter(Boolean);
  if (planningFilters.length > 1) invalid('Use only one planning filter');
  return filters;
}
