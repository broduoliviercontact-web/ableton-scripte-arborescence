import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { basename, dirname, join, relative } from "node:path";
import { promisify } from "node:util";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import { renderTemplate } from "../../viewer-simple/template.js";
import { writeSessionGridArtifact } from "../../session-grid/generateSessionGrid.js";
import { writeDiagramsIndex } from "../../launcher/diagramsIndexTemplate.js";
import { buildMetroModel, renderMetroHtml, renderMetroSvg, type MetroSessionMap } from "../../metro/generateMetroView.js";
import { generateDiagramForProfile, type MermaidProfile, writeMermaidArtifact } from "../../mermaid/generateMermaid.js";
import { writeMermaidHtmlArtifact } from "../../mermaid/generateMermaidHtml.js";
import type { RackDiagnostic } from "./scanRackDiagnostic.js";
import type { CapabilityMatrix } from "./scanCapabilityMatrix.js";
import type { SdkDiagnostic } from "./scanDiagnostic.js";
import { APP_VERSION } from "./appInfo.js";
import { resolveRuntimePaths, type RuntimeMode } from "./runtimePaths.js";
import { safeGet, type ChainInfo, type DeviceInfo, type PadInfo, type SessionMap } from "./types.js";

const execFileAsync = promisify(execFile);

