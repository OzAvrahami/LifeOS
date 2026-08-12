export type InboxDemoState = 'normal' | 'empty' | 'busy' | 'processing';

export type InboxTask = {
  id: string;
  title: string;
  createdLabel: string;
  compactCreatedLabel: string;
};

export type InboxDestination = 'today' | 'week' | 'day' | 'deleted';

const demoStates: readonly InboxDemoState[] = ['normal', 'empty', 'busy', 'processing'];

export function isInboxDemoState(value: string | undefined): value is InboxDemoState {
  return demoStates.some((state) => state === value);
}
