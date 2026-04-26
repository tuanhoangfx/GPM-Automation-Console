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
cd D:\Dev\Tool\GPM-Automation-Console
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
cd D:\Dev\Tool\GPM-Automation-Console
$env:GH_TOKEN="YOUR_GITHUB_TOKEN"
corepack pnpm release
```

Electron Builder publishes to the GitHub repository configured in `package.json`.

Before the first publish, make sure `origin` points to the same public GitHub repo configured in `package.json`.

## Version Checklist

Before publishing a new version:

1. Update `version` in `package.json`.
2. Add a new top entry in `CHANGELOG.md`.
3. Include changed files, verification, and rollback command in `CHANGELOG.md`.
4. Run `corepack pnpm build`.
5. Run `corepack pnpm dist` and confirm the `.exe`, `.nsis.7z`, and `latest.yml` files exist.
6. Publish with `corepack pnpm release`.

## Client Update Behavior

New clients run the small web installer, which downloads the application package from GitHub Releases during installation. Installed clients check GitHub Releases when the packaged app starts. If a newer version exists, the app downloads it automatically and installs it when the app restarts or quits.
