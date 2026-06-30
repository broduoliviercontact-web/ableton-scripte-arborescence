import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import type { RackDiagnostic } from "./scanRackDiagnostic.js";
import type { CapabilityMatrix } from "./scanCapabilityMatrix.js";
import type { SdkDiagnostic } from "./scanDiagnostic.js";
import { safeGet, type SessionMap } from "./types.js";

const execFileAsync = promisify(execFile);

export interface ExportLocations {
  projectRoot: string;
  exportDirectory: string;
  sessionMapJsonPath: string;
  sessionMapHtmlPath: string;
  sessionGridHtmlPath: string;
  sessionMapDiagramsPath: string;
  sdkDiagnosticPath: string;
  rackDiagnosticPath: string;
  sdkCapabilityMatrixJsonPath: string;
  sdkCapabilityMatrixHtmlPath: string;
  sdkCapabilityMatrixMarkdownPath: string;
}

export interface SessionExportPaths {
  latestJsonPath: string;
  archiveJsonPath: string;
  latestHtmlPath: string;
  archiveHtmlPath: string;
}

export interface CapabilityMatrixExportPaths {
  latestJsonPath: string;
  archiveJsonPath: string;
  latestHtmlPath: string;
  archiveHtmlPath: string;
  latestMarkdownPath: string;
  archiveMarkdownPath: string;
}

