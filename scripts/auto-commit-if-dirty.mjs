import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

if (process.env.GPM_AUTO_COMMIT_RUNNING === "1") {
  console.log("Auto-commit guard is active; skipping.");
  process.exit(0);
}

function getPorcelain() {
  return execSync("git status --porcelain", { cwd: rootDir, encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

const changed = getPorcelain();
if (changed.length === 0) {
  console.log("No uncommitted changes; auto-commit skipped.");
  process.exit(0);
}

execSync("git add -A", { cwd: rootDir, stdio: "inherit" });

if (getPorcelain().length === 0) {
  console.log("No staged changes after add; auto-commit skipped.");
  process.exit(0);
}

const commitMessage = "chore: auto-commit synced changes";
execSync(`git commit -m "${commitMessage}"`, {
  cwd: rootDir,
  stdio: "inherit",
  env: { ...process.env, GPM_AUTO_COMMIT_RUNNING: "1" },
});
console.log("Auto-commit completed.");
