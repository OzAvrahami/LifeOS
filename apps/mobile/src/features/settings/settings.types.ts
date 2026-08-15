export const DEFAULT_DAILY_CAPACITY_MINUTES = 360;
export const DEFAULT_WEEK_START_DAY = 0;

export type UserSettings = {
  defaultDailyCapacityMinutes: number;
  persisted: boolean;
  timezone: string | null;
  weekStartDay: number;
};

export type EffectiveUserSettings = {
  defaultDailyCapacityMinutes: number;
  persisted: boolean;
  timezone: string;
  weekStartDay: number;
};

export type PutUserSettingsInput = {
  defaultDailyCapacityMinutes: number;
  timezone: string;
  weekStartDay: number;
};

export type TimezoneOption = {
  label: string;
  searchTerms: string[];
  timezone: string;
};

export const weekdayLabels = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
] as const;

export const capacityOptions = [180, 240, 300, 360, 420, 480] as const;

export const timezoneOptions: TimezoneOption[] = [
  { label: 'ישראל', searchTerms: ['ירושלים', 'israel', 'jerusalem'], timezone: 'Asia/Jerusalem' },
  { label: 'ניו יורק', searchTerms: ['new york', 'ארצות הברית'], timezone: 'America/New_York' },
  { label: 'לונדון', searchTerms: ['london', 'בריטניה'], timezone: 'Europe/London' },
  { label: 'ברלין', searchTerms: ['berlin', 'גרמניה'], timezone: 'Europe/Berlin' },
  { label: 'פריז', searchTerms: ['paris', 'צרפת'], timezone: 'Europe/Paris' },
  { label: 'לוס אנג׳לס', searchTerms: ['los angeles', 'קליפורניה'], timezone: 'America/Los_Angeles' },
  { label: 'טוקיו', searchTerms: ['tokyo', 'יפן'], timezone: 'Asia/Tokyo' },
  { label: 'סידני', searchTerms: ['sydney', 'אוסטרליה'], timezone: 'Australia/Sydney' },
  { label: 'UTC', searchTerms: ['gmt', 'אוניברסלי'], timezone: 'UTC' },
];
