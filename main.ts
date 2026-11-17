// DEEPHOOK hand-in: copies game/ and screenshots/ to the output directory and
// writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Run: node main.ts  (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader)
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

// The grader runs as uid 65534 with /output a root-owned mountpoint under a
// read-only parent: never remove the output dir itself, only its children.
mkdirSync(outDir, { recursive: true });
for (const child of readdirSync(outDir)) {
  rmSync(join(outDir, child), { recursive: true, force: true });
}

const gameSrc = join(root, 'game');
const shotsSrc = join(root, 'screenshots');
if (!existsSync(gameSrc)) throw new Error('game/ missing in ' + root);
if (!existsSync(shotsSrc)) throw new Error('screenshots/ missing in ' + root);

mkdirSync(join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('DEEPHOOK handed in: ' + outDir + ' (dossier ' + dossier.length + ' bytes)');
