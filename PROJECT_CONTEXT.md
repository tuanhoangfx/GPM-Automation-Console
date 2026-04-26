# Project Context

Living context file for `GPM Automation Console`.

This file should capture decisions, product direction, implementation assumptions, and next development ideas. Keep `README.md` focused on setup and usage. Keep `CHANGELOG.md` focused on update history and rollback points.

## Product Goal

Build a local desktop tool for managing and automating GPM Login profiles through the local GPM API at:

```text
http://127.0.0.1:19995
```

The tool is intended for repeated operational workflows: selecting many profiles, running browser automation, watching console output, reviewing run history, and iterating on workflow presets.

## Current Direction

- Product type: Electron desktop app.
- UI direction: Native-style GPM-inspired operational console.
- Main screen language: English only.
- Main layout: 6/4 split.
- Left panel: profile table and profile controls.
- Right panel: automation runtime frame, workflow manager frame, compact run history frame, and console.
- Theme support: dark/light.
- Dark/light selection lives in the unified Settings view instead of a separate sidebar toggle.
- Design system variants from getdesign.md were removed. The app now uses its original native theme tokens with dark/light support only.

## Current Features

- Connect to local GPM API.
- Load profiles and groups.
- Search profiles.
- Filter profiles by group.
- Create profile.
- Delete selected profiles.
- Open/close profiles.
- Spreadsheet-style profile row selection:
  - click selects one row
  - Ctrl/Cmd + click toggles one row
  - Shift + click selects a contiguous range
- Pagination with large page size support.
- Virtual table rendering for large profile pages.
- Workflow Manager with configurable presets.
- Workflow Manager is optimized as a compact single-line list with visible workflow IDs and enough space for 6 presets.
- Workflow display IDs use the `WFxxxxx` format for search and visual identification.
- Workflow Manager supports multi-select: click selects one workflow, Ctrl/Cmd + click toggles additional workflows, and selected workflows run sequentially.
- Workflow Manager group/platform filters use the shared searchable multi-select dropdown style with checkbox indicators.
- Workflow Manager can filter by multiple groups and multiple platforms at the same time.
- Profile group filtering uses a searchable multi-select dropdown with checkbox indicators.
- Buttons, dropdown triggers, and section headings should reuse the shared control scale and typography for a single consistent UI language.
- Workflow icon colors are based on the workflow `icon` field:
  - `play`: generic run/open workflow.
  - `globe`: network/IP/account reachability checks.
  - `camera`: screenshot/audit workflows.
  - `shield`: appeal/security/confirmation workflows.
  - `education`: education/benefit workflows.
  - `layers`: account plan/service layer workflows.
- Profile table supports Ctrl/Cmd + A to select all profiles in the current filtered result set when focus is not inside an input.
- Hover motion is intentionally minimized for stability: non-button regions do not animate on hover; only specific controls keep lightweight hover feedback.
- Workflow-level settings:
  - target URL
  - screenshot
  - close when done
  - inspect mode
  - concurrency
  - group/platform/action/icon
- Script Builder with editable workflow steps:
  - Navigate
  - Wait selector/network idle
  - Click
  - Type
  - Delay
  - Scroll
  - Screenshot
  - Condition
  - Special action
- Workflow presets now carry executable step lists and run through the script executor.
- Script Builder includes workflow search, group/platform filters, add, duplicate, delete, import JSON, export JSON, and reset actions.
- Script Builder workflow search/filter controls belong inside the Workflows frame, not the central step canvas.
- Script Builder workflow rows use platform-based icons and show compact columns: Icon, ID, Name, Platform, URL, and Actions.
- Workflow platform display is inferred from the starting URL first, then falls back to the saved platform field.
- Brand/platform icons should use standard theSVG assets when available.
- The main Workflow Manager and Script Builder must use the same platform inference and icon rules.
- Add Workflow creates a clean workflow draft instead of duplicating the active workflow.
- Step Inspector exposes explicit Save, Undo, and Forward controls.
- Script Builder workflow selection supports profile-like multi-select: click, Ctrl/Cmd click, and Shift click.
- Default workflow presets include `ChatGPT Login` for `https://chatgpt.com` with OpenAI platform branding.
- Default workflow presets include Microsoft Hotmail login and mail workflows:
  - `Login Microsoft Hotmail`: `https://login.live.com/`
  - `Check Mail Microsoft Hotmail`: `https://outlook.live.com/mail/0/`
