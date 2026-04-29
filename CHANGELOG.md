# Changelog

Update log for `GPM Automation Console`.

Use this file to find a stable rollback point after each feature update. Every meaningful update should include the commit hash, affected areas, verification result, and rollback command.

## 2026-04-30 - Maintenance Sync 0.1.4

- Version: `0.1.4`
- Timestamp: 2026-04-30 03:27 (UTC+7)
- Commit: `7309673`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Synced release metadata and changelog records to the current source version/commit.
- Automate full docs synchronization for changelog and metadata.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-30 - Maintenance Sync 0.1.3

- Version: `0.1.3`
- Timestamp: 2026-04-30 03:18 (UTC+7)
- Commit: `3200b54`
- Type: Maintenance/Automation
- Status: Verified

### Changes

- Synced release metadata and changelog records to the current source version/commit.
- Improve profile/workflow state modularity and add release safeguards.

### Verification

```powershell
pnpm sync:all
pnpm build
```

Result: passed.


## 2026-04-29 - Auto Sync Version Log And Bump 0.1.3

- Version: `0.1.3`
- Timestamp: 2026-04-29 22:36 (UTC+7)
- Commit: pending
- Type: Feature/UI
- Status: Verified

### Changes

- Bumped app version from `0.1.2` to `0.1.3`.
- Updated Version Log parsing to read every newest changelog entry with a `### Changes` section, not only entries that include a Release URL.
- Added support for optional `- Version: x.y.z` metadata so the Version badge can map exactly to release/app version when available.
- Kept fallback behavior safe by showing the changelog date as version text when explicit version metadata is not provided.

### Verification

```powershell
corepack pnpm build
```

Result: passed.

## 2026-04-28 - Project Manifest Identity

- Commit: pending
- Type: Metadata/Governance
- Status: Verified

### Changes

- Added `tool.manifest.json` as the machine-readable project manifest.
- Assigned stable project code `P0001` for future operator and Codex references.
- Updated `PROJECT_CONTEXT.md` to reference the workspace-level project index at `E:\Dev\Rules\indexes\PROJECT_INDEX.md`.

### Verification

- `Unified Tool Admin` scanner reads `P0001` from `tool.manifest.json`.
- Unified search for `P0001` resolves to `GPM Automation Console`.

## 2026-04-26 - Workflow UI Guide And Full Profile Loading

- Commit: `c27c092`
- Type: Feature/Fix
- Status: Stable
- Release: https://github.com/tuanhoangfx/GPM-Automation-Console/releases/tag/v0.1.2

### Changes

- Added topbar `Guide` and `Changelog` buttons next to `Refresh`.
- Added icon-led Guide and Version Log dialogs for quick in-app help.
- Fixed Script Builder workflow action icon centering and stabilized action button sizing.
- Kept workflow draft state consistent between Scripts and Profiles while editing.
- Synced workflow run steps with the current target URL when the first Navigate step tracks the preset URL.
- Changed profile loading to fetch every GPM API page instead of stopping at the first 100 profiles.
- Added a working rule to restart Electron/app processes automatically when changes require restart.
- Bumped app version to `0.1.2`.

### Affected Files

- `package.json`
- `src/App.tsx`
- `src/api.ts`
- `src/styles.css`
- `PROJECT_CONTEXT.md`
- `README.md`
- `RELEASE.md`
- `CHANGELOG.md`

### Verification

```powershell
corepack pnpm build
corepack pnpm dist
```

Result: passed.

Electron smoke test:

```text
API connected
Pagination: 1-5000 of 5119 profiles
Ready count: 5119
Guide icons: 4
Changelog icons: 3
Console errors: none
```

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git revert c27c092
```

## 2026-04-26 - Fix Packaged Updater Runtime Dependency

- Commit: `3540766`
- Type: Packaging/Fix
- Status: Stable

### Changes

- Added `ms` as a direct production dependency so the packaged Electron app includes the runtime dependency required by `electron-updater`.
- Bumped app version to `0.1.1` for a fixed public release.

### Affected Files

- `package.json`
- `pnpm-lock.yaml`
- `CHANGELOG.md`

### Verification

```powershell
corepack pnpm build
corepack pnpm dist
```

Result: passed.

Packaged runtime dependency check:

```text
release\win-unpacked\resources\app.asar.unpacked\node_modules\ms\index.js
```

Result: present.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git revert 3540766
```

## 2026-04-26 - Configure GitHub Release Auto Updates

