# Release Guide

Release and update process for `GPM Automation Console`.

The desktop app is packaged with Electron Builder as a Windows NSIS web installer. Public GitHub Releases are used as the install payload host and update feed for `electron-updater`.

## Requirements

- Public GitHub repository with `origin` configured locally.
- GitHub token with permission to create releases and upload release assets.
- `package.json` version bumped before each release.
- `CHANGELOG.md` updated before each release.

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
2. Add a new top entry in `CHANGELOG.md`.
3. Include changed files, verification, and rollback command in `CHANGELOG.md`.
4. Run `corepack pnpm build`.
5. Run `corepack pnpm dist` and confirm the `.exe`, `.nsis.7z`, and `latest.yml` files exist.
6. Verify the packaged app starts from `release\win-unpacked\GPM Automation Console.exe`.
7. Verify the updater runtime dependencies are included in `app.asar`.
8. Publish with `corepack pnpm release`.
9. Confirm GitHub `releases/latest` returns the new tag and includes the setup `.exe`, `.nsis.7z`, and `latest.yml`.

## Local Auto-Release Mode

This repository uses local git hooks to keep release metadata synchronized on every commit:

- `pre-commit`: runs `pnpm release:stamp` and stages `package.json`, `tool.manifest.json`, `CHANGELOG.md`, and `TOOL_STATUS.md`.
- `post-commit`: runs `pnpm release:tag-local` to create an annotated tag `v<version>` if it does not exist.

Hook setup command:

```powershell
corepack pnpm hooks:install
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