- Default workflow presets include `Higgsfield Change Password` for `https://higgsfield.ai/`.
- Workflow step values using unresolved placeholders such as `{{higgsfieldEmail}}` are blocked at runtime with a clear error until the operator replaces them and clicks Save.
- Step Inspector Save is visually separated as the primary action; secondary controls sit below it.
- New default login workflows should start with a Navigate step only unless explicit instructions require more steps.
- Workflow display IDs render as copyable controls.
- Google platform icons use the theSVG `default.svg` variant shown on the icon page.
- Script Builder workflow rows do not show active state; row Run buttons switch to Profiles with that workflow selected.
- Script Builder edits are draft-only until Save; Save applies the draft to persisted workflow settings and shows success feedback.
- Script Builder workflow row Run belongs in the row Actions column, not in the central canvas header.
- Workflow exports include both copyable `displayId` values like `WF00001` and stable internal `id` values.
- Concurrent automation runner.
- Terminal-style console output.
- Compact Run History with status dots.
- Run History sits below Workflow Manager and above Console, with a compact dot grid capped to about 3 rows.
- Playwright CDP automation through GPM `remote_debugging_address`.

## Workflow Presets

Current workflow presets:

- `Open URL`
- `IP Check`
- `Screenshot Audit`
- `GitHub Education`
  - URL: `https://github.com/settings/education/benefits`
- `Google One AI`
  - URL: `https://one.google.com/u/0/ai/activity`
- `AG Appeal Form`
  - URL: `https://forms.gle/hGzM9MEUv2azZsrb9`
  - Action: `google-form-ag-appeal`
  - Uses inspect mode by default.
- `ChatGPT Login`
  - URL: `https://chatgpt.com`
- `Login Microsoft Hotmail`
  - URL: `https://login.live.com/`
- `Check Mail Microsoft Hotmail`
  - URL: `https://outlook.live.com/mail/0/`
- `Higgsfield Change Password`
  - URL: `https://higgsfield.ai/`
  - Steps follow the recorded reset-password flow: login modal, email login, forgot password, send code, enter code, enter new password, change password.
  - Email, reset code, and new password use placeholders that must be replaced before running.

## Important Decisions

- Keep the Native UI as the main direction.
- Keep UI text in English for consistency.
- Keep `README.md` short and practical.
- Use `CHANGELOG.md` for version/update history and rollback commands.
- Use this `PROJECT_CONTEXT.md` for product context and future planning.
- The user grants default permission for necessary local build/test/smoke-test commands. If the sandbox still requires approval, request it directly through the tool instead of asking again in chat.
- Keep shared working rules outside the project at:

```text
D:\Dev\Tool\Codex_Working_Rules.md
```

## Development Commands

Use `corepack pnpm` on this machine.

```powershell
cd D:\Dev\Tool\GPM-Automation-Console
corepack pnpm dev
corepack pnpm build
```

## Rollback Practice

Before each meaningful feature update:

```powershell
git status --short
```

After implementation and verification:

```powershell
git add .
git commit -m "Clear update message"
```

Record the commit hash in `CHANGELOG.md`.

To rollback:

```powershell
git reset --hard <commit_hash>
```

## Next Development Suggestions

- Persist Run History to SQLite or a local JSON database.
- Add a visual Workflow Builder with steps like Wait selector, Click, Type, Delay, Scroll, Screenshot, and Condition.
- Add workflow dry-run mode with no final submit for sensitive forms.
- Add workflow import/export.
- Add profile health check before running automation.
- Add proxy health check before automation.
- Add per-workflow run reports and screenshot viewer.
- Add packaged Windows installer with `electron-builder`.