export async function resolveExportLocations(
  context: ExtensionContext<"1.0.0">,
): Promise<ExportLocations> {
  const projectRoot = await safeGet(
    () => context.environment.storageDirectory,
    undefined,
    "environment.storageDirectory",
  );
  if (!projectRoot) {
    throw new Error("The extension storage directory is unavailable.");
  }

  const exportDirectory = join(projectRoot, "exports");
  return {
    projectRoot,
    exportDirectory,
    sessionMapJsonPath: join(exportDirectory, "session-map.json"),
    sessionMapHtmlPath: join(exportDirectory, "session-map.html"),
    sessionGridHtmlPath: join(exportDirectory, "session-map-session-grid.html"),
    sessionMapDiagramsPath: join(exportDirectory, "session-map-diagrams.html"),
    sdkDiagnosticPath: join(exportDirectory, "sdk-diagnostic.json"),
    rackDiagnosticPath: join(exportDirectory, "rack-diagnostic.json"),
    sdkCapabilityMatrixJsonPath: join(exportDirectory, "sdk-capability-matrix.json"),
    sdkCapabilityMatrixHtmlPath: join(exportDirectory, "sdk-capability-matrix.html"),
    sdkCapabilityMatrixMarkdownPath: join(exportDirectory, "sdk-capability-matrix.md"),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatArchiveTimestamp(dateLike: string, includeSeconds: boolean): string {
  const date = new Date(dateLike);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const timestamp = [
    safeDate.getFullYear(),
    pad(safeDate.getMonth() + 1),
    pad(safeDate.getDate()),
  ].join("-");
  const time = [pad(safeDate.getHours()), pad(safeDate.getMinutes())];
  if (includeSeconds) time.push(pad(safeDate.getSeconds()));
  return `${timestamp}_${time.join("-")}`;
}

function sanitizeFileToken(value: string | null | undefined): string {
  const normalized = (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/[^A-Za-z0-9._ -]/g, " ")
    .trim()
    .replace(/[ .]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  return normalized;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function buildArchiveBaseName(sessionMap: SessionMap): string {
  const setName = sanitizeFileToken(sessionMap.set.name);
  return setName
    ? `${setName}_Session-Map`
    : "Ableton-Session-Map";
}

async function reserveArchiveStem(
  exportDirectory: string,
  sessionMap: SessionMap,
): Promise<string> {
  const baseName = buildArchiveBaseName(sessionMap);
  const minuteStamp = formatArchiveTimestamp(sessionMap.exportedAt, false);
  const secondStamp = formatArchiveTimestamp(sessionMap.exportedAt, true);
  const candidates = [`${baseName}_${minuteStamp}`, `${baseName}_${secondStamp}`];

  for (const candidate of candidates) {
    const jsonCandidate = join(exportDirectory, `${candidate}.json`);
    const htmlCandidate = join(exportDirectory, `${candidate}.html`);
    if (!(await pathExists(jsonCandidate)) && !(await pathExists(htmlCandidate))) {
      return candidate;
    }
  }

  let suffix = 2;
  while (suffix < 10_000) {
    const candidate = `${baseName}_${secondStamp}-${suffix}`;
    const jsonCandidate = join(exportDirectory, `${candidate}.json`);
    const htmlCandidate = join(exportDirectory, `${candidate}.html`);
    if (!(await pathExists(jsonCandidate)) && !(await pathExists(htmlCandidate))) {
      return candidate;
    }
    suffix += 1;
  }

  throw new Error("Unable to reserve a unique archive filename.");
}

async function reserveGenericArchiveStem(
  exportDirectory: string,
  baseName: string,
  generatedAt: string,
  extensions: string[],
): Promise<string> {
  const minuteStamp = formatArchiveTimestamp(generatedAt, false);
  const secondStamp = formatArchiveTimestamp(generatedAt, true);
  const candidates = [`${baseName}_${minuteStamp}`, `${baseName}_${secondStamp}`];

  const candidateAvailable = async (candidate: string): Promise<boolean> => {
    for (const extension of extensions) {
      if (await pathExists(join(exportDirectory, `${candidate}.${extension}`))) {
        return false;
      }
    }
    return true;
  };

  for (const candidate of candidates) {
    if (await candidateAvailable(candidate)) return candidate;
  }

  let suffix = 2;
  while (suffix < 10_000) {
    const candidate = `${baseName}_${secondStamp}-${suffix}`;
    if (await candidateAvailable(candidate)) return candidate;
    suffix += 1;
  }

  throw new Error(`Unable to reserve a unique archive filename for ${baseName}.`);
}

export async function resolveSessionExportPaths(
  context: ExtensionContext<"1.0.0">,
  sessionMap: SessionMap,
): Promise<SessionExportPaths> {
  const locations = await resolveExportLocations(context);
  await mkdir(locations.exportDirectory, { recursive: true });
  const archiveStem = await reserveArchiveStem(locations.exportDirectory, sessionMap);
  return {
    latestJsonPath: locations.sessionMapJsonPath,
    archiveJsonPath: join(locations.exportDirectory, `${archiveStem}.json`),
    latestHtmlPath: locations.sessionMapHtmlPath,
    archiveHtmlPath: join(locations.exportDirectory, `${archiveStem}.html`),
  };
}

export async function resolveCapabilityMatrixExportPaths(
  context: ExtensionContext<"1.0.0">,
  matrix: CapabilityMatrix,
): Promise<CapabilityMatrixExportPaths> {
  const locations = await resolveExportLocations(context);
  await mkdir(locations.exportDirectory, { recursive: true });
  const archiveStem = await reserveGenericArchiveStem(
    locations.exportDirectory,
    "sdk-capability-matrix",
    matrix.generatedAt,
    ["json", "html", "md"],
  );
  return {
    latestJsonPath: locations.sdkCapabilityMatrixJsonPath,
    archiveJsonPath: join(locations.exportDirectory, `${archiveStem}.json`),
    latestHtmlPath: locations.sdkCapabilityMatrixHtmlPath,
    archiveHtmlPath: join(locations.exportDirectory, `${archiveStem}.html`),
    latestMarkdownPath: locations.sdkCapabilityMatrixMarkdownPath,
    archiveMarkdownPath: join(locations.exportDirectory, `${archiveStem}.md`),
  };
}

export async function exportJson(
  paths: SessionExportPaths,
  sessionMap: SessionMap,
): Promise<SessionExportPaths> {
  console.log(`[Ableton Session Mapper] Write JSON started: ${paths.latestJsonPath}`);
  console.log(`[Ableton Session Mapper] Write JSON exportedAt: ${sessionMap.exportedAt}`);
  const serialized = `${JSON.stringify(sessionMap, null, 2)}\n`;
  await writeFile(paths.latestJsonPath, serialized, "utf8");
  await writeFile(paths.archiveJsonPath, serialized, "utf8");
  const reread = JSON.parse(
    await readFile(paths.latestJsonPath, "utf8"),
  ) as { exportedAt?: string };
  console.log(
    `[Ableton Session Mapper] Write JSON latest completed: ${paths.latestJsonPath}`,
  );
  console.log(
    `[Ableton Session Mapper] Write JSON archive completed: ${paths.archiveJsonPath}`,
  );
  console.log(
    `[Ableton Session Mapper] Write JSON readback exportedAt: ${reread.exportedAt ?? "missing"}`,
  );
  return paths;
}

export async function generateHtml(
  context: ExtensionContext<"1.0.0">,
  jsonPath: string,
  paths: SessionExportPaths,
  diagnosticPath?: string,
): Promise<SessionExportPaths> {
  const locations = await resolveExportLocations(context);
  const generatorPath = join(locations.projectRoot, "viewer-simple", "generateHtml.ts");
  const tsxCliPath = join(locations.projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const args = [
    tsxCliPath,
    generatorPath,
    "--json",
    jsonPath,
    "--output",
    paths.latestHtmlPath,
  ];
  if (diagnosticPath) args.push("--diagnostic", diagnosticPath);
  await execFileAsync(process.execPath, args, { cwd: locations.projectRoot });
  const html = await readFile(paths.latestHtmlPath, "utf8");
  await writeFile(paths.archiveHtmlPath, html, "utf8");
  console.log(`[Ableton Session Mapper] Generate HTML latest completed: ${paths.latestHtmlPath}`);
  console.log(`[Ableton Session Mapper] Generate HTML archive completed: ${paths.archiveHtmlPath}`);
  return paths;
}

async function runTsxScript(
  projectRoot: string,
  scriptRelativePath: string,
  args: string[],
): Promise<void> {
  const tsxCliPath = join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const scriptPath = join(projectRoot, scriptRelativePath);
  await execFileAsync(process.execPath, [tsxCliPath, scriptPath, ...args], { cwd: projectRoot });
}

export async function generateSessionGrid(
  context: ExtensionContext<"1.0.0">,
  jsonPath: string,
): Promise<string> {
  const locations = await resolveExportLocations(context);
  await runTsxScript(locations.projectRoot, "session-grid/generateSessionGrid.ts", [
    "--json",
    jsonPath,
    "--output",
    locations.sessionGridHtmlPath,
  ]);
  return locations.sessionGridHtmlPath;
}

export async function generateDiagramsIndex(
  context: ExtensionContext<"1.0.0">,
  jsonPath: string,
): Promise<string> {
  const locations = await resolveExportLocations(context);
  await runTsxScript(locations.projectRoot, "launcher/generateDiagramsIndex.ts", [
    "--json",
    jsonPath,
    "--output",
    locations.sessionMapDiagramsPath,
  ]);
  return locations.sessionMapDiagramsPath;
}

export async function generateMermaidDiagrams(
  context: ExtensionContext<"1.0.0">,
): Promise<void> {
  const locations = await resolveExportLocations(context);

  await runTsxScript(locations.projectRoot, "mermaid/generateMermaid.ts", [
    "--profile",
    "flow",
    "--output",
    "exports/session-map-flow.mmd",
    "--file-suffix",
    "flow",
  ]);
  await runTsxScript(locations.projectRoot, "mermaid/renderMermaid.ts", [
    "--profile",
    "flow",
    "--input",
    "exports/session-map-flow.mmd",
    "--svg",
    "exports/session-map-flow.svg",
    "--png",
    "exports/session-map-flow.png",
    "--html",
    "exports/session-map-mermaid-flow.html",
    "--file-suffix",
    "flow",
  ]);

  await runTsxScript(locations.projectRoot, "mermaid/generateMermaid.ts", [
    "--profile",
    "git",
    "--output",
    "exports/session-map-git.mmd",
    "--file-suffix",
    "git",
  ]);
  await runTsxScript(locations.projectRoot, "mermaid/renderMermaid.ts", [
    "--profile",
    "git",
    "--input",
    "exports/session-map-git.mmd",
    "--svg",
    "exports/session-map-git.svg",
    "--png",
    "exports/session-map-git.png",
    "--html",
    "exports/session-map-mermaid-git.html",
    "--file-suffix",
    "git",
  ]);

  await runTsxScript(locations.projectRoot, "mermaid/generateMermaid.ts", [
    "--profile",
    "kanban",
    "--output",
    "exports/session-map-kanban.mmd",
    "--file-suffix",
    "kanban",
  ]);
  await runTsxScript(locations.projectRoot, "mermaid/renderMermaid.ts", [
    "--profile",
    "kanban",
    "--input",
    "exports/session-map-kanban.mmd",
    "--svg",
    "exports/session-map-kanban.svg",
    "--png",
    "exports/session-map-kanban.png",
    "--html",
    "exports/session-map-mermaid-kanban.html",
    "--file-suffix",
    "kanban",
  ]);
}

export async function exportDiagnosticJson(
  context: ExtensionContext<"1.0.0">,
  diagnostic: SdkDiagnostic,
): Promise<string> {
  const locations = await resolveExportLocations(context);
  await mkdir(locations.exportDirectory, { recursive: true });
  await writeFile(locations.sdkDiagnosticPath, `${JSON.stringify(diagnostic, null, 2)}\n`, "utf8");
  return locations.sdkDiagnosticPath;
}

export async function exportRackDiagnosticJson(
  context: ExtensionContext<"1.0.0">,
  diagnostic: RackDiagnostic,
): Promise<string> {
  const locations = await resolveExportLocations(context);
  await mkdir(locations.exportDirectory, { recursive: true });
  await writeFile(locations.rackDiagnosticPath, `${JSON.stringify(diagnostic, null, 2)}\n`, "utf8");
  return locations.rackDiagnosticPath;
}

export async function exportCapabilityMatrixArtifacts(
  paths: CapabilityMatrixExportPaths,
  matrix: CapabilityMatrix,
  html: string,
  markdown: string,
): Promise<CapabilityMatrixExportPaths> {
  await writeFile(paths.latestJsonPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
  await writeFile(paths.archiveJsonPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
  console.log(`[Ableton Session Mapper] Write capability matrix JSON completed: ${paths.latestJsonPath}`);
  await writeFile(paths.latestHtmlPath, html, "utf8");
  await writeFile(paths.archiveHtmlPath, html, "utf8");
  console.log(`[Ableton Session Mapper] Write capability matrix HTML completed: ${paths.latestHtmlPath}`);
  await writeFile(paths.latestMarkdownPath, markdown, "utf8");
  await writeFile(paths.archiveMarkdownPath, markdown, "utf8");
  console.log(`[Ableton Session Mapper] Write capability matrix Markdown completed: ${paths.latestMarkdownPath}`);
  return paths;
}
