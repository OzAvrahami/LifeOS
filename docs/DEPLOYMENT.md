# LifeOS Deployment

LifeOS 0.2.1/build 3 is installed and **owner-accepted through the standalone internal iPhone delivery path** for #11/#12/#13. On 2026-09-08, after manually committing/pushing preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, the owner built/installed, confirmed the displayed version/build, and replied "מאשר הכל" — "I approve everything." Standalone cellular opening/data loading without Mac/Metro and tested commitment/task save/app-reopen persistence were approved. See [the acceptance record](release-0.2.1-verification.md) for the precise scope and prior automated evidence.

This is owner-reported acceptance, not independent device observation, binary-SHA extraction, or a new instrumented database/history/RLS/accessibility audit. No direct Railway active-deployment inspection was performed. No tag, GitHub Release, TestFlight, or App Store publication was created here; v0.1.1 remains the latest GitHub Release, rechecked during publication preparation. No remote v0.2.0/v0.2.1 tag or Release exists. Older unrelated acceptance checks remain outstanding. This finalization changes documentation/workflow only.

The acceptance-documentation checkpoint is complete in pushed commit `17123893b8d10f87278a71871f330d8141bce275`. Only the final publication-documentation approval/commit remains before the owner manually creates v0.2.1 at that final commit and publishes a normal, non-prerelease Release marked Latest. See [the publication handoff](release-0.2.1-verification.md#owner-publication-settings-and-stop-point). Codex must not create a tag or GitHub Release, including a draft. No binary attachment or further app build is required for this documentation release.

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

### Historical deployment evidence checked during preparation on 2026-09-08

Local HEAD and remote `main` both matched `544cde042a83684bc389d903ef17f51adee8af2f` (#13, containing #11/#12). GitHub commit context `LifeOS - @lifeos/api` reports success at `2026-09-08T06:55:17Z`, linking Railway deployment `88584cb4-e0a1-4b79-86b1-396f55ff0017`. GitHub deployment `6322298644` for that SHA and `LifeOS / production` reports success at `06:55:20Z`; it is the newest deployment returned by the repository deployment listing. Read-only `GET /health` from this Mac returned HTTP 200 with exactly `{"service":"lifeos-api","status":"ok"}`.

No Railway CLI/provider session or provider credential was available. The evidence is GitHub's recorded successful deployment plus current public health, not independent inspection of the currently active Railway deployment. Health does not identify its commit and does not prove database writes or task-history preservation. No production mutation, deployment, rollback, setting change, or migration was performed. The owner later accepted the tested on-device save/reopen persistence flow; internal history/ID/RLS invariants still rely on prior automated evidence, not a newly instrumented production test.

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

## Standalone iPhone Release build — reference for future authorized updates

Run Expo commands from `apps/mobile`, where this monorepo's Expo configuration lives. On the prepared Mac, connect and unlock the registered iPhone, with Developer Mode enabled and the existing Apple development team available in Xcode. The owner reports completing this delivery path after the preparation commit for 0.2.1/build 3. For a future separately authorized update, after its manual Git checkpoint, build/install with:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
NODE_ENV=production npx --no-install expo run:ios --device --configuration Release
```

Select the intended physical iPhone when prompted. This command compiles, signs, and installs the Release app; it was not run by the assistant during preparation or acceptance finalization. The later build/install was performed by the owner. The iOS bundle identifier remains `il.co.ozavrahami.lifeos`, with the existing automatic Apple Development signing/team configuration.

The installed standalone Release app contains its JavaScript and native metadata. It needs a new build/install to receive these changes. A development refresh or git push does not update that installed binary. There is no EAS Update or other over-the-air delivery configured for this path.

### Native version synchronization — historical 0.2.1 preparation

`apps/mobile/app.json` now specifies version `0.2.1` and `ios.buildNumber: "3"`. Before this preparation, app configuration, native Info.plist, Debug/Release project settings, and the cached Release artifact used `0.2.0 (2)`; cached Debug was `0.1.0 (1)`. No local archives or evidence of build 3 were found. Build 3 is greater than all relevant available build evidence. The registered iPhone was unavailable, so its installed metadata was not inspected; cached artifacts do not establish what is installed.

This Mac already has ignored `apps/mobile/ios` files. The installed Expo CLI only prebuilds when the native directory is absent, so changing `app.json` alone would leave the existing native version stale. Preparation synchronized only:

- `ios/LifeOS/Info.plist`: `CFBundleShortVersionString = 0.2.1`, `CFBundleVersion = 3`.
- `ios/LifeOS.xcodeproj/project.pbxproj`: Debug/Release `MARKETING_VERSION = 0.2.1`, `CURRENT_PROJECT_VERSION = 3`.

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

### Historical local prerequisites checked during preparation on 2026-09-08

- Node `26.3.0`, npm `11.16.0`, Xcode `26.6` (`17F113`), and CocoaPods `1.17.0` are installed. Node 24 LTS remains the repository preference; Node 26 is supported by the documented baseline.
- Xcode lists the existing `LifeOS` workspace/scheme. `Podfile.lock` matches `Pods/Manifest.lock`; `.xcode.env.local` references the existing Node 26.3.0 executable. The existing automatic signing team is unchanged and one valid Apple Development signing identity is available. No certificate/provisioning material was exported.
- Installed Expo CLI `57.0.16` supports `--device --configuration Release`; its source selects production environment loading for Release and does not regenerate an existing iOS directory. The ordinary authenticated product routes are selected in Release because preview routes require `__DEV__`.
- Effective production-mode native configuration matches the Railway HTTPS URL above; both public Supabase variables are present and the Supabase URL uses HTTPS. No localhost/LAN override is selected. The existing shared API client has no platform-specific native override, and configuration is static `app.json`. Environment files remain ignored, untracked, and unchanged; no API override was applied.
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

### Physical-iPhone acceptance for v0.2.1/build 3 — evidence reconciliation

The completed items below are owner-reported on 2026-09-08, separate from historical automated checks. No broader audit is inferred.

- [x] Installed app displays version `0.2.1`, build `3`; no independent inspection of both footer locations or binary source SHA.
- [x] Ordinary standalone opening/data loading without the Mac/Metro over cellular; no new instrumented authentication trace.
- [x] #11: visible hour/minute controls, 09:17 without premature dismissal, confirm/reopen/cancel, optional-end set/clear, and tested save/app-reopen retention.
- [x] #12: blank-space dismissal without form closure/text loss, one-tap date/time activation, and requested text-field/description interactions.
- [x] #13: planning-date selection and visible placement, a distant date, cancellation, a disposable-task move without visible duplication, and selected-date retention after saving/reopening the app. Prior automated/preview evidence separately covers title-only Inbox capture and shared entry points.
- [ ] New instrumented inspection of internal task IDs, unrelated fields, deadlines, status/history, and RLS in the live installed flow — not performed; existing automated tests remain evidence for these invariants.
- [ ] Full accessibility/VoiceOver and physical device-timezone/near-midnight matrix — not reported as performed.

The following older unrelated acceptance items retain their prior status and are not covered by this approval:

- [ ] Save/reopen Day Window, test an overnight pair and clearing, then confirm persistence after restart/logout-login. A server-update-required notice is not a successful save.
- [ ] Today shows actual Task time, discloses missing estimates, keeps Commitments separate, and has no fixture/Weekly Focus items masquerading as Tasks (#8).
- [ ] Today inline Add Task defaults to Today; global capture defaults to Inbox. Follow one Task through Inbox → Today/Week → Active → Completed without duplication.
- [ ] Week expands/collapses remaining Tasks with working scheduling controls; day counts/durations agree with actual Tasks.
- [ ] Weekly Focus opens the current account/week data, saves/reopens, cancels without saving, clears, and retains edits for retry on a failed save; no fixture wizard appears in authenticated use.

The owner-approved #11/#12/#13 flows are complete; the issues are Closed/Completed and their existing Project items were read back as Done with priorities preserved. The specialized and older unchecked items above must not be represented as completed by that approval. Keep #8 open in Verify until its required acceptance is complete. #3's full planning lifecycle and #4's broader week navigation/day-detail behavior remain incomplete and open in In Progress even if these checks pass.

The historical standalone test on 2026-08-20 used the installed Release build with Metro stopped, the local API stopped, the Mac disconnected, and the iPhone on cellular networking. Normal use therefore does not require the Mac, Metro, or a LAN-hosted API. The owner separately reports that standalone cellular opening/data loading passed for 0.2.1/build 3 on 2026-09-08.

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

Day Window itself adds no native dependency. Under the existing standalone Release delivery path, its JavaScript changes still require building/installing a new app after the database/API prerequisites are live. The historical v0.2.0 preparation changed native metadata; the current v0.2.1/build 3 preparation advances it as described above.
