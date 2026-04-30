import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconsDir = join(root, "public", "icons");

const svg = await readFile(join(iconsDir, "icon.svg"));

const targets = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

for (const { size, name } of targets) {
  const out = join(iconsDir, name);
  const buf = await sharp(svg).resize(size, size).png().toBuffer();
  await writeFile(out, buf);
  console.log(`wrote ${name} (${size}×${size})`);
}
