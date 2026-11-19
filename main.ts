import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Entry point: package the browser app and its screenshots into the
// output directory, then write the dossier the judge reads.
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

// Copy a whole directory when it exists; an absent one leaves an empty
// target behind instead of failing the run.
function copyDir(source, target) {
  mkdirSync(target, { recursive: true });
  if (existsSync(source)) cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyDir(join(repoRoot, 'app'), join(outputDir, 'app'));
copyDir(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
// Confirm the run produced a dossier and say how big it is, so a silent
// failure can never pass for a success. Parse it back as JSON too: a
// truncated or corrupt dossier must fail loudly here, not at the gate.
const dossierBytes = statSync(dossierPath).size;
const dossierText = readFileSync(dossierPath, 'utf8');
const parsed = JSON.parse(dossierText);
if (typeof parsed !== 'object' || parsed === null) throw new Error('dossier is not a JSON object');
console.log(`wrote ${dossierPath} (${dossierBytes} bytes)`);
