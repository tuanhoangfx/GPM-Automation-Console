# Release Guide

Release and update process for `GPM Automation Console`.

The desktop app is packaged with Electron Builder as a Windows NSIS web installer. Public GitHub Releases are used as the install payload host and update feed for `electron-updater`.

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
