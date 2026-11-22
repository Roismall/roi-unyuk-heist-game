// Meridian Heist — hand-in program.
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with the kit's dossier builder. Node 22 stdlib only.
import { buildDossier } from "./vendor/makefun-game.ts";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
cpSync("game", join(outDir, "game"), { recursive: true });
if (existsSync("screenshots")) {
  cpSync("screenshots", join(outDir, "screenshots"), { recursive: true });
}
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots_max: 4,
  screenshots_max_bytes: 262144,
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log("wrote " + join(outDir, "dossier.json"));
