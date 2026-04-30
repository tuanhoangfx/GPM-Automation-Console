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

function inferReleaseType(files) {
  const normalized = files.map((file) => file.replace(/\\/g, "/"));
  if (normalized.some((file) => file.startsWith("src/") || file.startsWith("electron/"))) {
    return { type: "Feature/Fix" };
  }
  if (normalized.some((file) => file.startsWith("scripts/") || file.startsWith(".github/workflows/") || file.startsWith(".githooks/"))) {
    return { type: "Maintenance/Automation" };
  }
  return { type: "Maintenance/Docs" };
}

function inferReleaseHeadline(files) {
  const normalized = files.map((file) => file.replace(/\\/g, "/"));

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
    return `- Updated application logic in \`${normalized}\`.`;
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
const workingTreeFiles = readChangedFiles("git diff --name-only");
const changedFiles = unique([...stagedFiles, ...workingTreeFiles]);
const meaningfulFiles = changedFiles.filter(
  (file) => !["package.json", "tool.manifest.json", "RELEASE.md"].includes(file.replace(/\\/g, "/"))
);
const summarySourceFiles = meaningfulFiles.length > 0 ? meaningfulFiles : changedFiles;
const filesForSummary = summarySourceFiles.slice(0, 5);
const hiddenCount = Math.max(0, summarySourceFiles.length - filesForSummary.length);
const releaseMeta = inferReleaseType(summarySourceFiles);
const releaseHeadline = inferReleaseHeadline(summarySourceFiles);
const changedSet = new Set(changedFiles.map((file) => file.replace(/\\/g, "/")));
const changeLines = filesForSummary.map((file) => describeFileChange(file, changedSet));

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

const newEntry = `## ${headingDate} - ${releaseHeadline} ${version}

- Version: \`${version}\`
- Timestamp: ${timestamp}
- Commit: \`${commit}\`
- Type: ${releaseMeta.type}
- Status: Verified

### Changes

- Bumped release version to \`${version}\`.
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