- Commit: `9541e81`
- Type: Packaging/Release
- Status: Stable

### Changes

- Added Electron Builder packaging for Windows NSIS installer output.
- Added Electron Updater integration in the Electron main process.
- Added app metadata/update IPC handlers for packaged app update checks.
- Added GitHub Releases publish configuration for public release distribution.
- Switched Windows packaging to NSIS web installer so the downloaded setup file stays small and the application payload downloads during install.
- Added `RELEASE.md` with the version bump, build, publish, and update artifact checklist.
- Added `release/` to `.gitignore` so generated installers are not committed.

### Affected Files

- `package.json`
- `pnpm-lock.yaml`
- `electron/main.cjs`
- `RELEASE.md`
- `.gitignore`

### Verification

```powershell
corepack pnpm build
corepack pnpm dist
```

Result: passed.

Generated update artifacts:

```text
release\nsis-web\GPM-Automation-Console-Setup-0.1.0.exe
release\nsis-web\gpm-automation-console-0.1.0-x64.nsis.7z
release\nsis-web\latest.yml
```

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git checkout -- .gitignore electron/main.cjs package.json pnpm-lock.yaml RELEASE.md CHANGELOG.md
```

## 2026-04-26 - Add Higgsfield Password Reset Workflow

- Commit: `6919f6a`
- Type: Workflow
- Status: Stable

### Changes

- Added the `Higgsfield Change Password` default workflow based on the provided guide video.
- The workflow opens Higgsfield, opens the login modal, switches to email login, opens forgot password, sends the reset code, fills code/password, and runs change password.
- Added Higgsfield platform inference from `https://higgsfield.ai/`.
- Added runtime protection for unresolved workflow placeholders so email/code/password placeholders are not typed accidentally.

### Affected Files

- `src/App.tsx`
- `electron/automation.cjs`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Fresh Script Builder loads 10 workflow presets.
- `Higgsfield Change Password` appears once.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 6919f6a
```

## 2026-04-26 - Move Script Run Into Workflow Actions

- Commit: `733a511`
- Type: UI/Workflow
- Status: Stable

### Changes

- Removed the central canvas `Run Script` button from Script Builder.
- Moved row Run into the workflow Actions column.
- Row Run still switches to Profiles with that workflow selected.
- Removed the separate Run column from the workflow table.
- Added `displayId` to exported workflow JSON so each exported workflow includes `WFxxxxx`.
- Kept stable internal `id` values for import/runtime compatibility.
- Adjusted the workflow table columns to ID, Name, Platform, URL, Actions.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Row Run for ChatGPT switches to Profiles.
- Main Workflow Manager run button shows `Run ChatGPT Login`.
- Script Builder table headers are ID, Name, Platform, URL, Actions.
- Workflow Actions column contains row Run buttons.
- Script Builder rows no longer render active/focused state.
- Workflow list has no horizontal scroll.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 733a511
```

## 2026-04-26 - Add Draft Save Flow And Row Run Buttons

- Commit: `fdd9df0`
- Type: UI/Workflow
- Status: Stable

### Changes

- Removed active/focused styling from Script Builder workflow rows.
- Replaced row active indication with a per-row Run button.
- Row Run switches to the Profiles view and selects that workflow in the main Workflow Manager.
- Split workflow configs into saved and draft state.
- Script Builder edits now stay in draft state until Save is clicked.
- Save persists the draft, applies it to the main Workflow Manager, and shows a temporary `Saved` success state.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Row Run for ChatGPT switches to Profiles.
- Main Workflow Manager run button shows `Run ChatGPT Login`.
- Script Builder rows no longer render active/focused state.
- Save changes to `Saved` and applies a success class.
- Secondary Step Inspector row still has 5 icon-only controls including Delete.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard fdd9df0
```

## 2026-04-26 - Remove Brand Icon Backgrounds

- Commit: `2e255b4`
- Type: UI
- Status: Stable

### Changes

- Removed the generated gradient/background/border from brand platform icons.
- Brand icons now render with transparent/default SVG backgrounds.

### Affected Files

- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 2e255b4
```

## 2026-04-26 - Merge New Default Workflows Into Stored Config

- Commit: `30a0394`
- Type: Fix/Workflow
- Status: Stable

### Changes

- Fixed workflow loading so new default presets are merged into existing `localStorage` workflow configs.
- Preserved custom imported/created workflows while adding new defaults.
- This makes newly added Microsoft Hotmail workflows appear for existing users without requiring a manual reset.

