export type CaptureDestination = 'inbox' | 'today' | 'week' | 'day';

export type TaskCapturePlacement =
  | { destination: 'inbox' | 'today' | 'week' }
  | { destination: 'day'; plannedDate: string };
