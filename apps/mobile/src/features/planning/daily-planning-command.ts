import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import type { DailyPlanningInput, DailyPlanningPlan } from './daily-planning.api';
import { newPlanningOperationId } from './daily-planning-model';

export function useDailyPlanningCommand(save: (input: DailyPlanningInput) => Promise<DailyPlanningPlan>) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<DailyPlanningInput | null>(null);
  const [conflict, setConflict] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const execute = async (input: DailyPlanningInput) => {
    if (busy.current) return;
    busy.current = true; setPending(true); setFailed(null); setConflict(false);
    try { const result = await save(input); return mounted.current ? result : undefined; }
    catch (error) {
      if (mounted.current) { setFailed(input); setConflict(error instanceof ApiError && error.status === 409); }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return { pending, failed, conflict,
    run: (input: Omit<DailyPlanningInput, 'operationId'>) => execute({ ...input, operationId: newPlanningOperationId() }),
    retry: () => failed && !conflict ? execute(failed) : Promise.resolve(undefined),
    discard: () => { setFailed(null); setConflict(false); },
  };
}
