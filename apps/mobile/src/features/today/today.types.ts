export type LifeArea = 'work' | 'family' | 'home';

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
  lifeArea: LifeArea;
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
