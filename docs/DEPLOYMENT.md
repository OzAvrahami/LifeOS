# LifeOS Deployment

This document describes the existing standalone internal iPhone deployment and preparation for v0.2.0. v0.1.1 is the latest published GitHub Release. v0.2.0 is not published and still requires a new build/install and physical-iPhone acceptance. Historical standalone verification does not accept the prepared binary.

## Architecture

```text
iPhone → Railway HTTPS API → Supabase Cloud
```

The installed iPhone application sends authenticated requests to the public Railway API. The API verifies the caller's Supabase JWT and accesses Supabase with the publishable key and caller identity, leaving Row Level Security responsible for data isolation. The application does not require or use `service_role`.

## Railway API service

| Setting | Value |
| --- | --- |
| Service name | `lifeos-api` |
| Public URL | `https://lifeosapi-production-0362.up.railway.app` |
| Root Directory | `/` (repository root) |
| Build Command | `npm run build --workspace @lifeos/api` |
| Start Command | `npm run start --workspace @lifeos/api` |
| Production process | `node dist/src/server.js` |
| Healthcheck path | `/health` |

`GET /health` is unauthenticated and returns only the service name and status. Railway provides `PORT` at runtime; it must not be hard-coded.

### Railway environment variables

The API service requires these variable names:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `NODE_ENV`
- `PORT` — provided by Railway

`CORS_ALLOWED_ORIGINS` is required only when approved browser clients need API access. Native React Native requests do not depend on browser CORS.

Values and secrets belong in the Railway service configuration or untracked local environment files. Local `.env` files, Supabase key values, passwords, and JWTs must never be committed.

## Mobile deployment environment

The deployment environment must set `EXPO_PUBLIC_API_URL` to:

```text
https://lifeosapi-production-0362.up.railway.app
```

Mobile also needs its existing public Supabase configuration. Environment values remain untracked and must not be embedded in documentation or committed.

## Standalone iPhone Release build

Run Expo commands from `apps/mobile`, where this monorepo's Expo configuration lives. On the prepared Mac, connect and unlock the registered iPhone, with Developer Mode enabled and the existing Apple development team available in Xcode. Then build/install manually:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
NODE_ENV=production npx --no-install expo run:ios --device --configuration Release
```

Select the intended physical iPhone when prompted. This command compiles, signs, and installs the Release app; it was not run during preparation. The iOS bundle identifier remains `il.co.ozavrahami.lifeos`, with the existing automatic Apple Development signing/team configuration.

The installed standalone Release app contains its JavaScript and native metadata. It needs a new build/install to receive these changes. A development refresh or git push does not update that installed binary. There is no EAS Update or other over-the-air delivery configured for this path.

### Native version synchronization

`apps/mobile/app.json` now specifies version `0.2.0` and `ios.buildNumber: "2"`. Build `2` follows the local native Info.plist/build settings and cached Debug/Release `LifeOS.app` artifacts, all of which previously used build `1` (app version `0.1.0`; unused Xcode marketing settings were `1.0`). No local archives were found. The installed iPhone build was not inspected.

This Mac already has ignored `apps/mobile/ios` files. The installed Expo CLI only prebuilds when the native directory is absent, so changing `app.json` alone would leave the existing native version stale. Preparation synchronized only:

- `ios/LifeOS/Info.plist`: `CFBundleShortVersionString = 0.2.0`, `CFBundleVersion = 2`.
- `ios/LifeOS.xcodeproj/project.pbxproj`: Debug/Release `MARKETING_VERSION = 0.2.0`, `CURRENT_PROJECT_VERSION = 2`.

Signing, team, bundle identifier, icons, entitlements, and other settings were preserved. These generated native files remain ignored; do not force-add them. No further version synchronization is needed on this prepared Mac unless the native project or app configuration changes. Its existing Expo Constants Pod phase regenerates bundled `app.config` on each build from the mobile project root.

On another existing native checkout, or after changing the app version again, run this targeted synchronization from `apps/mobile` before building. It validates both file shapes before writing and changes only version fields; it does not regenerate native directories or install Pods:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
python3 - <<'PY'
import json, re
from pathlib import Path

config = json.loads(Path('app.json').read_text())['expo']
version, build = config['version'], config['ios']['buildNumber']
assert re.fullmatch(r'\d+\.\d+\.\d+', version)
assert re.fullmatch(r'\d+', build)
plist = Path('ios/LifeOS/Info.plist')
project = Path('ios/LifeOS.xcodeproj/project.pbxproj')
plist_text, project_text = plist.read_text(), project.read_text()
for key, value in [('CFBundleShortVersionString', version), ('CFBundleVersion', build)]:
    pattern = r'(<key>' + key + r'</key>\s*<string>)[^<]*(</string>)'
    plist_text, count = re.subn(pattern, lambda m: m[1] + value + m[2], plist_text)
    assert count == 1, key
for key, value in [('MARKETING_VERSION', version), ('CURRENT_PROJECT_VERSION', build)]:
    project_text, count = re.subn(r'(' + key + r' = )[^;]+;', lambda m: m[1] + value + ';', project_text)
    assert count == 2, key
plist.write_text(plist_text)
project.write_text(project_text)
print('Native version synchronized:', version, build)
PY
```

