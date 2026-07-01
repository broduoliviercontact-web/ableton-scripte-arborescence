import * as esbuild from "esbuild";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("manifest.json", "utf8")) as {
  entry: string;
};
const production = process.argv.includes("--production");

await esbuild.build({
  entryPoints: ["src/index.ts"],
  outfile: manifest.entry,
  bundle: true,
  format: "cjs",
  platform: "node",
  sourcesContent: false,
  logLevel: "info",
  logOverride: {
    "empty-import-meta": "silent",
  },
  minify: production,
  sourcemap: !production,
});