export interface ExportLocations {
  runtimeMode: RuntimeMode;
  extensionRoot: string;
  storageRoot: string;
  projectRoot: string;
  exportDirectory: string;
  assetsDirectory: string;
  configDirectory: string;
  viewerStylesPath: string;
  mermaidRuntimePath: string | null;
  workspaceRoot: string | null;
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
  const runtimePaths = await resolveRuntimePaths(context);
  const exportDirectory = runtimePaths.exportDirectory;
  return {
    runtimeMode: runtimePaths.runtimeMode,
    extensionRoot: runtimePaths.extensionRoot,
    storageRoot: runtimePaths.storageRoot,
    projectRoot: runtimePaths.projectRoot,
    exportDirectory,
    assetsDirectory: runtimePaths.assetsDirectory,
    configDirectory: runtimePaths.configDirectory,
    viewerStylesPath: runtimePaths.viewerStylesPath,
    mermaidRuntimePath: runtimePaths.mermaidRuntimePath,
    workspaceRoot: runtimePaths.workspaceRoot,
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

function logPath(basePath: string, path: string): string {
  const rel = relative(basePath, path);
  return rel && !rel.startsWith("..") ? rel : path;
}

const MAX_VIEWER_RACK_DEPTH = 3;
const MAX_VIEWER_CHAINS_PER_RACK = 64;
const MAX_VIEWER_DEVICES_PER_STRUCTURE = 32;
const MAX_VIEWER_PARAMETERS_PER_DEVICE = 16;

function sanitizeDevices(
  devices: DeviceInfo[] | undefined,
  depth: number,
): DeviceInfo[] {
  return (devices ?? []).slice(0, MAX_VIEWER_DEVICES_PER_STRUCTURE).map((device) => {
    const nextDepth = depth + 1;
    const allowNested = nextDepth < MAX_VIEWER_RACK_DEPTH;
    const sanitizedChains: ChainInfo[] = allowNested
      ? (device.chains ?? []).slice(0, MAX_VIEWER_CHAINS_PER_RACK).map((chain) => ({
          ...chain,
          devices: sanitizeDevices(chain.devices, nextDepth),
        }))
      : [];
    const sanitizedPads: PadInfo[] = allowNested
      ? (device.pads ?? []).slice(0, MAX_VIEWER_CHAINS_PER_RACK).map((pad) => ({
          ...pad,
          devices: sanitizeDevices(pad.devices, nextDepth),
        }))
      : [];

    return {
      ...device,
      parameters: (device.parameters ?? []).slice(0, MAX_VIEWER_PARAMETERS_PER_DEVICE),
      chains: sanitizedChains,
      pads: sanitizedPads,
    };
  });
}

function sanitizeSessionMapForViewer(data: SessionMap): SessionMap {
  const sanitizeTrack = (track: SessionMap["tracks"][number]): SessionMap["tracks"][number] => ({
    ...track,
    devices: sanitizeDevices(track.devices, 0),
  });

  return {
    ...data,
    tracks: data.tracks.map(sanitizeTrack),
    returnTracks: data.returnTracks.map(sanitizeTrack),
    masterTrack: data.masterTrack ? sanitizeTrack(data.masterTrack) : null,
  };
}

async function readOptionalDiagnostic(path: string | undefined): Promise<SdkDiagnostic | null> {
  if (!path) return null;
  try {
    return JSON.parse(await readFile(path, "utf8")) as SdkDiagnostic;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function readSessionMap(jsonPath: string): Promise<SessionMap> {
  return JSON.parse(await readFile(jsonPath, "utf8")) as SessionMap;
}

async function writeLatestAndArchiveHtml(
  latestPath: string,
  archivePath: string,
  html: string,
): Promise<void> {
  await writeFile(latestPath, html, "utf8");
  await writeFile(archivePath, html, "utf8");
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
  const [sessionMap, styles, diagnostic] = await Promise.all([
    readSessionMap(jsonPath),
    readFile(locations.viewerStylesPath, "utf8"),
    readOptionalDiagnostic(diagnosticPath),
  ]);
  const html = renderTemplate(
    sanitizeSessionMapForViewer(sessionMap),
    styles,
    diagnostic,
  );
  await writeLatestAndArchiveHtml(paths.latestHtmlPath, paths.archiveHtmlPath, html);
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
  await writeSessionGridArtifact({
    jsonPath,
    outputPath: locations.sessionGridHtmlPath,
    logPrefix: "[session-grid]",
    rootDirectory: locations.projectRoot,
  });
  return locations.sessionGridHtmlPath;
}

export async function generateDiagramsIndex(
  context: ExtensionContext<"1.0.0">,
  jsonPath: string,
): Promise<string> {
  const locations = await resolveExportLocations(context);
  await writeDiagramsIndex({
    jsonPath,
    outputPath: locations.sessionMapDiagramsPath,
    rootDirectory: locations.projectRoot,
  });
  return locations.sessionMapDiagramsPath;
}

export async function generateMermaidDiagrams(
  context: ExtensionContext<"1.0.0">,
): Promise<void> {
  const locations = await resolveExportLocations(context);
  if (locations.runtimeMode !== "dev" || !locations.workspaceRoot) {
    console.log(
      "[Ableton Session Mapper] Mermaid SVG/PNG render skipped: available in dev/export workflow only.",
    );
    return;
  }

  await runTsxScript(locations.workspaceRoot, "mermaid/generateMermaid.ts", [
    "--profile",
    "flow",
    "--output",
    "exports/session-map-flow.mmd",
    "--file-suffix",
    "flow",
  ]);
  await runTsxScript(locations.workspaceRoot, "mermaid/renderMermaid.ts", [
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

  await runTsxScript(locations.workspaceRoot, "mermaid/generateMermaid.ts", [
    "--profile",
    "git",
    "--output",
    "exports/session-map-git.mmd",
    "--file-suffix",
    "git",
  ]);
  await runTsxScript(locations.workspaceRoot, "mermaid/renderMermaid.ts", [
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

  await runTsxScript(locations.workspaceRoot, "mermaid/generateMermaid.ts", [
    "--profile",
    "kanban",
    "--output",
    "exports/session-map-kanban.mmd",
    "--file-suffix",
    "kanban",
  ]);
  await runTsxScript(locations.workspaceRoot, "mermaid/renderMermaid.ts", [
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

export async function generateMermaidHtmlArtifacts(
  context: ExtensionContext<"1.0.0">,
): Promise<void> {
  const locations = await resolveExportLocations(context);
  const sessionMap = await readSessionMap(locations.sessionMapJsonPath);
  const diagramProfiles: MermaidProfile[] = ["flow", "git", "kanban"];

  for (const diagramProfile of diagramProfiles) {
    const fileSuffix = diagramProfile;
    const latestMmdPath = join(
      locations.exportDirectory,
      diagramProfile === "flow"
        ? "session-map-flow.mmd"
        : diagramProfile === "git"
          ? "session-map-git.mmd"
          : "session-map-kanban.mmd",
    );

    const mermaidPaths = await writeMermaidArtifact({
      jsonPath: locations.sessionMapJsonPath,
      outputPath: latestMmdPath,
      profile: diagramProfile,
      fileSuffix,
      logPrefix: diagramProfile === "flow" ? "[mermaid]" : `[mermaid:${diagramProfile}]`,
      rootDirectory: locations.projectRoot,
    });

    if (diagramProfile === "git") {
      const metroModel = buildMetroModel(sessionMap as unknown as MetroSessionMap);
      const metroHtml = renderMetroHtml(metroModel, {
        mmdFileName: basename(mermaidPaths.latestPath),
        svgFileName: "session-map-git.svg",
        pngFileName: "session-map-git.png",
      });
      await writeFile(join(locations.exportDirectory, "session-map-mermaid-git.html"), metroHtml, "utf8");
      await writeFile(join(locations.exportDirectory, "session-map-git.svg"), renderMetroSvg(metroModel), "utf8");
      continue;
    }

    if (!locations.mermaidRuntimePath) {
      console.log(
        `[Ableton Session Mapper] Mermaid HTML skipped for ${diagramProfile}: mermaid runtime unavailable in current runtime.`,
      );
      continue;
    }

    await writeMermaidHtmlArtifact({
      profile: diagramProfile,
      inputPath: mermaidPaths.latestPath,
      outputPath: join(
        locations.exportDirectory,
        diagramProfile === "flow"
          ? "session-map-mermaid-flow.html"
          : "session-map-mermaid-kanban.html",
      ),
      mermaidRuntimePath: locations.mermaidRuntimePath,
      logPrefix: `[mermaid-html:${diagramProfile}]`,
      rootDirectory: locations.projectRoot,
    });
  }
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
