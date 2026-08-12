import { UnscheduledWeekTask, WeekCommitment, WeekDay, WeeklyFocus } from './week.types';

export const weekDateRange = '2–8 באוגוסט';

export const weeklyFocuses: WeeklyFocus[] = [
  { id: 'lifeos', title: 'לסיים את אפיון LifeOS' },
  { id: 'home', title: 'לטפל בנושא בבית' },
  { id: 'project', title: 'להתקדם בפרויקט העבודה' },
];

export const normalWeekDays: WeekDay[] = [
  { id: 'sun', weekday: 'ראשון', date: 2, taskCount: 2, plannedTime: '1:15', workload: 'פנוי', isPast: true },
  { id: 'mon', weekday: 'שני', date: 3, taskCount: 5, plannedTime: '4:30', workload: 'עמוס', commitmentTime: '10:00', isPast: true },
  { id: 'tue', weekday: 'שלישי', date: 4, taskCount: 3, plannedTime: '2:10', workload: 'מאוזן', isPast: true },
  { id: 'wed', weekday: 'רביעי', date: 5, taskCount: 2, plannedTime: '1:40', workload: 'מאוזן', isPast: true },
  { id: 'thu', weekday: 'חמישי', date: 6, taskCount: 1, plannedTime: '0:30', workload: 'פנוי', isPast: true },
  { id: 'fri', weekday: 'שישי', date: 7, taskCount: 4, plannedTime: '3:15', workload: 'עמוס', commitmentTime: '13:00', isPast: true },
  { id: 'sat', weekday: 'שבת', date: 8, taskCount: 4, plannedTime: '3:20', workload: 'מאוזן', commitmentTime: '13:30', isToday: true },
];

export const unscheduledWeekTasks: UnscheduledWeekTask[] = [
  { id: 'proposal', title: 'להכין הצעת מחיר', durationMinutes: 45 },
  { id: 'supplier', title: 'להתקשר לספק', durationMinutes: 15 },
  { id: 'storage', title: 'לסדר מחסן', durationMinutes: 90 },
];

export const overloadedWeekDays: WeekDay[] = normalWeekDays.map((day) =>
  day.id === 'mon'
    ? { ...day, taskCount: 5, plannedTime: '5:00', workload: 'עמוס מדי' }
    : day.id === 'tue'
      ? { ...day, taskCount: 1, plannedTime: '0:30', workload: 'פנוי' }
      : day,
);

export const overloadedDayTasks: UnscheduledWeekTask[] = [
  unscheduledWeekTasks[0],
  unscheduledWeekTasks[2],
];

export const unplannedWeekCommitments: WeekCommitment[] = [
  { id: 'team', weekday: 'שני', title: 'פגישת צוות', time: '10:00' },
  { id: 'pickup', weekday: 'שבת', title: 'איסוף הילדים', time: '13:30' },
];

export const planningCarryover = [
  'להכין הצעת מחיר',
  'לסגור את מסמך הדרישות',
];
