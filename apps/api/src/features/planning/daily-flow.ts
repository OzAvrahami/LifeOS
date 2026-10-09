import type { SupabaseClient } from '@supabase/supabase-js';
import { isDeepStrictEqual } from 'node:util';
import { mapTask } from '../tasks/task.service.js';
import type { Task, TaskRow } from '../tasks/task.types.js';
import { parseTaskId } from '../tasks/task.validation.js';
import { PlanningApiError } from './planning.validation.js';

export type ProposalReason = { kind: 'planned' | 'due' | 'carry' | 'important' | 'backlog'; origin: string | null };
export type Proposal = { ids: string[]; reasons: Record<string, ProposalReason>; snapshot: string; rule: 'bounded-v1' };
export type FlowState = { proposal: Proposal | null; source: 'daily' | 'weekly' | 'legacy' | null; summary: { note: string; savedAt: string } | null };
export type FlowRow = { id: string; date: string; planning_status: string; planning_revision: number; selected_task_ids: string[]; flow_state: FlowState | null };
export type FlowContext = { plan: FlowRow | null; tasks: TaskRow[]; history: { date: string; ids: string[]; revision: number }[];
  weeks: { id: string; weekStart: string }[]; snapshot: string; today: string; timezone: string };
export type FlowCommand = { action: 'propose' | 'save-draft' | 'approve' | 'edit' | 'discard' | 'summarize';
  operationId: string; revision: number; snapshot?: string; ids?: string[]; source?: 'daily' | 'weekly'; note?: string };

// Explicit defaults, independent of durations/calendar capacity. Never generate more
// than five additions or more than two carry-over items. An existing plan is retained.
export function proposeDay(context: FlowContext, date: string): Proposal {
  const approved = context.plan?.planning_status === 'completed';
  const legacyDraft = context.plan?.planning_status === 'in_progress' && !context.plan.flow_state;
  const eligible = (task: TaskRow) => ['open', 'in_progress'].includes(task.status)
    && (!task.planned_date || task.planned_date <= date)
    && (!task.week_plan_id || !context.weeks.some(w => w.id === task.week_plan_id && w.weekStart > date));
  const retained = approved ? context.plan!.selected_task_ids : legacyDraft
    ? context.plan!.selected_task_ids.filter(id => context.tasks.some(task => task.id === id && eligible(task))) : [];
  const retainedSet = new Set(retained);
  const weeks = new Map(context.weeks.map(w => [w.id, w.weekStart]));
  const origins = new Map<string, string>();
  for (const day of [...context.history].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const id of day.ids) origins.set(id, day.date);
  }
  const candidates = context.tasks.map(mapTask).filter(t =>
    ['open', 'in_progress'].includes(t.status) && !retainedSet.has(t.id)
    && (!t.plannedDate || t.plannedDate <= date)
    && (!t.weekPlanId || !weeks.get(t.weekPlanId) || weeks.get(t.weekPlanId)! <= date));
  const reasonFor = (task: Task): ProposalReason => {
    const origin = origins.get(task.id) ?? (task.plannedDate && task.plannedDate < date ? task.plannedDate : null);
    if (task.plannedDate === date) return { kind: 'planned', origin };
    if (task.dueDate && task.dueDate <= date) return { kind: 'due', origin };
    if (origin) return { kind: 'carry', origin };
    if (task.priority === 'important') return { kind: 'important', origin: null };
    return { kind: 'backlog', origin: null };
  };
  const rank = { planned: 0, due: 1, carry: 2, important: 3, backlog: 4 };
  candidates.sort((a, b) => {
    const ar = reasonFor(a); const br = reasonFor(b);
    return rank[ar.kind] - rank[br.kind]
      || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
      || (br.origin ?? '').localeCompare(ar.origin ?? '')
      || Number(b.priority === 'important') - Number(a.priority === 'important')
      || a.position - b.position || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
  });
  const ids = [...retained]; const reasons: Record<string, ProposalReason> = {};
  let carried = 0; let added = 0;
  const limit = Math.max(0, 5 - retained.length);
  for (const task of candidates) {
    const reason = reasonFor(task);
    if (added >= limit) break;
    if (reason.origin && carried >= 2) continue;
    ids.push(task.id); reasons[task.id] = reason; added++;
    if (reason.origin) carried++;
  }
  return { ids, reasons, snapshot: context.snapshot, rule: 'bounded-v1' };
}

