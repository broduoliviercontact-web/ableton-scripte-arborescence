import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptsDirectory, "..");
const extensionRoot = join(workspaceRoot, "extension");
const releaseRoot = join(workspaceRoot, "release");
const stageDirectory = join(releaseRoot, "Session Mapper");
const stageDistDirectory = join(stageDirectory, "dist");
const stageAssetsDirectory = join(stageDirectory, "assets");
const npmBinary = process.platform === "win32" ? "npm.cmd" : "npm";
const extensionsCliBinary = process.platform === "win32"
  ? join(extensionRoot, "node_modules", ".bin", "extensions-cli.cmd")
  : join(extensionRoot, "node_modules", ".bin", "extensions-cli");

interface PackageJsonVersion {
  version: string;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadVersion(): Promise<string> {
  const rootPackage = JSON.parse(
    await readFile(join(workspaceRoot, "package.json"), "utf8"),
  ) as PackageJsonVersion;
  return rootPackage.version;
}

function releaseReadme(version: string): string {
  return `# Ableton Session Mapper v${version}

Installable Ableton Live extension package.

Contents:

- manifest.json
- dist/extension.js
- assets/viewer-simple/styles.css
- assets/vendor/mermaid.min.js

Install in Live:

1. Open Live Settings > Extensions.
2. Drag and drop the generated .ablx file from the release folder.
3. Restart or re-enable the extension if Live requests it.
4. Right-click in Live and run "Export Session Map".

Installed mode notes:

- exports are written to the SDK storage directory, not this release folder;
- SVG/PNG Mermaid renders remain optional manual dev exports;
- HTML Report, Session Grid, External Launcher and integrated modal remain available.
`;
}

async function cleanReleaseDirectory(): Promise<void> {
  await rm(releaseRoot, { recursive: true, force: true });
  console.log("[Ableton Session Mapper] Release directory cleaned");
}

async function runBuildRelease(): Promise<void> {
  console.log("[Ableton Session Mapper] Build release started");
  await execFileAsync(npmBinary, ["--prefix", "extension", "run", "build:release"], {
    cwd: workspaceRoot,
  });
}

async function stageReleaseFiles(version: string): Promise<{
  releaseAblxPath: string;
  releaseZipPath: string;
}> {
  console.log("[Ableton Session Mapper] Stage release started");
  await mkdir(stageDistDirectory, { recursive: true });
  await mkdir(join(stageAssetsDirectory, "viewer-simple"), { recursive: true });
  await mkdir(join(stageAssetsDirectory, "vendor"), { recursive: true });

  await copyFile(join(extensionRoot, "manifest.json"), join(stageDirectory, "manifest.json"));
  await copyFile(join(extensionRoot, "dist", "extension.js"), join(stageDistDirectory, "extension.js"));
  console.log("[Ableton Session Mapper] Extension dist copied");

  await copyFile(
    join(workspaceRoot, "viewer-simple", "styles.css"),
    join(stageAssetsDirectory, "viewer-simple", "styles.css"),
  );

  const mermaidRuntimePath = join(workspaceRoot, "node_modules", "mermaid", "dist", "mermaid.min.js");
  if (await pathExists(mermaidRuntimePath)) {
    await copyFile(
      mermaidRuntimePath,
      join(stageAssetsDirectory, "vendor", "mermaid.min.js"),
    );
  } else {
    console.warn(
      "[Ableton Session Mapper] Mermaid runtime missing at node_modules/mermaid/dist/mermaid.min.js. Installed Flow/Kanban HTML generation will be unavailable until npm install restores it.",
    );
  }

  await writeFile(join(stageDirectory, "README.md"), releaseReadme(version), "utf8");
  console.log("[Ableton Session Mapper] Manifest/package copied");

  return {
    releaseAblxPath: join(releaseRoot, `Ableton-Session-Mapper-v${version}.ablx`),
    releaseZipPath: join(releaseRoot, `Session-Mapper-v${version}.zip`),
  };
}

async function buildAblx(releaseAblxPath: string): Promise<void> {
  await execFileAsync(
    extensionsCliBinary,
    ["package", stageDirectory, "-o", releaseAblxPath, "-i", "README.md", "-i", "assets"],
    { cwd: workspaceRoot },
  );
  console.log("[Ableton Session Mapper] Release package completed");
}

async function buildZip(releaseZipPath: string): Promise<void> {
  if (process.platform !== "darwin") return;
  await execFileAsync("ditto", ["-c", "-k", "--keepParent", stageDirectory, releaseZipPath], {
    cwd: releaseRoot,
  });
  console.log("[Ableton Session Mapper] Release zip completed");
}

async function main(): Promise<void> {
  const cleanOnly = process.argv.includes("--clean");
  await cleanReleaseDirectory();
  if (cleanOnly) return;

  const version = await loadVersion();
  await runBuildRelease();
  const { releaseAblxPath, releaseZipPath } = await stageReleaseFiles(version);
  await buildAblx(releaseAblxPath);
  await buildZip(releaseZipPath);
  console.log(`[Ableton Session Mapper] Release folder: ${stageDirectory}`);
  console.log(`[Ableton Session Mapper] Release archive: ${releaseAblxPath}`);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[Ableton Session Mapper] Packaging failed: ${detail}`);
  if (error instanceof Error && error.stack) console.error(error.stack);
  process.exitCode = 1;
});
