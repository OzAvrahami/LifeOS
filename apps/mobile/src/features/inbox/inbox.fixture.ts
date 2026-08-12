import { InboxTask } from './inbox.types';

export const normalInboxItems: InboxTask[] = [
  {
    id: 'doctor-appointment',
    title: 'לקבוע תור לרופא',
    createdLabel: 'נוסף היום · 10:32',
    compactCreatedLabel: 'היום',
  },
  {
    id: 'deco-price',
    title: 'לבדוק מחיר ל־Deco נוסף',
    createdLabel: 'נוסף היום · 09:10',
    compactCreatedLabel: 'היום',
  },
  {
    id: 'website-page',
    title: 'רעיון לעמוד החדש באתר',
    createdLabel: 'נוסף אתמול',
    compactCreatedLabel: 'אתמול',
  },
  {
    id: 'birthday-gift',
    title: 'לקנות מתנה ליום הולדת',
    createdLabel: 'נוסף אתמול',
    compactCreatedLabel: 'אתמול',
  },
];

export const busyInboxItems: InboxTask[] = [
  ...normalInboxItems,
  {
    id: 'car-insurance',
    title: 'לחדש ביטוח רכב',
    createdLabel: 'נוסף אתמול',
    compactCreatedLabel: 'אתמול',
  },
  {
    id: 'yael-email',
    title: 'לענות למייל של יעל',
    createdLabel: 'נוסף לפני יומיים',
    compactCreatedLabel: '2 ימים',
  },
  {
    id: 'august-flights',
    title: 'לבדוק טיסות לאוגוסט',
    createdLabel: 'נוסף לפני יומיים',
    compactCreatedLabel: '2 ימים',
  },
];

export const processingInboxItems: InboxTask[] = [
  ...normalInboxItems.slice(0, 2),
  {
    id: 'car-service',
    title: 'לקבוע טיפול לרכב',
    createdLabel: 'נוסף אתמול',
    compactCreatedLabel: 'אתמול',
  },
  {
    id: 'network-cable',
    title: 'לקנות כבל רשת',
    createdLabel: 'נוסף אתמול',
    compactCreatedLabel: 'אתמול',
  },
  {
    id: 'supplier-followup',
    title: 'לחזור לספק לגבי ההצעה',
    createdLabel: 'נוסף ביום חמישי',
    compactCreatedLabel: 'יום חמישי',
  },
  {
    id: 'family-photo',
    title: 'לשלוח תמונה למשפחה',
    createdLabel: 'נוסף ביום חמישי',
    compactCreatedLabel: 'יום חמישי',
  },
  {
    id: 'bookshelf',
    title: 'לבדוק מידות למדף',
    createdLabel: 'נוסף ביום רביעי',
    compactCreatedLabel: 'יום רביעי',
  },
  {
    id: 'course-idea',
    title: 'לרשום רעיון לקורס',
    createdLabel: 'נוסף ביום רביעי',
    compactCreatedLabel: 'יום רביעי',
  },
  {
    id: 'bank-document',
    title: 'לבקש מסמך מהבנק',
    createdLabel: 'נוסף ביום שלישי',
    compactCreatedLabel: 'יום שלישי',
  },
  {
    id: 'garden',
    title: 'לבדוק מה צריך לגינה',
    createdLabel: 'נוסף ביום שלישי',
    compactCreatedLabel: 'יום שלישי',
  },
  {
    id: 'project-note',
    title: 'לעבור על ההערות לפרויקט',
    createdLabel: 'נוסף ביום שני',
    compactCreatedLabel: 'יום שני',
  },
  {
    id: 'weekend-plan',
    title: 'לבדוק תוכניות לסוף השבוע',
    createdLabel: 'נוסף ביום שני',
    compactCreatedLabel: 'יום שני',
  },
];

export const lightweightDayChoices = ['ראשון · 9/8', 'שני · 10/8', 'שלישי · 11/8'] as const;