export function parseFlowCommand(value: unknown): FlowCommand {
  const invalid = (): never => { throw new PlanningApiError(400, 'Invalid daily flow command'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const body = value as Record<string, unknown>;
  const action = String(body.action);
  const extra = action === 'propose' ? [] : action === 'summarize' ? ['note'] : action === 'discard' ? [] : ['ids', ...(action === 'approve' ? ['source'] : [])];
  if (!['propose', 'save-draft', 'approve', 'edit', 'discard', 'summarize'].includes(action)
    || Object.keys(body).some(k => !['action', 'operationId', 'revision', 'snapshot', ...extra].includes(k))
    || !Number.isSafeInteger(body.revision) || Number(body.revision) < 0 || Number(body.revision) > 2147483646) return invalid();
  try { if (typeof body.operationId !== 'string') return invalid(); parseTaskId(body.operationId); } catch { return invalid(); }
  if (!['discard', 'summarize'].includes(action) && (typeof body.snapshot !== 'string' || !/^[a-f0-9]{32}$/.test(body.snapshot))) return invalid();
  if (['save-draft', 'approve', 'edit'].includes(action)) {
    if (!Array.isArray(body.ids) || body.ids.length > 500 || new Set(body.ids).size !== body.ids.length) return invalid();
    try { for (const id of body.ids) { if (typeof id !== 'string') return invalid(); parseTaskId(id); } } catch { return invalid(); }
  }
  if (action === 'approve' && !['daily', 'weekly'].includes(String(body.source))) return invalid();
  if (action === 'summarize' && (typeof body.note !== 'string' || body.note.length > 1000)) return invalid();
  return body as FlowCommand;
}
function databaseError(error: { code?: string }): never {
  if (['42883', '42703', 'PGRST202', 'PGRST204'].includes(error.code ?? '')) throw new PlanningApiError(503, 'Daily proposals require a database update');
  if (['40001', '40P01', '55000'].includes(error.code ?? '')) throw new PlanningApiError(409, 'Planning changed; reload and review');
  if (['22023', '23514', '22P02', '42501'].includes(error.code ?? '')) throw new PlanningApiError(400, 'Invalid daily flow command');
  throw new PlanningApiError(500, 'Daily flow operation failed');
}
export function presentFlow(context: FlowContext) {
  const p = context.plan;
  return { plan: p ? { id: p.id, date: p.date, approved: p.planning_status === 'completed', revision: p.planning_revision,
    ids: p.planning_status === 'completed' ? p.selected_task_ids : [],
    proposal: p.flow_state?.proposal ?? null, source: p.flow_state?.source ?? (p.planning_status === 'completed' ? 'legacy' : null),
    summary: p.flow_state?.summary ?? null } : null,
  tasks: context.tasks.map(mapTask), snapshot: context.snapshot, today: context.today, timezone: context.timezone };
}
export class DailyFlowService {
  constructor(private readonly client: SupabaseClient) {}
  private async context(date: string): Promise<FlowContext> {
    const { data, error } = await this.client.rpc('daily_flow_context', { p_date: date });
    if (error) databaseError(error);
    return data as FlowContext;
  }
  async get(date: string) { return presentFlow(await this.context(date)); }
  async week(weekStart: string) {
    const end = new Date(`${weekStart}T12:00:00Z`); end.setUTCDate(end.getUTCDate() + 6);
    const context = await this.context(weekStart);
    const { data, error } = await this.client.from('daily_plans')
      .select('id,date,planning_status,planning_revision,selected_task_ids,flow_state')
      .gte('date', weekStart).lte('date', end.toISOString().slice(0, 10)).order('date');
    if (error) databaseError(error);
    return { days: ((data ?? []) as FlowRow[]).map(plan => presentFlow({ ...context, plan }).plan!), tasks: context.tasks.map(mapTask) };
  }
  async save(date: string, command: FlowCommand) {
    let payload: FlowCommand & { proposal?: Proposal } = command;
    if (command.action === 'propose') {
      const context = await this.context(date);
      // A retry after successful generation returns the persisted proposal without
      // regenerating against later task data. The SQL ledger validates the identity.
      const previous = await this.client.from('daily_flow_operations').select('command').eq('operation_id', command.operationId).maybeSingle();
      if (previous.error) databaseError(previous.error);
      if (previous.data) {
        const original = { ...previous.data.command } as typeof payload;
        delete original.proposal;
        if (!isDeepStrictEqual(original, command)) throw new PlanningApiError(409, 'Operation identity reused');
        payload = previous.data.command as typeof payload;
      } else {
        if (context.snapshot !== command.snapshot) throw new PlanningApiError(409, 'Tasks changed; review again');
        payload = { ...command, proposal: proposeDay(context, date) };
      }
    }
    const { data, error } = await this.client.rpc('save_daily_flow', { p_date: date, p_command: payload });
    if (error) databaseError(error);
    return presentFlow(data as FlowContext);
  }
}
