# GPM Automation Console

Local desktop app for managing and automating GPM Login profiles through the local API at `http://127.0.0.1:19995`.

For project decisions and next development direction, see `PROJECT_CONTEXT.md`.

For update history and rollback points, see `RELEASE.md`.

For packaging, GitHub Releases, and updater rules, see `RELEASE.md`.

## Current Features

- Connects to the local GPM API.
- Loads groups and all profiles across GPM API pages.
- Searches and filters profiles by group.
- Opens, closes, and deletes selected profiles.
- Creates new profiles.
- Native layout only, with a 6/4 split:
  - left: profile table
  - right: automation runtime, queue, terminal console, and run history
- Spreadsheet-style profile selection:
  - click: select one row
  - Ctrl/Cmd + click: toggle individual rows
  - Shift + click: select a contiguous range
- Concurrent automation runner with configurable worker count.
- Playwright CDP automation: open profile, connect to `remote_debugging_address`, open URL, capture screenshot.
- Script Builder for workflow step lists: Navigate, Wait, Click, Type, Delay, Scroll, Screenshot, Condition, and Special Action.
- Workflow JSON import/export plus add, duplicate, delete, and reset controls.
- Run History panel for completed automation runs.
- Dark/light theme.
- Topbar Guide and Changelog dialogs.

## Requirements

- Windows.
- Node.js.
- GPM Login running locally.
- GPM API available at `http://127.0.0.1:19995`.

Use `corepack pnpm` on this machine because PowerShell blocks `npm.ps1`.

## Install

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
$env:CI='true'
corepack pnpm install
```

## Run

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
corepack pnpm dev
```

## Build Check

```powershell
corepack pnpm build
```

## Package And Release

The Windows installer is an Electron Builder NSIS web installer. The small setup `.exe` downloads the larger `.nsis.7z` payload from GitHub Releases during installation.

```powershell
corepack pnpm dist
```

Release publishing is documented in `RELEASE.md`.

## Basic Workflow

1. Open GPM Login.
2. Confirm the local API is running at `http://127.0.0.1:19995`.
3. Run the app with `corepack pnpm dev`.
4. Open `Profiles`.
5. Click rows to select profiles.
6. Use Ctrl/Cmd + click or Shift + click for multi-select.
7. Configure the right-side `Automation Runtime`.
8. Set `Concurrency`.
9. Click `Run Open URL`.

Screenshots are saved to:

```text
%APPDATA%\GPM Automation Console\screenshots
```

## Next Development Suggestions

- Persist Run History in SQLite instead of in-memory state.
- Add workflow dry-run and per-step test execution.
- Add CSV/TXT import for profiles and proxies.
- Add profile/proxy health checks before running automation.
