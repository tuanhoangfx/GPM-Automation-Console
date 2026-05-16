# Changelog

## 2026-05-03 - Workflow Execution Logic Update

- Version: `0.2.23`
- Timestamp: 2026-05-03 19:44 (UTC+7)
- Commit: `ad9d754`
- Type: Feature/Fix
- Status: Verified

### Changes

- Restored theme and overlay infrastructure so popovers and dialogs render reliably with correct dark/light styling.
- Workflow execution logic updates synced from the latest desktop release.

### Verification

```powershell
pnpm sync:all
pnpm build
```

- Result: passed

### Rollback

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
git revert <commit_hash>
```
