# LifeOS Deployment

## Notifications candidate — Issue #1, 2026-09-22

Active candidate: **LifeOS 0.4.0 (7)**, unpublished, not installed or owner-accepted. Build 5 installed but failed native scene startup and was never accepted. Build 6 installed/launched successfully with UIScene support; it was superseded during acceptance after Task reminder discoverability and missing Commitment reminders were identified, **not a failed build**.

Build 7 adds shared Task Details entry points and relative Commitment reminders/settings. New forward migration [`20260922120000_add_commitment_reminders.sql`](../supabase/migrations/20260922120000_add_commitment_reminders.sql) follows `20260914120000`: nullable commitment lead 0–1440; category default false and default lead 15 on user settings. Existing IDs, null reminders, RLS and old-client settings are preserved. All 13 disposable local PostgreSQL/Auth/RLS verification groups pass; **no remote application has occurred for the new migration**.

**Required rollout:** local owner Git checkpoint → `npx supabase migration list --linked` → inspect every pending migration and `npx supabase db push --linked --dry-run` → separately authorized `npx supabase db push --linked` → verify remote history → API push/deployment success → authorized build/install 0.4.0 (7) → physical owner acceptance. These commands are later owner-controlled steps, not operations performed by this preparation. Hold deployment-triggering push until the schema exists. Older build-6 remote history/API health evidence does not establish readiness for this new schema.

Native plist and Debug/Release settings now read **0.4.0 / 7**. Only build metadata changed; Expo scene lifecycle, signing, entitlements and Pods are preserved. A metadata backup was made outside the repository; no regeneration/pod installation was needed. Signed Xcode 27 Release compilation succeeded, but the artifact was not installed/launched. See [current results and device checklist](issue-1-verification.md).

### Historical build-6 scene reconciliation procedure

The following dependency/native reconciliation was performed for build 6; do not repeat it for build 7's metadata-only native change.