Expo maps the version/build fields to these Info.plist keys; the Settings footer reads `Constants.expoConfig.version` and `Constants.platform.ios.buildNumber`. The latter comes from the binary's Info.plist. Web/development labels and unavailable-build text avoid treating `expoConfig.ios.buildNumber` as installed-binary evidence. See [Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/) and [app versions](https://docs.expo.dev/build-reference/app-versions/).

### Local prerequisites checked during preparation

- Node `26.3.0`, npm `11.16.0`, Xcode `26.6` (`17F113`), and CocoaPods `1.17.0` are installed. Node 24 LTS remains the repository preference; Node 26 is supported by the documented baseline.
- The iOS workspace exists, `Podfile.lock` matches `Pods/Manifest.lock`, and the Node executable referenced by `.xcode.env.local` exists.
- Effective production-mode mobile configuration matches the Railway HTTPS URL above; both public Supabase variables are present. No credentials or tokens were printed.
- Device connection/trust, Developer Mode, and signing/provisioning validity must be confirmed during the user's build/install. Tool presence and cached artifacts do not prove those device prerequisites.

To repeat the environment check without printing values:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
NODE_ENV=production node - <<'JS'
require('@expo/env').load(process.cwd(), { silent: true });
const expected = 'https://lifeosapi-production-0362.up.railway.app';
if (process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') !== expected) {
  throw new Error('Mobile API endpoint does not match documented Railway HTTPS service');
}
for (const key of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY']) {
  if (!process.env[key]) throw new Error(`${key} is missing`);
}
console.log('Railway endpoint matches; public Supabase configuration is present.');
JS
```

### Physical-iPhone acceptance for v0.2.0

- [ ] Settings shows `גרסה 0.2.0 · בנייה 2`; confirm the footer is readable in Hebrew/RTL.
- [ ] With Metro/local API stopped and the Mac disconnected, relaunch over cellular; authenticate and verify Today hydration and persisted data.
- [ ] Save/reopen Day Window, test an overnight pair and clearing, then confirm persistence after restart/logout-login. A server-update-required notice is not a successful save.
- [ ] Today shows actual Task time, discloses missing estimates, keeps Commitments separate, and has no fixture/Weekly Focus items masquerading as Tasks (#8).
- [ ] Today inline Add Task defaults to Today; global capture defaults to Inbox. Follow one Task through Inbox → Today/Week → Active → Completed without duplication.
- [ ] Week expands/collapses remaining Tasks with working scheduling controls; day counts/durations agree with actual Tasks.
- [ ] Weekly Focus opens the current account/week data, saves/reopens, cancels without saving, clears, and retains edits for retry on a failed save; no fixture wizard appears in authenticated use.

Record results against this installed version/build. Keep #8 open in Verify until its required acceptance is complete. #3's full planning lifecycle and #4's broader week navigation/day-detail behavior remain incomplete and open in In Progress even if these checks pass.

The historical standalone test on 2026-08-20 used the installed Release build with Metro stopped, the local API stopped, the Mac disconnected, and the iPhone on cellular networking. Normal use therefore does not require the Mac, Metro, or a LAN-hosted API. Repeat that acceptance for v0.2.0.

## Distribution limitation

The current build is signed through the existing Apple Personal Team/development setup and is intended for internal use on registered devices. “Standalone” means the installed application can operate without development infrastructure; it does not mean the application has been released through TestFlight or the App Store.

Later TestFlight or App Store distribution will require an appropriate paid Apple Developer Program membership, App Store Connect application and signing/provisioning configuration, production release metadata and privacy declarations, archive/upload validation, and the applicable TestFlight review or App Review process. Those distribution steps are not complete in Phase 8.

## Day Window rollout prerequisite

Issue #7 adds nullable `day_start_time` and `day_end_time` columns and compatible Settings API fields. The user previously reported that the Day Window migration was applied and browser checks passed. This is user-reported evidence; release preparation did not rerun production migrations, deploy the API, or independently re-audit the remote schema. Do not reapply the migration as part of the mobile rebuild.

For a target environment that has not received this change, the required rollout order remains:

1. Apply `20260906120000_add_user_settings_day_window.sql` to the target database.
2. Deploy the compatible API. It returns both fields (including `null`), preserves them when an older client omits both, and accepts explicit clearing only when both are `null`.
3. Publish or install the updated client.

Do not reverse steps 1 and 2. A local Expo Web refresh only loads local frontend code; it does not deploy the local API to Railway or apply the Supabase migration. Until the Railway API response includes both Day Window fields, the updated client shows a non-destructive “server update required” state and does not claim an account save.

Day Window itself adds no native dependency. Under the existing standalone Release delivery path, its JavaScript changes still require building/installing a new app after the database/API prerequisites are live. v0.2.0 also changes native version/build metadata as described above.
