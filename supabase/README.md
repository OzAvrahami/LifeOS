# Supabase project boundary

This directory will own local Supabase configuration, migrations, seed data, and functions when those artifacts are introduced.

No Supabase project, schema, tables, migrations, or seed data are initialized yet. Product data access will be implemented in `apps/api` and will use the authenticated user's access token so normal operations remain subject to Row Level Security.

Service-role or secret keys are intentionally not part of the current foundation.