### Affected Files

- `src/App.tsx`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 30a0394
```

## 2026-04-26 - Add Microsoft Hotmail Workflows

- Commit: `4889bc0`
- Type: Workflow
- Status: Stable

### Changes

- Added `Login Microsoft Hotmail` workflow with one Navigate step to `https://login.live.com/`.
- Added `Check Mail Microsoft Hotmail` workflow with one Navigate step to `https://outlook.live.com/mail/0/`.
- Added Microsoft platform inference from Live/Outlook/Hotmail/Microsoft URLs.
- Added Microsoft platform icon using theSVG CDN.
- Changed Google icon back to the theSVG `default.svg` URL shown on the Google icon page.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Script Builder renders 9 workflows.
- Microsoft Hotmail login and mail workflows render with the requested URLs.
- Google rows use `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/google/default.svg`.
- Microsoft rows use `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/microsoft/default.svg`.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 4889bc0
```

## 2026-04-26 - Refine Step Tools And Workflow IDs

- Commit: `5d1d187`
- Type: UI/Workflow
- Status: Stable

### Changes

- Added Delete back to Step Inspector.
- Converted Undo, Forward, Move Up, Move Down, and Delete to icon-only buttons on one balanced row.
- Kept Save as a separate primary full-width row.
- Changed ChatGPT Login preset to only include a Navigate step.
- Changed workflow display IDs into copyable controls.
- Switched Google brand icon URLs to the theSVG `color.svg` variant for a cleaner Google mark.
- Documented that new default login workflows should start with Navigate only unless additional instructions are provided.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Workflow IDs render as copyable controls from `WF00001` to `WF00007`.
- Google rows use `https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/google/color.svg`.
- Step Inspector renders 5 icon-only secondary buttons on one row.
- Step Inspector Delete is present.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 5d1d187
```

## 2026-04-26 - Add Workflow Multi Select And ChatGPT Preset

- Commit: `f16c2bc`
- Type: UI/Workflow
- Status: Stable

### Changes

- Fixed workflow row action alignment.
- Added Script Builder workflow multi-select using the same interaction model as profiles:
  - click selects one
  - Ctrl/Cmd click toggles one
  - Shift click selects a range
- Added default `ChatGPT Login` workflow for `https://chatgpt.com`.
- Added OpenAI platform inference and OpenAI brand icon from theSVG CDN.
- Kept theSVG CDN icons for Google/GitHub/OpenAI platform rows.
- Moved Step Inspector Save into its own full-width primary row with hover emphasis.
- Moved secondary Step Inspector controls to the row below Save.
- Removed the Step Inspector Delete button.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Script Builder renders 7 workflows.
- Ctrl multi-select selected 2 workflow rows.
- `ChatGPT Login` renders with `OpenAI` platform.
- Step Inspector Save is on its own row.
- Step Inspector Delete is absent.
- Row action heights are consistent.
- Brand icons use theSVG CDN URLs for GitHub, Google, and OpenAI.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard f16c2bc
```

## 2026-04-26 - Compact Workflow Rows And Infer Platforms

- Commit: `b88ebeb`
- Type: UI/Workflow
- Status: Stable

### Changes

- Removed the Script Builder workflow table columns `Steps`, `Run`, and `Tools`.
- Renamed the per-row tool column to `Actions`.
- Reduced workflow row height and tightened typography to avoid horizontal scrolling.
- Colored per-row action icons to match toolbar action colors.
- Added URL-based platform inference for GitHub, Google, Google Forms, Facebook, Instagram, Claude, and Grok.
- Added theSVG CDN-based brand icons for recognized platforms.
- Updated the main Workflow Manager to use the same inferred platform labels and theSVG brand icons as Script Builder.
- Added a shared working rule requiring standard brand SVGs from `https://thesvg.org/` when platform identity matters.
- Added Step Inspector Save, Undo, and Forward controls.
- Changed Add Workflow to create a clean new workflow instead of copying the currently selected workflow.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`
- `E:\Dev\Rules\rules\Working_Rules.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Workflow columns are now Icon, ID, Name, Platform, URL, Actions.
- Removed columns are absent.
- Workflow list has no horizontal scroll at 1840px wide viewport.
- Row height is 34px.
- Platforms infer correctly from current URLs: Generic, GitHub, Google, Google Forms.
- Main Workflow Manager also shows inferred platforms and brand icons.
- Step Inspector includes Save, Undo, and Forward.
- Add Workflow creates `New Workflow` with Generic platform and an empty URL.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard b88ebeb
```

## 2026-04-26 - Expand Workflow Frame And Add Workflow Row Tools

- Commit: `d205344`
- Type: UI/Workflow
- Status: Stable

### Changes

- Expanded the Script Builder Workflows frame to 760px and reduced the central canvas width.
- Kept workflow search, group filter, and platform filter on one line.
- Kept workflow action buttons on one line.
- Converted workflow rows into an information table with Icon, ID, Name, Platform, URL, Steps, Run, and Tools columns.
- Added per-workflow icon tools for export, import into workflow, copy, and reset.
- Changed workflow row icons to derive from platform names such as Google, GitHub, Instagram, Facebook, Claude, and Grok.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Workflows frame width is 760px.
- Search/filter controls render on one row.
- Workflow action buttons render on one row.
- Workflow table renders 8 columns.
- Each workflow row renders icon-only tools.
- No Vite error overlay detected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard d205344
```

