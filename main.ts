import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
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

// Walk a directory and return every file under it as a path relative to
// the directory, sorted, so the report is stable between runs.
function walk(dir, base = dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, base));
    else found.push(relative(base, full));
  }
  return found.sort();
}

// Fail fast when a piece the dossier needs is missing, naming the path.
function requireEntry(path, what) {
  if (!existsSync(path)) throw new Error(`missing ${what}: ${path}`);
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

// The screenshots must be exactly four real JPEGs, each big enough to
// be a picture rather than a blank frame; a missing or empty shot fails
// the run here, not at the gate.
function checkShots(shotDir) {
  const names = walk(shotDir);
  if (names.length !== 4) throw new Error(`expected 4 screenshots, found ${names.length}`);
  for (const name of names) {
    if (!name.endsWith('.jpg')) throw new Error(`screenshot is not a JPEG: ${name}`);
    const bytes = statSync(join(shotDir, name)).size;
    if (bytes < 10000) throw new Error(`screenshot too small (${bytes} bytes): ${name}`);
  }
  return names;
}

// Stage report: what went into the output, so a run can say what it did.
function stageReport(appFiles, shotFiles) {
  console.log(`stage: app ${appFiles.length} files, screenshots ${shotFiles.length} files`);
  for (const name of shotFiles) console.log(`stage: screenshot ${name}`);
}

function main() {
  requireEntry(join(repoRoot, 'app', 'index.html'), 'app entry');
  requireEntry(join(repoRoot, 'screenshots'), 'screenshots folder');
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

  const appFiles = walk(join(outputDir, 'app'));
  const shotFiles = checkShots(join(outputDir, 'screenshots'));
  stageReport(appFiles, shotFiles);

  const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  const bytes = verifyDossier(dossierPath);
  console.log(`packaged ${appFiles.length} app files and ${shotFiles.length} screenshots`);
  console.log(`wrote ${dossierPath} (${bytes} bytes)`);
}

main();
