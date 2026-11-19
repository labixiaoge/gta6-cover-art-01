import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Entry point: package the browser app and its screenshots into the output
// directory, then write the dossier the judge reads. Run it twice and the
// two dossiers are byte-identical.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps for the bundle: text, screenshots, app size and paths.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

// Fail fast when a piece the dossier needs is missing, naming the path.
function requireEntry(path, what) {
  if (!existsSync(path)) throw new Error(`missing ${what}: ${path}`);
}

// Count the files under a directory, so the run can say what it packaged.
function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) total += countFiles(join(dir, entry.name));
    else total += 1;
  }
  return total;
}

// Copy a whole directory when it exists; an absent one leaves an empty
// target behind instead of failing the run.
function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

// Confirm the dossier we just wrote is a JSON object of a sane size, so a
// silent failure can never pass for a success. Parse it back: a truncated
// or corrupt dossier must fail loudly here, not at the gate.
function verifyDossier(dossierPath) {
  const bytes = statSync(dossierPath).size;
  const text = readFileSync(dossierPath, 'utf8');
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('dossier is not a JSON object');
  if (bytes > 1572864) throw new Error(`dossier too large: ${bytes} bytes`);
  return bytes;
}

function main() {
  requireEntry(join(repoRoot, 'app', 'index.html'), 'app entry');
  requireEntry(join(repoRoot, 'screenshots'), 'screenshots folder');
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

  const appFiles = countFiles(join(outputDir, 'app'));
  const shotFiles = countFiles(join(outputDir, 'screenshots'));
  const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  const bytes = verifyDossier(dossierPath);
  console.log(`packaged ${appFiles} app files and ${shotFiles} screenshots`);
  console.log(`wrote ${dossierPath} (${bytes} bytes)`);
}

main();