[Expo's SDK 57 remediation](https://github.com/expo/expo/issues/46664) requires Expo >=57.0.23, build-properties >=57.0.20, and `ios.enableSceneSupport: true`. This checkout pins those minimums, retains React Native 0.86.2 / Notifications 57.0.12, and uses the normal internal Release path. The online dependency checker still recommends newer patches; see [the exact advisory and native verification](issue-1-verification.md#xcode-27-launch-correction--2026-09-22).

Before native reconciliation, back up the entire ignored iOS directory outside the repository and snapshot signing, entitlements, schemes and version fields. The current backup is `/tmp/lifeos-ios-before-scene-support-dwd1lc5w/ios`. **Run prebuild from `apps/mobile`, never repository root, and use explicit `--no-clean`**: this CLI regenerates by default. The initial default attempt was replaced by restoring the complete backup before the preserving run.

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
CI=1 npx --no-install expo prebuild --platform ios --no-clean --no-install --skip-dependency-update react,react-native
```

Inspect generated changes against the backup. Info.plist must name `EXExpoAppSceneDelegate`; AppDelegate must adopt `ExpoReactNativeFactoryProvider` and relinquish legacy window startup. Retain generated scene changes, synchronize all four version/build fields, and preserve signing. Expo's implicit notifications plugin may add `aps-environment` despite no explicit plugin entry: this local-only app must retain its original entitlements. In this reconciliation, the added APNs key was the only entitlement difference and the exact original entitlement file was restored. Do not enable remote background notification mode or add push infrastructure.

Run normal `pod install` from `apps/mobile/ios`. Here stale local podspec locks required the targeted command `pod update Expo ExpoModulesCore ExpoModulesWorklets ExpoFileSystem ExpoFont ExpoAsset EXConstants --no-repo-update`; it installed 110 pods, retaining ExpoNotifications 57.0.12 and React-Core 0.86.2. Validate lock/manifest equality and iOS autolinking before Release compilation. Keep all native files ignored. Do not restore the old AppDelegate/Info.plist over the scene fix.

See [Issue #1 verification](issue-1-verification.md) for the build/launch outcome and pending physical checklist. Accepted/published 0.3.0 history below remains accurate.

**Historical 0.2.1 acceptance:** LifeOS 0.2.1/build 3 was installed and **owner-accepted through the standalone internal iPhone delivery path** for #11/#12/#13. On 2026-09-08, after manually committing/pushing preparation `2aa6bc4a246a06efc31a6c7753b1ad9f51b8a102`, the owner built/installed, confirmed the displayed version/build, and replied "מאשר הכל" — "I approve everything." Standalone cellular opening/data loading without Mac/Metro and tested commitment/task save/app-reopen persistence were approved. See [the acceptance record](release-0.2.1-verification.md) for the precise scope and prior automated evidence.

This is owner-reported acceptance, not independent device observation, binary-SHA extraction, or a new instrumented database/history/RLS/accessibility audit. No direct Railway active-deployment inspection was performed. Older unrelated acceptance checks remain outstanding. This is internal iPhone delivery, not TestFlight or App Store distribution.

The preparation, acceptance-documentation (`1712389`), and final publication-documentation checkpoints are complete. [LifeOS v0.2.1 — Planning fixes](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.2.1) was published on 2026-09-08 at 09:19:03 UTC as Latest, non-draft, non-prerelease; v0.3.0 superseded it as Latest on 2026-09-13. Its annotated tag resolves to `93fde4306132f2301f5e2b02c3c374f5c203a1cd`. Later documentation changes do not alter this release source. See [the publication record](release-0.2.1-verification.md#current-publication-and-workflow--2026-09-08). No further build or binary attachment was required for that workflow reconciliation. The later #3/#4 implementations were subsequently owner-accepted on 0.3.0 (4), as recorded below; 0.2.1 remains separate historical acceptance evidence.

## Last owner-accepted internal build — LifeOS 0.3.0 (4)

**Installed and owner-accepted on 2026-09-13.** The owner confirmed the remaining #3/#4 physical-iPhone scenarios were satisfactory and the installed app visibly reports 0.3.0 (4), from preparation baseline `e1a3470`. Both issues are Closed / Completed / Done / P1 — High. Acceptance is owner-reported; Codex did not observe the device or extract its source SHA. Production migration `20260913120000` and candidate Railway API deployment were already verified before the test, per the owner's handoff; this finalization performs no production mutations or rebuild.

[LifeOS v0.3.0 — Weekly planning and week navigation](https://github.com/OzAvrahami/LifeOS/releases/tag/v0.3.0) is **published and Latest** as of **2026-09-13T19:24:14Z**, non-draft and non-prerelease. Annotated tag target: `cefd84a6d8e21c631bc666d49d20ac91ccce2657`, the final owner-acceptance checkpoint. Later documentation commits do not move this tag. No publication action remains and no App Store/TestFlight release occurred. See [current acceptance](release-0.3.0-verification.md). The [Mobile Version / Build Policy](DEVELOPMENT_WORKFLOW.md#mobile-version--build-policy) still applies to any future new binary; do not bump/rebuild accepted 0.3.0 (4) to record approval.

## Weekly Planning lifecycle rollout — Issue #3, 2026-09-13

**Satisfied before physical acceptance, per owner confirmation:** migration `20260913120000` applied remotely and candidate API deployment succeeded. The following is the historical preparation snapshot; its unverified-rollout and pending-device statements are superseded by the accepted state above, not instructions to repeat rollout.

The unreleased #3 implementation requires the seventh forward migration, `20260913120000_add_weekly_planning_lifecycle.sql`, and the updated planning API. It extends existing WeekPlan owners without replacing IDs/focuses or changing #4 navigation behavior. Legacy rows start as `not_started`, not completed. Local PostgreSQL/Auth/RLS verification passed on an independent rerun on 2026-09-13: exit 0, all 11 PASS groups, including the lifecycle checks. The existing owner-prepared local schema was reused; local migration history includes `20260913120000`. No database reset, migration application, production operation, or deployment occurred in this follow-up.

The local integration gate is complete and #3 is Open / Verify. The owner has already pushed implementation `286cec4`; this preparation did not inspect linked production migration history or establish the active API deployment. Before building 0.3.0 (4), confirm the required schema and compatible API are actually deployed. For future schema-dependent changes, follow [the canonical ordering](DEVELOPMENT_WORKFLOW.md#database--api-rollout): local commit checkpoint, inspect linked pending migrations/dry run, explicitly authorized schema application, verify history, then push/deploy API code. See [the exact migration commands](issue-3-verification.md#required-database-verification-and-rollout); do not infer rollout from a pushed commit or local integration pass. The test process used the existing OrbStack Docker executable through a temporary PATH addition; no persistent environment file changed. An older API/schema produces a visible planning error rather than an invented not-started state. Device acceptance waits for the schema/API and a build containing #3; installed 0.2.1 is not evidence for this new lifecycle. This preparation changes candidate version/build metadata only; production and published release settings are unchanged.

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

Run Expo commands from `apps/mobile`, where this monorepo's Expo configuration lives. On the prepared Mac, connect and unlock the registered iPhone, with Developer Mode enabled and the existing Apple development team available in Xcode. The owner reports completing this delivery path after the preparation commit for 0.2.1/build 3. For a future separately authorized update, first complete the mandatory [pre-device gate](DEVELOPMENT_WORKFLOW.md#mandatory-pre-device-gate): review SemVer/build and last accepted binary, synchronize native metadata, verify schema/API and Release environment/signing prerequisites, and complete the owner Git checkpoint. **Do not run the following command during 0.3.0 (4) preparation.** Only after those gates and owner build authorization, build/install with:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
NODE_ENV=production npx --no-install expo run:ios --device --configuration Release
```

Select the intended physical iPhone when prompted. This command compiles, signs, and installs the Release app; it was not run by the assistant during preparation or acceptance finalization. The later build/install was performed by the owner. The iOS bundle identifier remains `il.co.ozavrahami.lifeos`, with the existing automatic Apple Development signing/team configuration.

The installed standalone Release app contains its JavaScript and native metadata. It needs a new build/install to receive these changes. A development refresh or git push does not update that installed binary. There is no EAS Update or other over-the-air delivery configured for this path.

### Native version synchronization — existing iOS project

**Historical 0.2.1 preparation:** `apps/mobile/app.json` was set to version `0.2.1` and `ios.buildNumber: "3"`. Before that preparation, app configuration, native Info.plist, Debug/Release project settings, and the cached Release artifact used `0.2.0 (2)`; cached Debug was `0.1.0 (1)`. No local archives or evidence of build 3 were found. Build 3 is greater than all relevant available build evidence. The registered iPhone was unavailable, so its installed metadata was not inspected; cached artifacts do not establish what is installed.

This Mac already has ignored `apps/mobile/ios` files. The installed Expo CLI only prebuilds when the native directory is absent, so changing `app.json` alone would leave the existing native version stale. Preparation synchronized only:

- `ios/LifeOS/Info.plist`: `CFBundleShortVersionString = 0.2.1`, `CFBundleVersion = 3`.
- `ios/LifeOS.xcodeproj/project.pbxproj`: Debug/Release `MARKETING_VERSION = 0.2.1`, `CURRENT_PROJECT_VERSION = 3`.

Signing, team, bundle identifier, icons, entitlements, and other settings were preserved. These generated native files remain ignored; do not force-add them. Those values describe the historical 0.2.1 preparation. The current candidate has since synchronized the same fields to **0.4.0 / 7**. Recheck the actual native project before every build; historical synchronization is not a permanent guarantee. Its existing Expo Constants Pod phase regenerates bundled `app.config` on each build from the mobile project root.

On another existing native checkout, or after changing the app version again, run this targeted synchronization from `apps/mobile` before building. It validates both file shapes before writing and changes only version fields; it does not regenerate native directories or install Pods:

```bash
cd /Users/ozavrahami/code/lifeOS/apps/mobile
python3 - <<'PY'
import json, plistlib, re, subprocess
from pathlib import Path

config = json.loads(Path('app.json').read_text())['expo']
version, build = config['version'], config['ios']['buildNumber']
assert re.fullmatch(r'\d+\.\d+\.\d+', version)
assert re.fullmatch(r'\d+', build)
plist = Path('ios/LifeOS/Info.plist')
project = Path('ios/LifeOS.xcodeproj/project.pbxproj')
for path in [plist, project]:
    subprocess.run(['plutil', '-lint', str(path)], check=True)
original_plist = plistlib.loads(plist.read_bytes())
original_project = json.loads(subprocess.check_output(['plutil', '-convert', 'json', '-o', '-', str(project)]))
assert int(build) >= int(original_plist['CFBundleVersion']), 'Do not lower native build'
assert tuple(map(int, version.split('.'))) >= tuple(map(int, original_plist['CFBundleShortVersionString'].split('.'))), 'Do not lower native version'
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
for path in [plist, project]:
    subprocess.run(['plutil', '-lint', str(path)], check=True)
original_plist.update(CFBundleShortVersionString=version, CFBundleVersion=build)
assert plistlib.loads(plist.read_bytes()) == original_plist
for obj in original_project['objects'].values():
    settings = obj.get('buildSettings', {})
    if 'MARKETING_VERSION' in settings:
        settings.update(MARKETING_VERSION=version, CURRENT_PROJECT_VERSION=build)
assert json.loads(subprocess.check_output(['plutil', '-convert', 'json', '-o', '-', str(project)])) == original_project
print('Info.plist and Debug/Release native versions verified:', version, build)
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

### Remaining targeted owner checks

**Historical #4 implementation handoff — 2026-09-10:** Use [the Week/day owner checklist](issue-4-verification.md#physical-iphone-owner-checklist) after the owner’s Git checkpoint and a build containing #4. No device build, installation, version change, or production-data operation was performed during implementation.

**Historical checklist — 2026-09-08:** The following was the pending checklist at reconciliation. Live #7/#8/#10 are now Closed/Completed/Done, and the owner identifies these behaviors as accepted. These older unchecked items are retained as historical scope, not a request to repeat accepted tests. No suitable known-estimate fixture set was established by that reconciliation.

- [ ] #7: Save/reopen same-day, overnight (for example 06:30→00:00), and cleared Day Windows; confirm persistence after restart/logout-login and understandable RTL copy. Today task-time presentation remains independent of the window. A server-update-required notice is not a successful save.
- [ ] #7/#8: Today shows actual Task time, discloses missing estimates, and keeps Commitments separate. Inspect authenticated empty and populated Today for fabricated weekly-task suggestions; confirm exclusion survives restart/logout-login. The discovered #8 source was hardcoded preview content, not an orphaned database record.
- [ ] #10: Reconcile known disposable Task dates/statuses/estimates with Week counts/totals and freshness after supported changes, restart, and logout/login. Week includes open/in-progress Tasks only; absent estimates add no invented time. A known set of 45m, 30m, and no estimate should show three active Tasks / 1:15. Current UI lacks duration editing and complete day inspection; if suitable known-estimate records are unavailable, approved fixture preparation is a separate prerequisite. Retain automated coverage for unsupported mutation paths; #4’s future day-detail UI does not block this fix.

Restart/logout-login can be consolidated across these checks. No already accepted #11–#13 interaction needs repetition.

The following older slice checks also retain their prior status; they do not complete #3/#4’s broader scope:

- [ ] Today inline Add Task defaults to Today; global capture defaults to Inbox. Follow one Task through Inbox → Today/Week → Active → Completed without duplication. This historical combined checklist is not a request to repeat steps already covered by specific accepted evidence.
- [ ] Week expands/collapses remaining week-only Tasks; working scheduling controls retain their existing evidence. The specific day-count/duration gate is listed under #10 above.
- [ ] Weekly Focus opens the current account/week data, saves/reopens, cancels without saving, clears, and retains edits for retry on a failed save; no fixture wizard appears in authenticated use.

The owner-approved #11/#12/#13 flows remain complete. #7/#8/#10 also remain Closed/Completed/Done as found before #4 implementation; no unrelated issue state or priority was changed. #3 remains Open / Ready for its unfinished full planning lifecycle. #4’s software scope and pending physical acceptance are documented in [its verification record](issue-4-verification.md). See [Implementation Status](IMPLEMENTATION_STATUS.md) for current work and #6’s unchanged pending disposition.

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

Day Window itself adds no native dependency. Under the existing standalone Release delivery path, its JavaScript changes still require building/installing a new app after the database/API prerequisites are live. The historical v0.2.0 and v0.2.1 preparations changed native metadata; the current 0.4.0/build 7 candidate advances it as described above.
