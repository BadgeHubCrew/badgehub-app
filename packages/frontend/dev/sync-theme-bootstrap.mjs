import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");

const snippet = fs
  .readFileSync(path.join(__dirname, "theme-bootstrap-inline.js"), "utf8")
  .trim();

const startMarker = "<!-- __THEME_BOOTSTRAP_START__ -->";
const endMarker = "<!-- __THEME_BOOTSTRAP_END__ -->";
const replacement = `${startMarker}\n    <script>${snippet}</script>\n    ${endMarker}`;

const targets = ["index.html", "index-indirect-dev.html"];

for (const relativePath of targets) {
  const filePath = path.join(frontendRoot, relativePath);
  const source = fs.readFileSync(filePath, "utf8");

  const blockPattern = new RegExp(
    `${startMarker}[\\s\\S]*?${endMarker}`,
    "m"
  );

  if (!blockPattern.test(source)) {
    throw new Error(
      `Missing theme bootstrap markers in ${relativePath}. Expected ${startMarker} ... ${endMarker}.`
    );
  }

  const updated = source.replace(blockPattern, replacement);
  fs.writeFileSync(filePath, updated);
}