## 2026-04-26 - Move Script Workflow Filters Into Workflow Frame

- Commit: `3cfa791`
- Type: UI/Workflow
- Status: Stable

### Changes

- Moved Script Builder workflow search and group/platform filters into the Workflows frame.
- Removed workflow search/filter controls from the central step canvas.
- Increased the Workflows column width to show the workflow list more comfortably.
- Added distinct colors for workflow action buttons: Add, Copy, Delete, Export, Import, and Reset.
- Documented the placement rule in project context.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- Confirmed `.script-workflows` contains workflow search.
- Confirmed `.script-workflows` contains 2 filter dropdowns.
- Confirmed central `.script-main` no longer contains workflow search.
- Confirmed workflow actions render: Add, Copy, Delete, Export, Import, Reset.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 3cfa791
```

## 2026-04-26 - Refine Header Settings And Workflow Tools

- Commit: `3043095`
- Type: UI/Workflow
- Status: Stable

### Changes

- Removed the separate sidebar dark/light toggle and moved appearance selection into Settings.
- Consolidated tool settings into Settings with Connection, Appearance, and Workflow Data sections.
- Removed the visible base URL subtitle from the header for a cleaner topbar.
- Added Script Builder workflow search and group/platform filter controls matching the main Workflow Manager.
- Added workflow actions: Add, Copy, Delete, Export JSON, Import JSON, and Reset.
- Allowed custom imported/created workflows instead of only fixed preset IDs.

### Affected Files

- `src/App.tsx`
- `src/styles.css`
- `README.md`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Preview smoke test:

- `http://127.0.0.1:4173` returned HTTP 200.
- Playwright smoke test confirmed page content renders, no Vite error overlay is present, and Scripts contains Workflows, Import, and Export controls.
- One 404 was observed for a non-runtime resource; UI render was not affected.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 3043095
```

## 2026-04-26 - Add Script Builder And Step Executor

- Commit: `ef495b2`
- Type: Feature/Automation
- Status: Stable

### Changes

- Added a workflow script step model with Navigate, Wait, Click, Type, Delay, Scroll, Screenshot, Condition, and Special Action steps.
- Added default executable step lists to all workflow presets.
- Added a script executor in Electron automation that runs step lists through Playwright CDP.
- Preserved the AG Appeal workflow through a Special Action step.
- Replaced the placeholder Scripts tab with a three-panel Script Builder for choosing workflows, editing step order, and changing step fields.
- Wired workflow runs to pass step lists from the renderer to the Electron automation runner.
- Updated README and project context to reflect the Script Builder.

### Affected Files

- `src/App.tsx`
- `src/api.ts`
- `src/types.ts`
- `src/styles.css`
- `electron/automation.cjs`
- `electron/main.cjs`
- `README.md`
- `PROJECT_CONTEXT.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard ef495b2
```

## 2026-04-26 - Enable Multi-Select Workflow Filters

- Commit: `0ca478f`
- Type: UI/Filter
- Status: Stable

### Changes

- Converted Workflow Manager group and platform filters from single-select to true multi-select dropdowns.
- Workflow filters now support selecting multiple groups or platforms at once.
- `All groups` and `All platforms` clear the corresponding filter.
- Dropdown summary labels now show `2 groups`, `2 platforms`, etc.
- Removed the old single-select searchable dropdown component.

### Affected Files

- `src/App.tsx`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Selecting `Core` and `Account Check` together shows `2 groups` and filters to matching workflows.
- Selecting `Generic` and `GitHub` together shows `2 platforms` and filters to matching workflows.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 0ca478f
```

