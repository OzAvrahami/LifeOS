# LifeOS

LifeOS is a mobile-first daily and weekly planning application. The Expo client calls a Node.js/Express REST API for business operations; Supabase provides PostgreSQL, authentication, and Row Level Security.

```text
Mobile / future Web → REST API → Supabase PostgreSQL
                         ↑
              Supabase access token
```

## Repository

- `apps/mobile` — Expo, React Native, TypeScript, Expo Router
- `apps/api` — Node.js, Express, TypeScript REST API
- `supabase` — local Supabase configuration and versioned database migrations
- `docs` — product and architecture documentation

Current planning and release status:

- [Roadmap](docs/ROADMAP.md)
- [Implementation status](docs/IMPLEMENTATION_STATUS.md)
- [Changelog](CHANGELOG.md)

Node 24 LTS is the preferred runtime. The current foundation also validates successfully on Node 26.

## Development

```bash
npm install
npm run mobile
npm run api
```

Copy each workspace’s `.env.example` to `.env` and provide local values. No service-role key is required.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

Expo SDK 57 uses a development build on a physical iPhone because the App Store Expo Go build currently supports SDK 54.
