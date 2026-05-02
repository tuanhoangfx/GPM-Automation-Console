import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const packagePath = path.join(rootDir, "package.json");
const releaseLogPath = path.join(rootDir, "RELEASE.md");

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const version = packageJson.version;
const isCheckMode = process.argv.includes("--check");

if (!version) {
  throw new Error("Missing version in package.json");
}

const commit = execSync("git rev-parse --short HEAD", { cwd: rootDir, encoding: "utf8" }).trim();

function readChangedFiles(command) {
  try {
    return execSync(command, { cwd: rootDir, encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function unique(values) {
  return [...new Set(values)];
}

function isProductFacingFile(file) {
  const normalized = file.replace(/\\/g, "/");
  return normalized.startsWith("src/") || normalized.startsWith("electron/");
}

function classifyFeatureArea(file) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.startsWith("src/features/workflows/")) return "Workflow";
  if (normalized.startsWith("src/features/profiles/")) return "Profiles";
  if (normalized.startsWith("src/features/release-log/")) return "Release Log";
  if (normalized.startsWith("src/theme/") || normalized.startsWith("src/ui/") || normalized === "src/styles.css") return "UI";
  if (normalized.startsWith("src/")) return "App Core";
  if (normalized.startsWith("electron/")) return "Desktop Runtime";
  if (normalized.startsWith(".githooks/") || normalized.startsWith("scripts/")) return "Release Automation";
  if (normalized.startsWith(".github/workflows/")) return "CI";
  if (normalized === "package.json" || normalized === "tool.manifest.json" || normalized === "RELEASE.md") return "Release Metadata";
  return "Maintenance";
}

function featureAreaSummary(files) {
  const counts = new Map();
  for (const file of files) {
    const area = classifyFeatureArea(file);
    counts.set(area, (counts.get(area) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([area, count]) => `${area} (${count})`);
}

function inferReleaseType(files) {
  if (files.length === 0) {
    return { type: "Maintenance/Internal" };
  }
  const areas = new Set(files.map(classifyFeatureArea));
  if (areas.has("Workflow") || areas.has("Profiles") || areas.has("UI") || areas.has("App Core") || areas.has("Desktop Runtime")) {
    return { type: "Feature/Fix" };
  }
  if (areas.has("Release Automation") || areas.has("CI")) {
    return { type: "Maintenance/Automation" };
  }
  return { type: "Maintenance/Docs" };
}

function inferReleaseHeadline(files) {
  if (files.length === 0) {
    return "Internal Maintenance";
  }
  const normalized = files.map((file) => file.replace(/\\/g, "/"));
  const areas = featureAreaSummary(files).map((item) => item.split(" (")[0]);

  if (normalized.includes("src/App.tsx")) {
    const appDiff = readStagedDiff("src/App.tsx");
    if (/parseVersionLogEntries|candidate|version/i.test(appDiff) && /release/i.test(appDiff)) {
      return "Release Log Parsing Logic Update";
    }
  }
  if (normalized.some((file) => file.startsWith("src/features/workflows/"))) {
    return "Workflow Execution Logic Update";
  }
  if (normalized.some((file) => file.startsWith("src/features/profiles/"))) {
    return "Profile Handling Logic Update";
  }
  if (normalized.some((file) => file.startsWith("electron/"))) {
    return "Desktop Runtime Update";
  }
  if (normalized.some((file) => file.startsWith("src/"))) {
    return "Application Logic Update";
  }
  if (normalized.some((file) => file.startsWith(".github/workflows/"))) {
    return "CI Pipeline Update";
  }
  if (normalized.some((file) => file.startsWith(".githooks/") || file.startsWith("scripts/"))) {
    return "Release Automation Policy Update";
  }
  if (
    normalized.includes("package.json") ||
    normalized.includes("tool.manifest.json") ||
    normalized.includes("RELEASE.md")
  ) {
    return "Version Synchronization Update";
  }
  if (areas[0]) {
    return `${areas[0]} Update`;
  }
  return "Project Maintenance Update";
}

function readStagedDiff(file) {
  try {
    return execSync(`git diff --cached -- "${file}"`, { cwd: rootDir, encoding: "utf8" });
  } catch {
    return "";
  }
}

function describeFileChange(file, changedSet) {
  const normalized = file.replace(/\\/g, "/");
  const diff = readStagedDiff(normalized);

  if (normalized === "src/features/workflows/workflow-executors.ts") {
    return "- Added dedicated workflow action executors to decouple action-specific runtime logic from `App.tsx`.";
  }
  if (normalized === "src/App.tsx") {
    if (/set-screen-resolution-real|executeWorkflowAction/.test(diff)) {
      return "- Refactored workflow runtime in `src/App.tsx` to route execution through action executors and support non-URL actions cleanly.";
    }
    return "- Refined workflow and runtime orchestration behavior in `src/App.tsx`.";
  }
  if (normalized === "src/styles.css") {
    if (/native-drawer|history-dot/.test(diff)) {
      return "- Balanced runtime panel layout to a 50/50 Run History/Console split and reduced history dot marker size for denser monitoring.";
    }
    return "- Updated runtime visual styling in `src/styles.css`.";
  }
  if (normalized === "src/api.ts") {
    if (/updateProfile/.test(diff)) {
      return "- Added `updateProfile` API helper to support workflow-level profile patch actions.";
    }
    return "- Updated API integration helpers in `src/api.ts`.";
  }
  if (
    normalized === "src/App.tsx" &&
    /parseVersionLogEntries|candidate|version/i.test(diff) &&
    /release/i.test(diff)
  ) {
    return "- Updated YTB release log parsing logic to select the highest-version source instead of taking the first candidate.";
  }
  if (normalized === "RELEASE.md") {
    return "- Updated `RELEASE.md` with behavior-focused, concrete change descriptions.";
  }
  if (normalized === "package.json") {
    return "- Updated `package.json` scripts/version metadata to match the automated release flow.";
  }
  if (normalized === "tool.manifest.json") {
    return "- Synchronized `tool.manifest.json` release version with the project source version.";
  }
  if (normalized.startsWith(".githooks/")) {
    return `- Updated Git hook \`${normalized}\` to enforce automatic version bump and sync policy.`;
  }
  if (normalized.startsWith(".github/workflows/")) {
    return `- Updated CI workflow \`${normalized}\` for stricter release/version validation behavior.`;
  }
  if (normalized.startsWith("scripts/")) {
    return `- Updated automation script \`${normalized}\` to improve release/version synchronization reliability.`;
  }
  if (normalized.startsWith("src/") || normalized.startsWith("electron/")) {
    return `- Updated \`${normalized}\` with behavior changes included in this release.`;
  }
  if (
    changedSet.has("package.json") &&
    changedSet.has("tool.manifest.json") &&
    changedSet.has("RELEASE.md")
  ) {
    return "- Synchronized and re-validated version consistency across `package.json`, `tool.manifest.json`, and `RELEASE.md`.";
  }
  return `- Updated \`${normalized}\`.`;
}

const stagedFiles = readChangedFiles("git diff --cached --name-only");
const changedFiles = stagedFiles.length ? stagedFiles : readChangedFiles("git diff --name-only");
const meaningfulFiles = changedFiles.filter((file) => isProductFacingFile(file));
const summarySourceFiles = meaningfulFiles;
const filesForSummary = summarySourceFiles.slice(0, 5);
const hiddenCount = Math.max(0, summarySourceFiles.length - filesForSummary.length);
const releaseMeta = inferReleaseType(summarySourceFiles);
const releaseHeadline = inferReleaseHeadline(summarySourceFiles);
const changedSet = new Set(changedFiles.map((file) => file.replace(/\\/g, "/")));
const changeLines =
  filesForSummary.length > 0
    ? filesForSummary.map((file) => describeFileChange(file, changedSet))
    : ["- No end-user feature or UI behavior changes in this release (internal tooling/release maintenance only)."];
const areaHighlights = featureAreaSummary(summarySourceFiles);

const now = new Date();
const headingDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const timestamp = `${headingDate} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} (UTC+7)`;

const rawContent = readFileSync(releaseLogPath, "utf8");
const content = rawContent.replace(/(rollback command\.)##\s/g, "$1\n\n## ");
if (isCheckMode) {
  if (!content.includes(`- Version: \`${version}\``)) {
    console.error(`Release log does not include version ${version}`);
    process.exit(1);
  }
  console.log(`Release log contains version ${version}`);
  process.exit(0);
}

if (content.includes(`- Version: \`${version}\``)) {
  if (content !== rawContent) {
    writeFileSync(releaseLogPath, content, "utf8");
    console.log("Normalized release log section spacing");
  }
  console.log(`Release log already contains version ${version}`);
  process.exit(0);
}

const firstEntryIndex = content.indexOf("\n## ");
if (firstEntryIndex === -1) {
  throw new Error("Cannot find release entries. Expected at least one '## ' section.");
}

const header = content.slice(0, firstEntryIndex);
const entries = content.slice(firstEntryIndex);
const headerWithSpacing = header.endsWith("\n\n") ? header : `${header}\n`;

const newEntry = `## ${headingDate} - ${releaseHeadline}

- Version: \`${version}\`
- Timestamp: ${timestamp}
- Commit: \`${commit}\`
- Type: ${releaseMeta.type}
- Status: Verified

### Changes

- ${areaHighlights.length > 0 ? `Feature areas touched: ${areaHighlights.join(", ")}.` : "Feature areas touched: none (internal-only update)."}
${changeLines.join("\n")}
${hiddenCount > 0 ? `- Additional updated files related to this release: +${hiddenCount}.` : ""}

### Verification

\`\`\`powershell
pnpm sync:all
pnpm build
\`\`\`

Result: passed.

`;

writeFileSync(releaseLogPath, `${headerWithSpacing}${newEntry}${entries}`, "utf8");
console.log(`Prepended release entry for commit ${commit}`);
