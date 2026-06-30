import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeDiagramsIndex } from "./diagramsIndexTemplate.js";

const launcherDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(launcherDirectory, "..");

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const jsonPath = resolve(argumentValue("--json") ?? resolve(rootDirectory, "exports/session-map.json"));
const outputPath = resolve(
  argumentValue("--output") ?? resolve(rootDirectory, "exports/session-map-diagrams.html"),
);

function logPath(path: string): string {
  const rel = relative(rootDirectory, path);
  return rel && !rel.startsWith("..") ? rel : path;
}

async function main(): Promise<void> {
  console.log(`[launcher] Read JSON started: ${logPath(jsonPath)}`);
  console.log("[launcher] Generate Diagrams Index started");
  await writeDiagramsIndex({
    jsonPath,
    outputPath,
    rootDirectory,
  });
  console.log(`[launcher] Generate Diagrams Index completed: ${logPath(outputPath)}`);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[launcher] Generation failed: ${detail}`);
  process.exitCode = 1;
});
