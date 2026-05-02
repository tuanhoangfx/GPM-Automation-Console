# Release Guide

Release and update process for `GPM Automation Console`.

The desktop app is packaged with Electron Builder as a Windows NSIS web installer. Public GitHub Releases are used as the install payload host and update feed for `electron-updater`.

## 2026-05-03 - Desktop Runtime Update

- Version: `0.2.22`
- Timestamp: 2026-05-03 04:23 (UTC+7)
- Commit: `14a31d9`
- Type: Feature/Fix
- Status: Verified

### Changes

- Feature areas touched: App Core (2), Desktop Runtime (1), UI (1).
- Improved app core, desktop runtime, ui in this release.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-03 - Internal Maintenance

- Version: `0.2.21`
- Timestamp: 2026-05-03 04:05 (UTC+7)
- Commit: `1bc7be3`
- Type: Maintenance/Internal
- Status: Verified

### Changes

- Feature areas touched: none (internal-only update).
- No end-user behavior changes in this release (internal maintenance only).

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-03 - Internal Maintenance

- Version: `0.2.20`
- Timestamp: 2026-05-03 04:00 (UTC+7)
- Commit: `2fedad2`
- Type: Maintenance/Internal
- Status: Verified

### Changes

- Feature areas touched: none (internal-only update).
- No end-user behavior changes in this release (internal maintenance only).

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-03 - Internal Maintenance

- Version: `0.2.19`
- Timestamp: 2026-05-03 03:27 (UTC+7)
- Commit: `0ce0251`
- Type: Maintenance/Internal
- Status: Verified

### Changes

- Feature areas touched: none (internal-only update).
- Restored theme and overlay infrastructure so popovers and dialogs render reliably with correct dark/light styling.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-03 - Release Log Parsing Logic Update

- Version: `0.2.18`
- Timestamp: 2026-05-03 03:14 (UTC+7)
- Commit: `f1ff5da`
- Type: Feature/Fix
- Status: Verified

### Changes

- Feature areas touched: App Core (4), Profiles (2), UI (1).
- Refactored workflow runtime in `src/App.tsx` to route execution through action executors and support non-URL actions cleanly.
- Updated `src/features/profiles/profile-utils.ts` with behavior changes included in this release.
- Updated `src/features/profiles/useProfiles.ts` with behavior changes included in this release.
- Updated `src/features/workflows/useWorkflows.ts` with behavior changes included in this release.
- Updated `src/main.tsx` with behavior changes included in this release.
- Additional updated files related to this release: +3.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-03 - Internal Maintenance

- Version: `0.2.17`
- Timestamp: 2026-05-03 00:53 (UTC+7)
- Commit: `9a53b7b`
- Type: Maintenance/Internal
- Status: Verified

### Changes

- Feature areas touched: none (internal-only update).
- No end-user feature or UI behavior changes in this release (internal tooling/release maintenance only).


### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-03 - Internal Maintenance

- Version: `0.2.16`
- Timestamp: 2026-05-03 00:49 (UTC+7)
- Commit: `5d2bc42`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- No end-user feature or UI behavior changes in this release (internal tooling/release maintenance only).


### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-02 - Workflow Execution Logic Update 0.2.15

- Version: `0.2.15`
- Timestamp: 2026-05-02 23:42 (UTC+7)
- Commit: `4ac592e`
- Type: Feature/Fix
- Status: Verified

### Changes

- Bumped release version to `0.2.15`.
- Extracted workflow execution by `workflow.action` into `src/features/workflows/workflow-executors.ts` so action logic is modular and easier to test.
- Updated `src/App.tsx` to delegate runtime execution through the executor layer and support action-only workflows without fake URL values.
- Added profile patch helper `updateProfile` in `src/api.ts` for workflow-driven profile updates.
- Refined runtime layout in `src/styles.css`: Run History and Console now split 50/50, with smaller run-history status dots for denser display.
- Expanded `set-screen-resolution-real` action payload compatibility to target GPM API field variations for screen-resolution updates.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-05-02 - Expanded Dynamic Dot Palette 0.2.14