## 2026-04-26 - Standardize Workflow Dropdowns And Icon Tones

- Commit: `8d3f360`
- Type: UI
- Status: Stable

### Changes

- Updated Workflow Manager group/platform dropdowns to use the same searchable checkbox option style as the profile group dropdown.
- Standardized shared control styling across buttons, dropdown triggers, and section headings.
- Added per-type workflow icon colors based on the workflow `icon` field.
- Workflow icon classification is explicit in workflow config, not inferred from URL or platform.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Workflow dropdowns render with checkbox indicators.
- Two workflow filter dropdowns are available.
- All 6 workflow icon tone classes render: `play`, `globe`, `camera`, `education`, `layers`, `shield`.
- All 6 workflow presets remain visible.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 8d3f360
```

## 2026-04-26 - Multi Workflow Selection And Profile Group Multi Filter

- Commit: `152f262`
- Type: Feature/UI
- Status: Stable

### Changes

- Added multi-workflow selection in Workflow Manager.
- Regular click selects one workflow; Ctrl/Cmd + click toggles additional workflows.
- Run button now supports running multiple selected workflows sequentially.
- Each workflow still uses its own URL, screenshot, close policy, inspect mode, and concurrency setting.
- Added Ctrl/Cmd + A profile selection shortcut for the current filtered profile result set.
- Replaced the Profile group native select with the shared searchable dropdown style.
- Profile group filter now supports selecting multiple groups with checkbox indicators.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Ctrl workflow multi-select works.
- Run button shows multiple selected workflows.
- Profile Group dropdown opens with search and checkbox indicators.
- Ctrl+A profile selection path is implemented; the smoke environment did not have real profile rows loaded, so live selection was not exercised there.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 152f262
```

## 2026-04-26 - Refine Button Hover States

- Commit: `673b337`
- Type: UI/performance cleanup
- Status: Stable

### Changes

- Reworked button hover states to avoid harsh visual jumps.
- Removed strong hover shadow from row action buttons and dropdown triggers.
- Replaced aggressive action hover colors with flatter, lower-contrast state changes.
- Kept subtle hover feedback for actionable controls only.
- Added default permission preference to `PROJECT_CONTEXT.md`.
- Added default permission preference to shared rules at `E:\Dev\Rules\rules\Working_Rules.md`.

### Affected Files

- `src/styles.css`
- `PROJECT_CONTEXT.md`
- `E:\Dev\Rules\rules\Working_Rules.md`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Run button hover has no transform.
- Dropdown hover has no box shadow.
- Searchable dropdown still opens and filters options.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 673b337
```

## 2026-04-26 - Remove Heavy Hover Effects And Unused Styles

- Commit: `9136181`
- Type: UI/performance cleanup
- Status: Stable

### Changes

- Removed heavy hover effects from panels, cards, tables, workflow rows, metrics, modal, and drawer areas.
- Removed hover `transform` and large hover `box-shadow` effects from non-button UI regions.
- Kept lightweight hover feedback for buttons, row action icons, dropdown triggers, dropdown options, and inputs.
- Removed unused workflow layout CSS left from older card-based workflow designs.
- Removed Run History running-dot pulse animation to reduce continuous repaint work.

### Affected Files

- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Main panels render without transform-based hover state.
- Workflow IDs still render.
- Searchable dropdown still opens and filters.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 9136181
```

## 2026-04-26 - Move Run History Below Workflow Manager

- Commit: `c861cd5`
- Type: UI
- Status: Stable

### Changes

- Moved `Run History` out of `Automation Runtime`.
- Placed `Run History` directly below `Workflow Manager` and above `Console`.
- Reduced Runtime back to metrics-only display.
- Set Run History dot area to a compact fixed height for up to about 3 rows of dots.
- Extra history dots scroll inside the Run History frame.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Run History is no longer inside Runtime.
- Run History frame renders below Workflow Manager and above Console.
- History dot grid height is capped for compact scrolling.
- Workflow IDs still render as `WFxxxxx`.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard c861cd5
```

## 2026-04-26 - Compact Workflow Rows And Searchable Dropdown Filters

- Commit: `f188e63`
- Type: UI
- Status: Stable

### Changes

- Reduced each workflow row height to a compact fixed 30px.
- Fixed workflow list behavior so rows stay pinned to the top and do not stretch when search/filter returns only a few results.
- Added workflow display IDs in the `WFxxxxx` format.
- Workflow search now matches both internal workflow IDs and display IDs.
- Replaced native group/platform selects in Workflow Manager with custom searchable dropdowns.
- Restyled dropdowns with a modern trigger, floating menu, search input, active state, and filtered options.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Workflow IDs match `WFxxxxx`.
- Workflow row height is below 32px.
- Searching by `WF00001` does not resize the workflow frame, list, row, or run button.
- Searchable dropdown opens, filters options, and updates selected value.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard f188e63
```

