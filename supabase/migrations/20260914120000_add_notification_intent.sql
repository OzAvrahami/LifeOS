-- Account intent only. Expo request identifiers remain device-local.
alter table public.tasks
  add column reminder_at timestamptz,
  add constraint tasks_reminder_finite_check check (reminder_at is null or isfinite(reminder_at));

alter table public.user_settings
  add column notifications_enabled boolean not null default false,
  add column task_reminders_enabled boolean not null default false,
  add column weekly_planning_reminder_enabled boolean not null default false,
  add column weekly_planning_reminder_weekday smallint,
  add column weekly_planning_reminder_time time without time zone,
  add constraint notification_weekday_check check (weekly_planning_reminder_weekday between 0 and 6),
  add constraint notification_clock_check check (
    weekly_planning_reminder_time is null or (
      weekly_planning_reminder_time < time '24:00'
      and extract(second from weekly_planning_reminder_time) = 0
    )
  ),
  add constraint notification_weekly_configuration_check check (
    not weekly_planning_reminder_enabled or (
      weekly_planning_reminder_weekday is not null and weekly_planning_reminder_time is not null
    )
  );

create index tasks_reminder_user_idx on public.tasks (user_id, reminder_at, id)
where reminder_at is not null;
-- Existing table grants, RLS policies, row IDs and update/history triggers remain.
