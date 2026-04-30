# Architecture

## Overview

`GPM Automation Console` is an Electron desktop app with a React renderer and a local automation runtime.

- Renderer (`src/`): operator UI, workflow editing, profile controls, runtime views.
- Main process (`electron/main.cjs`): app lifecycle, IPC boundary, bridge to automation.
- Automation runtime (`electron/automation.cjs`): execution logic for workflow actions via local browser automation.

## Core Layers

- `src/features/profiles`: profile-level selection/filtering helpers and hooks.
- `src/features/workflows`: workflow-level filtering/searching helpers and hooks.
- `src/api.ts`: renderer-side API client and IPC calls.
- `src/types.ts`: shared type contracts used across the renderer.

## Runtime Data Flow

1. Operator performs action in renderer.
2. Renderer calls local API/IPC through `src/api.ts`.
3. Main process validates/routs command to automation runtime.
4. Automation runtime executes steps and streams logs/status back.
5. Renderer updates table/runtime views from returned events.

## Build And Packaging

- Frontend build: Vite (`dist/`)
- Desktop packaging: Electron Builder (`release/`)
- CI quality gates: lint, tests, metadata/changelog checks, build
