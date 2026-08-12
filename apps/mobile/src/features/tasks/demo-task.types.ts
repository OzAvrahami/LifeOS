export type DemoTaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type DemoTaskLifeArea = 'work' | 'family' | 'home';

export type DemoTask = {
  id: string;
  title: string;
  status: DemoTaskStatus;
  plannedDate: string | null;
  weekPlanId: string | null;
  estimatedMinutes?: number;
  lifeArea?: DemoTaskLifeArea;
  position: number;
  createdLabel: string;
  compactCreatedLabel: string;
  completedAt: string | null;
};

export type DemoCaptureDestination = 'inbox' | 'today' | 'week';

export type DemoTaskState = {
  tasks: DemoTask[];
  nextTaskSequence: number;
};

export type DemoTaskAction =
  | { type: 'capture'; title: string; destination: DemoCaptureDestination }
  | { type: 'move_to_inbox'; taskId: string }
  | { type: 'move_to_week'; taskId: string }
  | { type: 'move_to_today'; taskId: string }
  | { type: 'schedule'; taskId: string; plannedDate: string }
  | { type: 'cancel'; taskId: string }
  | { type: 'edit_title'; taskId: string; title: string }
  | { type: 'start'; taskId: string }
  | { type: 'stop'; taskId: string }
  | { type: 'complete'; taskId: string };
