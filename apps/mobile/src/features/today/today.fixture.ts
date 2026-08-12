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
