export type ResolvedDailyCapacity = {
  minutes: number;
  source: 'default' | 'override';
};

export function resolveDailyCapacity(
  dailyOverrideMinutes: number | null | undefined,
  defaultMinutes: number,
): ResolvedDailyCapacity {
  return dailyOverrideMinutes == null
    ? { minutes: defaultMinutes, source: 'default' }
    : { minutes: dailyOverrideMinutes, source: 'override' };
}
