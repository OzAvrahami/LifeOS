import { TodayFixture } from './today.types';

export const normalTodayFixture: TodayFixture = {
  greeting: 'בוקר טוב, עוז',
  dateLabel: 'שבת, 8 באוגוסט',
  summary: {
    taskCount: 4,
    commitmentCount: 2,
    plannedTime: '3:20',
    workload: 'מאוזן',
  },
  focus: {
    id: 'focus-lifeos',
    title: 'לעבוד על LifeOS',
    durationMinutes: 60,
    lifeArea: 'work',
  },
  commitments: [
    { id: 'school-pickup', time: '13:30', title: 'איסוף הילדים', lifeArea: 'family' },
    { id: 'danny-meeting', time: '17:00', title: 'פגישה עם דני', lifeArea: 'work' },
  ],
  tasks: [
    { id: 'lifeos', title: 'לעבוד על LifeOS', durationMinutes: 60, lifeArea: 'work' },
    { id: 'supplier', title: 'להתקשר לספק', durationMinutes: 15, lifeArea: 'work' },
    { id: 'home', title: 'לסדר משהו בבית', durationMinutes: 30, lifeArea: 'home' },
  ],
  suggestion: 'משימה חשובה מהשבוע · להכין הצעת מחיר',
};

export const unplannedTodayFixture = {
  greeting: 'בוקר טוב, עוז',
  dateLabel: 'שבת, 8 באוגוסט',
  commitments: normalTodayFixture.commitments,
} as const;

export const activeTodayFixture = {
  dateLabel: 'שבת, 8 באוגוסט',
  task: normalTodayFixture.focus,
  laterTasks: normalTodayFixture.tasks.slice(1),
  commitment: normalTodayFixture.commitments[0],
} as const;

export const overloadedTodayFixture = {
  greeting: 'בוקר טוב, עוז',
  dateLabel: 'שבת, 8 באוגוסט',
  plannedTime: '8:10',
  availableTime: '6:00',
  taskCount: 7,
  commitmentCount: 2,
  tasks: [
    { ...normalTodayFixture.tasks[0], durationMinutes: 90, important: true },
    { id: 'proposal', title: 'להכין הצעת מחיר', durationMinutes: 45, lifeArea: 'work' as const },
    { id: 'storage', title: 'לסדר את המחסן', durationMinutes: 60, lifeArea: 'home' as const, deferLabel: 'מחר' },
  ],
} as const;

export const partiallyCompletedTodayFixture = {
  dateLabel: 'שבת, 8 באוגוסט',
  nextTask: normalTodayFixture.tasks[2],
  completedTasks: normalTodayFixture.tasks.slice(0, 2),
} as const;
