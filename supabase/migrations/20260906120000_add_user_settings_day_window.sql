alter table public.user_settings
  add column day_start_time time without time zone,
  add column day_end_time time without time zone,
  add constraint user_settings_day_window_pair_check
    check (
      (day_start_time is null and day_end_time is null)
      or (
        day_start_time is not null
        and day_end_time is not null
        and day_start_time <> day_end_time
      )
    );

comment on column public.user_settings.day_start_time is
  'Recurring local clock time at which the user active day normally starts; null with day_end_time means unset.';

comment on column public.user_settings.day_end_time is
  'Recurring local clock time at which the user active day normally ends; an earlier time is on the following calendar day.';
