export type CaptureDestination = 'inbox' | 'today' | 'week' | 'day';

export type TaskCaptureDetails = { description: string | null; creationId: string };

export type TaskCapturePlacement =
  | { destination: 'inbox' | 'today' | 'week' }
  | { destination: 'day'; plannedDate: string };
