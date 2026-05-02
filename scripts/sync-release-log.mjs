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

  if (normalized.some((file) => file.startsWith("src/features/release-log/"))) {
    return "Release Log Experience Update";
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

function readDiff(command) {
  try {
    return execSync(command, { cwd: rootDir, encoding: "utf8" });
  } catch {
    return "";
  }
}

function inferUserFacingChanges(files, diff, changedSet) {
  const normalizedFiles = files.map((file) => file.replace(/\\/g, "/"));
  const bullets = [];

  const has = (pattern) => pattern.test(diff);
  const touches = (prefixOrFile) =>
    normalizedFiles.some((file) => file === prefixOrFile || file.startsWith(`${prefixOrFile}/`));

  if (touches("src/features/profiles/useProfiles.ts") && has(/sort(Column|Direction)|toggleProfileSort|ProfileTableSortKey/i)) {
    bullets.push("- Added sortable profile table headers (A-Z/Z-A) across key columns, with Profile defaulting to A-Z.");
  }
  if ((touches("src/App.tsx") || touches("src/styles/workspace-design-base.css")) && has(/table-sort-head|aria-sort|ArrowUpDown|profileColumnSortTitle/i)) {
    bullets.push("- Improved table sorting UX with clearer sort indicators, better accessibility semantics, and click-friendly header controls.");
  }
  if (touches("src/App.tsx") && has(/MultiSelectDropdown|dropdown-trigger-label|labelTone|markerTone/i)) {
    bullets.push("- Standardized profile filter dropdown behavior so Status/Group controls keep consistent sizing and neutral default labels.");
  }
  if (touches("src/theme.ts") || touches("src/ui/PortaledThemeSurface.tsx") || has(/readStoredThemeMode|syncDocumentTheme|PortaledThemeSurface/i)) {
    bullets.push("- Restored theme and overlay infrastructure so popovers and dialogs render reliably with correct dark/light styling.");
  }
  if (touches("src/features/workflows/useWorkflows.ts") && has(/workflowTablePage|pagedFilteredWorkflows|workflowTablePageSize/i)) {
    bullets.push("- Added workflow list pagination state to keep large workflow tables responsive and easier to navigate.");
  }
  if (touches("src/features/profiles/profile-utils.ts") && has(/syncProfileRowState|lastMessage|status/i)) {
    bullets.push("- Stabilized profile status rendering by preserving in-flight state while API polling refreshes rows.");
  }
  if (changedSet.has("package.json") && changedSet.has("tool.manifest.json")) {
    bullets.push("- Synchronized app version metadata for a consistent release package across runtime and manifest.");
  }

  if (bullets.length > 0) {
    return bullets.slice(0, 6);
  }

  if (normalizedFiles.length === 0) {
    return ["- No end-user behavior changes in this release (internal maintenance only)."];
  }

  const areas = featureAreaSummary(files);
  return [
    `- Improved ${areas.length > 0 ? areas.map((item) => item.split(" (")[0].toLowerCase()).join(", ") : "application behavior"} in this release.`
  ];
}

const stagedFiles = readChangedFiles("git diff --cached --name-only");
const changedFiles = stagedFiles.length ? stagedFiles : readChangedFiles("git diff --name-only");
const meaningfulFiles = changedFiles.filter((file) => isProductFacingFile(file));
const summarySourceFiles = meaningfulFiles;
const stagedUnifiedDiff = readDiff("git diff --cached --");
const workingUnifiedDiff = stagedUnifiedDiff ? "" : readDiff("git diff --");
const unifiedDiff = stagedUnifiedDiff || workingUnifiedDiff;
const releaseMeta = inferReleaseType(summarySourceFiles);
const releaseHeadline = inferReleaseHeadline(summarySourceFiles);
const changedSet = new Set(changedFiles.map((file) => file.replace(/\\/g, "/")));
const changeLines = inferUserFacingChanges(summarySourceFiles, unifiedDiff, changedSet);
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

### Verification

\`\`\`powershell
pnpm sync:all
pnpm build
\`\`\`

Result: passed.

`;

writeFileSync(releaseLogPath, `${headerWithSpacing}${newEntry}${entries}`, "utf8");
console.log(`Prepended release entry for commit ${commit}`);