## 2026-04-26 - Merge Run History Into Runtime And Fix Sizing

- Commit: `1588b5f`
- Type: UI
- Status: Stable

### Changes

- Merged `Run History` into the `Automation Runtime` frame.
- Removed the standalone Run History frame from the right drawer.
- Fixed Runtime, Workflow Manager, workflow list, search input, workflow rows, and run button dimensions so search/filter changes do not resize the layout.
- Kept Workflow Manager as a separate frame from Runtime.
- Fixed workflow metadata separator encoding.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Run History is inside Runtime.
- Standalone Run History frame no longer exists.
- Runtime contains exactly 4 metric cards.
- Runtime, Workflow frame, workflow list, search input, run button, and workflow row sizes remain stable after search.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 1588b5f
```

## 2026-04-26 - Refine Runtime And Workflow Panels

- Commit: `e7530b1`
- Type: UI
- Status: Stable

### Changes

- Split `Automation Runtime` and `Workflow Manager` into two separate frames.
- Removed the secondary `profiles selected` label from Runtime.
- Kept Runtime focused on four compact metrics: Selected, Ready, Running, Failed.
- Refined Workflow Manager search and filter styling.
- Changed workflow rows to single-line compact rows.
- Added visible workflow IDs to each workflow row.
- Increased Workflow Manager height so all 6 workflow presets are visible while taking area from Console.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

Render smoke test:

- Runtime frame renders.
- Workflow frame renders.
- Runtime contains exactly 4 metric cards.
- `profiles selected` label is removed from Runtime.
- Workflow list renders at least 6 workflows.
- Workflow ID is visible in the first workflow row.

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard e7530b1
```

## 2026-04-26 - Rollback Getdesign Design System UI

- Commit: `6ed9036`
- Type: UI rollback
- Status: Stable

### Changes

- Removed the getdesign.md design system selector from the topbar.
- Removed Supabase, Mintlify, Lovable, and Figma design-system theme variants.
- Restored the UI to the native dark/light theme token model.
- Kept existing product features intact: Native layout, Workflow Manager, virtual table, concurrent runner, console, and Run History dots.

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed.

### Rollback

To return to this rollback point:

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard 6ed9036
```

## 2026-04-26 - Baseline After Rollback

- Commit: `d683a6e`
- Type: Baseline
- Status: Stable baseline after rolling back the UI change requested around 12:07.

### Changes

- Restored the app to the previous accepted state before the latest bottom-right theme/design/settings experiment.
- Initialized git in `E:\Dev\Tool\GPM-Automation-Console`.
- Added this project as a rollback-capable repository.

### Current Product State

- Native layout is the selected main UI direction.
- Main screen uses a 6/4 split:
  - left: profile table
  - right: automation runtime, console, and run history
- Profile table supports spreadsheet-style row selection.
- Automation runner supports concurrency.
- Workflow Manager exists with workflow-specific settings.
- Run History uses compact status dots.
- Virtual table is available for large profile pages.
- Dark/light theme and design system variants are available.
- AG Appeal Form workflow includes inspect-oriented automation logic.

### Verification

```powershell
corepack pnpm build
```

Result: passed.

### Rollback

To return to this baseline:

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git reset --hard d683a6e
```

## Update Entry Template

Copy this template for future updates:

```markdown
## YYYY-MM-DD - Update Title

- Commit: `<commit_hash>`
- Type: Feature | Fix | Refactor | UI | Automation | Docs
- Status: Stable | Needs review | Experimental

### Changes

- ...

### Affected Files

- `src/App.tsx`
- `src/styles.css`

### Verification

```powershell
corepack pnpm build
```

Result: passed/failed.

### Rollback

```powershell
git reset --hard <commit_hash>
```

### Notes

- ...
```