- Version: `0.2.14`
- Timestamp: 2026-05-02 01:18 (UTC+7)
- Commit: pending
- Type: UI/Visual
- Status: Verified

### Changes

- Bumped release version to `0.2.14`.
- Expanded dynamic dropdown dot palette from 6 colors to 12 colors for better visual diversity.
- Switched dot assignment strategy from index-based to seed-hash mapping so values keep stable color identity across renders while reducing repetitive color collisions in long lists.
- Synced the same expanded dot palette into workspace standards baseline CSS.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-02 - Dot Markers for Dynamic Dropdown Data 0.2.13

- Version: `0.2.13`
- Timestamp: 2026-05-02 01:16 (UTC+7)
- Commit: pending
- Type: UI/Consistency
- Status: Verified

### Changes

- Bumped release version to `0.2.13`.
- Added colored dot markers for dynamic dropdown values where semantic icons are not suitable:
  - applied to runtime Group and Platform option values across Profile/Workflow/Scripts filter dropdowns
  - preserved semantic icons for stable meanings (`All`, `Status`, `Ready`, `Opening`, `Running`, `Failed`).
- Updated workspace standards to include the dot-marker fallback rule and canonical dot marker style tokens.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - Dropdown Standard Push to Rules + Full Rollout 0.2.12

- Version: `0.2.12`
- Timestamp: 2026-05-01 20:26 (UTC+7)
- Commit: pending
- Type: UI/Standardization
- Status: Verified

### Changes

- Bumped release version to `0.2.12`.
- Pushed current GPM dropdown contract into workspace standards:
  - updated `E:\Dev\Rules\standards\Workspace_Design_Standard.md` with canonical fallback/reset/icon semantics
  - updated `E:\Dev\Rules\standards\workspace-design-base.css` with canonical dropdown class contract (`smart-dropdown*`, `dropdown-*`).
- Pulled the same dropdown contract across other GPM dropdown filter areas (Workflow/Scripts):
  - default trigger labels now use filter names (`Group`, `Platform`)
  - filter reset option remains `All`
  - added `platform` tone + icon mapping and matching style tokens for trigger/options.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - All Option Icon Update 0.2.11

- Version: `0.2.11`
- Timestamp: 2026-05-01 20:23 (UTC+7)
- Commit: pending
- Type: UI/Consistency
- Status: Verified

### Changes

- Bumped release version to `0.2.11`.
- Replaced the dropdown reset option icon (`All`) from filter-style icon to a global-style icon for clearer semantics and to avoid confusion with filter controls.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - Dropdown Reset Option Label to All 0.2.10

- Version: `0.2.10`
- Timestamp: 2026-05-01 20:21 (UTC+7)
- Commit: pending
- Type: UI/Consistency
- Status: Verified

### Changes

- Bumped release version to `0.2.10`.
- Updated shared dropdown reset option label from context name (`Status`/`Group`) to a neutral `All`.
- Kept the visual `all` marker icon in the reset option for clear "all options" semantics.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - Status Dropdown Default Label Sync 0.2.9

- Version: `0.2.9`
- Timestamp: 2026-05-01 20:18 (UTC+7)
- Commit: pending
- Type: UI/Consistency
- Status: Verified

### Changes

- Bumped release version to `0.2.9`.
- Updated status filter dropdown default display to match table column naming:
  - trigger fallback label changed from `All statuses` to `Status`
  - default icon tone changed from generic `all` to `status`.
- Added `status` tone support for dropdown trigger and option marker styling to keep visual parity with status semantics.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - Status Icon Sync + Group Dropdown Default 0.2.8

- Version: `0.2.8`
- Timestamp: 2026-05-01 20:10 (UTC+7)
- Commit: pending
- Type: UI/Consistency
- Status: Verified

### Changes

- Bumped release version to `0.2.8`.
- Synced Profile table status cell visuals with the status dropdown icon set:
  - `Ready` -> check-circle icon
  - `Opening` -> refresh icon
  - `Running` -> play icon
  - `Failed` -> x-circle icon
