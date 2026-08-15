import type { CommitmentLifeArea } from '@/features/commitments/commitment.types';

export type LifeArea = 'work' | 'family' | 'home';

export type TodayDemoState =
  | 'normal'
  | 'unplanned'
  | 'active'
  | 'overloaded'
  | 'partially_completed';

const todayDemoStates: readonly TodayDemoState[] = [
  'normal',
  'unplanned',
  'active',
  'overloaded',
  'partially_completed',
];

export function isTodayDemoState(value: string | undefined): value is TodayDemoState {
  return todayDemoStates.some((state) => state === value);
}

export type TodayTask = {
  id: string;
  title: string;
  durationMinutes: number;
  lifeArea: LifeArea;
};

export type Commitment = {
  id: string;
  time: string;
  title: string;
  lifeArea: CommitmentLifeArea;
};

export type TodayFixture = {
  greeting: string;
  dateLabel: string;
  summary: {
    taskCount: number;
    commitmentCount: number;
    plannedTime: string;
    workload: 'מאוזן';
  };
  focus: TodayTask;
  commitments: Commitment[];
  tasks: TodayTask[];
  suggestion: string;
};
