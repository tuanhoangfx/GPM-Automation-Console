const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const pngToIcoModule = require("png-to-ico");
const pngToIco = typeof pngToIcoModule === "function" ? pngToIcoModule : pngToIcoModule.default;

const rootDir = path.resolve(__dirname, "..");
const inputSvg = path.join(rootDir, "src", "assets", "azure-defender-distributer-control-system.svg");
const outDir = path.join(rootDir, "build", "icons");
const outPng = path.join(outDir, "app.png");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  await sharp(inputSvg)
    .resize(256, 256, { fit: "contain" })
    .png()
    .toFile(outPng);

  const outIco = path.join(outDir, "app.ico");
  const icoBuffer = await pngToIco(outPng);
  fs.writeFileSync(outIco, icoBuffer);

  console.log(`Rendered icon: ${path.relative(rootDir, outPng)}`);
  console.log(`Rendered icon: ${path.relative(rootDir, outIco)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