- Removed old status-dot pseudo marker in table rows and aligned status color mapping to the dropdown semantics.
- Updated Group dropdown default trigger label to match table naming (`Group`) and show the group icon in the trigger/menu default state.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - YTB Dropdown Parity for Profile Filters 0.2.7

- Version: `0.2.7`
- Timestamp: 2026-05-01 20:06 (UTC+7)
- Commit: pending
- Type: Feature/UI
- Status: Verified

### Changes

- Bumped release version to `0.2.7`.
- Standardized Profiles filter dropdown behavior to match YTB `SmartFilterDropdown` contract:
  - trigger label wrapper + status tone markers
  - chevron placement and open-state rotation
  - adaptive menu sizing and compact search field behavior
  - option marker icons and selected check icon rendering
  - rounded selected checkbox style and normalized option density.
- Kept GPM dropdown typography unchanged as requested (font family/size/weight behavior retained).
- Updated workspace standards to lock dropdown parity requirements:
  - `Workspace_Design_Standard.md` now includes shared dropdown contract and parity checklist item
  - `workspace-design-base.css` updated filter-row alias to three columns for table search + two dropdown filters.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-05-01 - Profile Filter + Dropdown Standardization 0.2.6

- Version: `0.2.6`
- Timestamp: 2026-05-01 19:58 (UTC+7)
- Commit: pending
- Type: Feature/UI
- Status: Verified

### Changes

- Bumped release version to `0.2.6`.
- Added status filtering for the Profiles table (`Ready`, `Opening`, `Running`, `Failed`) with multi-select support.
- Updated profile filter behavior to include status in the paging reset trigger and filtering pipeline.
- Standardized GPM dropdown styling to match workspace standards:
  - compact trigger/input height (`32px`)
  - adaptive menu width (`max(100%, 180px)`, capped at `240px`)
  - open-state chevron rotation.
- Updated profile filter header layout to three columns (`search + group + status`) following the standardized filter-row pattern.

### Verification

```powershell
pnpm build
```

Result: passed.

## 2026-04-30 - Release Log Parsing Logic Update 0.2.5

- Version: `0.2.5`
- Timestamp: 2026-04-30 19:15 (UTC+7)
- Commit: `7f73ea9`
- Type: Feature/Fix
- Status: Verified

### Changes

- Bumped release version to `0.2.5`.
- Updated Git hook `.githooks/post-commit` to enforce automatic version bump and sync policy.
- Updated YTB release log parsing logic to select the highest-version source instead of taking the first candidate.
- Updated application logic in `src/features/release-log/parseVersionLogEntries.ts`.
- Updated application logic in `src/main.tsx`.
- Updated application logic in `src/styles/workspace-design-base.css`.


### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Release Automation Policy Update 0.2.4

- Version: `0.2.4`
- Timestamp: 2026-04-30 19:00 (UTC+7)
- Commit: `f5682a4`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Bumped release version to `0.2.4`.
- Updated automation script `scripts/sync-release-log.mjs` to improve release/version synchronization reliability.


### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Automation Update 0.2.3

- Version: `0.2.3`
- Timestamp: 2026-04-30 18:49 (UTC+7)
- Commit: `7eed466`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Đã tăng version release lên `0.2.3`.
- Đã cập nhật script tự động `scripts/sync-release-log.mjs` để tăng độ ổn định đồng bộ version/release.


### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Automation Update 0.2.2

- Version: `0.2.2`
- Timestamp: 2026-04-30 18:38 (UTC+7)
- Commit: `2749908`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Updated source version to `0.2.2` and synced release metadata.
- Updated `.githooks/pre-commit`.
- Updated `scripts/check-version-sync.mjs`.


### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Code Update 0.2.1

- Version: `0.2.1`
- Timestamp: 2026-04-30 18:04 (UTC+7)
- Commit: `c3090fd`
- Type: Feature/Fix
- Status: Verified

