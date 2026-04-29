import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const checks = [];

function read(relPath) {
  return readFileSync(path.join(rootDir, relPath), "utf8");
}

function addCheck(ok, message) {
  checks.push({ ok, message });
}

addCheck(!existsSync(path.join(rootDir, "baocao.md")), "baocao.md should not exist");

const mainCjs = read("electron/main.cjs");
addCheck(!mainCjs.includes('ipcMain.handle("gpm:profile"'), 'Unused IPC handler "gpm:profile" should be removed');

const apiTs = read("src/api.ts");
addCheck(!apiTs.includes("export async function updateProfile("), 'Unused api.ts export "updateProfile" should be removed');

let failed = 0;
for (const check of checks) {
  if (check.ok) {
    console.log(`PASS: ${check.message}`);
  } else {
    console.error(`FAIL: ${check.message}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}
