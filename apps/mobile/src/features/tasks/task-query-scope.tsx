import { createContext, PropsWithChildren, use } from 'react';

const TaskQueryScopeContext = createContext('current-session');

export function TaskQueryScopeProvider({
  children,
  userId,
}: PropsWithChildren<{ userId?: string }>) {
  return (
    <TaskQueryScopeContext value={userId ?? 'current-session'}>
      {children}
    </TaskQueryScopeContext>
  );
}

export function useTaskQueryScope() {
  return use(TaskQueryScopeContext);
}