### Changes

- Updated source version to `0.2.1` and synced release metadata.
- Updated `.githooks/pre-commit`.
- Updated `.github/workflows/_reusable-verify.yml`.
- Updated `ARCHITECTURE.md`.
- Updated `CHANGELOG.md`.
- Updated `CONTRIBUTING.md`.
- Additional updated files: +11.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Code Update 0.2.0

- Version: `0.2.0`
- Timestamp: 2026-04-30 18:04 (UTC+7)
- Commit: `c3090fd`
- Type: Feature/Fix
- Status: Verified

### Changes

- Updated source version to `0.2.0` and synced release metadata.
- Updated `.githooks/pre-commit`.
- Updated `.github/workflows/_reusable-verify.yml`.
- Updated `ARCHITECTURE.md`.
- Updated `CHANGELOG.md`.
- Updated `CONTRIBUTING.md`.
- Additional updated files: +11.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Code Update 0.1.9

- Version: `0.1.9`
- Timestamp: 2026-04-30 17:42 (UTC+7)
- Commit: `c3090fd`
- Type: Feature/Fix
- Status: Verified

### Changes

- Removed prompt-based stamping artifacts and kept code-change-only release flow.
- Synced `package.json`, `tool.manifest.json`, and `RELEASE.md` to one version source.
- Updated release stamping and hook behavior to prevent version drift.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.

## 2026-04-30 - Maintenance Sync 0.1.7

- Version: `0.1.7`
- Timestamp: 2026-04-30 16:11 (UTC+7)
- Commit: `c3090fd`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Synced release metadata and release log records to the current source version/commit.
- Added local-first release controls for explicit push and version rollback safety.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.

## 2026-04-30 - Maintenance Sync 0.1.6

- Version: `0.1.6`
- Timestamp: 2026-04-30 16:08 (UTC+7)
- Commit: `c3090fd`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Synced release metadata and release log records to the current source version/commit.
- Added mandatory response version/timestamp/changes reporting rule alignment.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.

## 2026-04-30 - Maintenance Sync 0.1.5

- Version: `0.1.5`
- Timestamp: 2026-04-30 16:04 (UTC+7)
- Commit: `d70cc95`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Synced release metadata and release log records to the current source version/commit.
- Standardized project template structure, quality tooling, and reusable CI/release workflows.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.

## 2026-04-30 - Maintenance Sync 0.1.4

- Version: `0.1.4`
- Timestamp: 2026-04-30 03:27 (UTC+7)
- Commit: `7309673`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Synced release metadata and release log records to the current source version/commit.
- Automated full docs synchronization for release metadata.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.

## 2026-04-29 - Release Sync 0.1.3

- Version: `0.1.3`
- Timestamp: 2026-04-29 22:36 (UTC+7)
- Commit: `pending`
- Type: Feature/UI
- Status: Verified

### Changes

- Bumped app version from `0.1.2` to `0.1.3`.
- Improved release log parsing so the modal can map version-aware entries correctly.
- Added explicit version metadata fallback handling for safer UI rendering.

### Verification

```powershell
corepack pnpm build
```

Result: passed.

## 2026-04-26 - Workflow UI Guide And Full Profile Loading

- Version: `0.1.2`
- Timestamp: 2026-04-26 00:00 (UTC+7)
- Commit: `c27c092`
- Type: Feature/Fix
- Status: Stable

### Changes

- Added topbar guide/release log access and improved script builder button consistency.
- Synced workflow run steps with target URL and loaded all GPM profiles across API pages.
- Stabilized UI flows for scripts/profiles editing and runtime actions.

### Verification

```powershell
corepack pnpm build
corepack pnpm dist
```

Result: passed.

## 2026-04-26 - Fix Packaged Updater Runtime Dependency

- Version: `0.1.1`
- Timestamp: 2026-04-26 00:00 (UTC+7)
- Commit: `3540766`
- Type: Packaging/Fix
- Status: Stable

### Changes

