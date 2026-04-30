# Contributing

## Development Setup

```powershell
cd E:\Dev\Tool\GPM-Automation-Console
corepack pnpm install
corepack pnpm dev
```

## Quality Gates

Run before opening a PR:

```powershell
corepack pnpm lint
corepack pnpm test:unit
corepack pnpm build
corepack pnpm check:changelog
corepack pnpm audit:cleanup
```

## Release Metadata Sync

When preparing a release entry:

```powershell
corepack pnpm sync:all
```

This will bump patch version, sync metadata files, and ensure changelog contains the active version.

## Conventions

- Keep feature logic in `src/features/<domain>`.
- Keep shared contracts in `src/types.ts`.
- Keep scripts idempotent and safe to run in CI.
- Do not commit build artifacts from `dist/` or `release/`.
