import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Package the entry: copy the browser app and the screenshots into the
// output directory, then describe the bundle with a dossier.json.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appSource = join(repoRoot, 'app');
const appTarget = join(outputDir, 'app');
const shotsSource = join(repoRoot, 'screenshots');
const shotsTarget = join(outputDir, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(appSource, appTarget, { recursive: true });
mkdirSync(shotsTarget, { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsTarget, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