- Added `ms` as a production dependency required by packaged updater runtime.
- Validated packaged dependency presence and shipped fixed installer baseline.

### Verification

```powershell
corepack pnpm build
corepack pnpm dist
```

Result: passed.

## Requirements

- Public GitHub repository with `origin` configured locally.
- GitHub token with permission to create releases and upload release assets.
- `package.json` version bumped before each release.
- `RELEASE.md` is the single source of truth for release history and rollback points.

## Local Build

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
corepack pnpm install
corepack pnpm dist
```

The local web installer, install payload, and update metadata are written to:

```text
release\nsis-web\
```

Expected Windows web installer artifacts:

```text
GPM-Automation-Console-Setup-<version>.exe
gpm-automation-console-<version>-x64.nsis.7z
latest.yml
```

The `.exe` is the small installer users download first. During installation it downloads the larger `.nsis.7z` application package from the same GitHub Release.

## Publish To GitHub Releases

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
$env:GH_TOKEN="YOUR_GITHUB_TOKEN"
corepack pnpm release
```

Electron Builder publishes to the GitHub repository configured in `package.json`.

Before the first publish, make sure `origin` points to the same public GitHub repo configured in `package.json`.

If local Git cannot push over HTTPS because `git-remote-https.exe` is missing, use the GitHub REST API with a temporary token as a fallback:

- update the `main` branch with Git Data API commits, without force-pushing;
- create a GitHub Release tag for the new version;
- upload exactly these assets from `release\nsis-web\`: setup `.exe`, `.nsis.7z`, and `latest.yml`;
- verify `/releases/latest` returns the new tag and all three assets.

Never write the token into source files or release notes. Revoke any token that was pasted into chat or logs.

## Version Checklist

Before publishing a new version:

1. Update `version` in `package.json`.
2. Add a new top entry in `RELEASE.md`.
3. Include changed files, verification, and rollback command in `RELEASE.md`.
4. Run `corepack pnpm build`.
5. Run `corepack pnpm dist` and confirm the `.exe`, `.nsis.7z`, and `latest.yml` files exist.
6. Verify the packaged app starts from `release\win-unpacked\GPM Automation Console.exe`.
7. Verify the updater runtime dependencies are included in `app.asar`.
8. Publish with `corepack pnpm release`.
9. Confirm GitHub `releases/latest` returns the new tag and includes the setup `.exe`, `.nsis.7z`, and `latest.yml`.

## Local Auto-Release Mode

This repository uses local git hooks to keep release metadata synchronized on every commit:

- `pre-commit`: runs `pnpm release:code-only-stamp` and stages `package.json`, `tool.manifest.json`, and `RELEASE.md`.
- `post-commit`: runs `pnpm release:tag-local` to create an annotated tag `v<version>` if it does not exist.
- `pre-push`: blocks push by default to enforce explicit operator confirmation for remote updates.

Hook setup command:

```powershell
corepack pnpm hooks:install
```

Explicit push command (only when intentionally approved):

```powershell
$env:ALLOW_GIT_PUSH="1"
git push origin main
git push origin --tags
```

One-command rollback by version tag:

```powershell
git reset --hard v0.1.4
```

Runtime dependency check:

```powershell
node -e "const asar=require('./node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar'); const list=asar.listPackage('release/win-unpacked/resources/app.asar'); for (const m of ['node_modules\\ms\\index.js','node_modules\\debug\\src\\node.js','node_modules\\electron-updater\\out\\main.js']) console.log(m + ': ' + list.some(x=>x.endsWith(m)))"
```

All three checks must print `true`.

## Token Rules

- Use `GH_TOKEN` only as a temporary environment variable.
- Never write GitHub tokens into source files, release notes, or documentation.
- If a token is pasted into chat or logs, revoke it immediately after use.

## Client Update Behavior

New clients run the small web installer, which downloads the application package from GitHub Releases during installation. Installed clients check GitHub Releases when the packaged app starts. If a newer version exists, the app downloads it automatically and installs it when the app restarts or quits.
