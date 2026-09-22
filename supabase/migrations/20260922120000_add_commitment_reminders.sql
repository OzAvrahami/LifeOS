-- Explicit local reminder intent; no changes to existing ownership, RLS or grants.
alter table public.commitments
  add column reminder_minutes_before smallint,
  add constraint commitments_reminder_minutes_before_check
    check (reminder_minutes_before between 0 and 1440);

alter table public.user_settings
  add column commitment_reminders_enabled boolean not null default false,
  add column commitment_default_reminder_minutes smallint not null default 15,
  add constraint user_settings_commitment_default_reminder_minutes_check
    check (commitment_default_reminder_minutes between 0 and 1440);

create index commitments_user_reminders_idx on public.commitments (user_id, date, start_time, id)
  where reminder_minutes_before is not null;
