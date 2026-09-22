export const commitmentLifeAreas = [
  'work',
  'family',
  'home',
  'health',
  'personal',
  'projects',
] as const;

export type CommitmentLifeArea = typeof commitmentLifeAreas[number];

export type Commitment = {
  reminderMinutesBefore?: number | null;
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string | null;
  lifeArea: CommitmentLifeArea | null;
  createdAt: string;
  updatedAt: string;
};

export type CommitmentListFilters = {
  id?: string;
  reminders?: boolean;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type CreateCommitmentInput = {
  reminderMinutesBefore?: number | null;
  title: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime?: string | null;
  lifeArea?: CommitmentLifeArea | null;
};

export type UpdateCommitmentInput = Partial<CreateCommitmentInput>;

export const commitmentLifeAreaLabels: Record<CommitmentLifeArea, string> = {
  family: 'משפחה',
  health: 'בריאות',
  home: 'בית',
  personal: 'אישי',
  projects: 'פרויקטים',
  work: 'עבודה',
};
