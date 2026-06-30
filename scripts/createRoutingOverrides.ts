import { access, copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";

interface SendInfo {
  name: string;
  value: number | null;
}

interface TrackInfo {
  index: number;
  name: string;
  kind: TrackKind;
  sends: SendInfo[];
}

interface SessionMap {
  version: string;
  exportedAt: string;
  tracks: TrackInfo[];
  returnTracks: TrackInfo[];
  masterTrack: TrackInfo | null;
}

interface RoutingOverrideTrackTemplate {
  kind: TrackKind | null;
  midiFrom: string | null;
  midiTo: string | null;
  audioFrom: string | null;
  audioTo: string | null;
  monitor: string | null;
  sends: Record<string, number | null>;
  group: string | null;
  notes: string;
}

interface RoutingOverridesTemplate {
  version: "1.0.0";
  generatedAt: string;
  source: "manual-routing-overrides";
  notes: string;
  tracks: Record<string, RoutingOverrideTrackTemplate>;
  sidechains: Array<{
    targetTrack: string;
    targetDevice: string;
    sourceTrack: string;
    enabled: boolean | null;
    notes: string;
  }>;
  connections: Array<{
    from: string;
    to: string;
    type: "audio" | "midi" | "sidechain" | "unknown";
    label: string;
  }>;
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(scriptDirectory, "..");
const exportsDirectory = resolve(rootDirectory, "exports");
const sessionMapPath = resolve(exportsDirectory, "session-map.json");
const routingOverridesPath = resolve(exportsDirectory, "routing-overrides.json");
const logPrefix = "[routing-overrides]";

function formatTimestampParts(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function orderedTracks(sessionMap: SessionMap): TrackInfo[] {
  return [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];
}

function buildTrackTemplate(track: TrackInfo, returnNames: string[]): RoutingOverrideTrackTemplate {
  const sends = Object.fromEntries(returnNames.map((name) => [name, null]));

  if (track.kind === "return") {
    return {
      kind: track.kind,
      midiFrom: null,
      midiTo: null,
      audioFrom: "Sends",
      audioTo: null,
      monitor: null,
      sends: {},
      group: null,
      notes: "Fill manually from Ableton I/O",
    };
  }

  if (track.kind === "master") {
    return {
      kind: track.kind,
      midiFrom: null,
      midiTo: null,
      audioFrom: "Tracks + Returns",
      audioTo: null,
      monitor: null,
      sends: {},
      group: null,
      notes: "Fill manually from Ableton I/O",
    };
  }

  return {
    kind: track.kind,
    midiFrom: null,
    midiTo: null,
    audioFrom: null,
    audioTo: null,
    monitor: null,
    sends,
    group: null,
    notes: "Fill manually from Ableton I/O",
  };
}

function buildTemplate(sessionMap: SessionMap): RoutingOverridesTemplate {
  const returnNames = sessionMap.returnTracks.map((track) => track.name);

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    source: "manual-routing-overrides",
    notes: "Manual routing information because the SDK does not expose routing I/O in the current scan.",
    tracks: Object.fromEntries(
      orderedTracks(sessionMap).map((track) => [track.name, buildTrackTemplate(track, returnNames)]),
    ),
    sidechains: [],
    connections: [],
  };
}

async function readSessionMap(): Promise<SessionMap> {
  if (!(await pathExists(sessionMapPath))) {
    throw new Error(`Latest session-map.json not found at ${sessionMapPath}`);
  }

  const raw = await readFile(sessionMapPath, "utf8");
  console.log(`${logPrefix} Read session-map.json completed`);
  return JSON.parse(raw) as SessionMap;
}

async function createBackupPath(): Promise<string> {
  const base = formatTimestampParts();
  let candidate = resolve(exportsDirectory, `routing-overrides_${base}.backup.json`);
  let suffix = 1;

  while (await pathExists(candidate)) {
    candidate = resolve(exportsDirectory, `routing-overrides_${base}_${suffix}.backup.json`);
    suffix += 1;
  }

  return candidate;
}

async function backupExistingRoutingOverrides(): Promise<string | null> {
  if (!(await pathExists(routingOverridesPath))) {
    console.log(`${logPrefix} No existing routing-overrides.json found`);
    return null;
  }

  console.log(`${logPrefix} Existing routing-overrides.json found`);
  const backupPath = await createBackupPath();
  await copyFile(routingOverridesPath, backupPath);
  console.log(`${logPrefix} Backup created: ${backupPath}`);
  return backupPath;
}

async function readPreviousTrackNames(): Promise<string[]> {
  if (!(await pathExists(routingOverridesPath))) {
    return [];
  }

  try {
    const raw = await readFile(routingOverridesPath, "utf8");
    const parsed = JSON.parse(raw) as { tracks?: Record<string, unknown> };
    return Object.keys(parsed.tracks ?? {});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`${logPrefix} Could not parse existing routing-overrides.json for diff: ${message}`);
    return [];
  }
}

function logTrackDiff(previousTrackNames: string[], currentTrackNames: string[]): void {
  if (previousTrackNames.length === 0 && currentTrackNames.length === 0) {
    return;
  }

  const previousSet = new Set(previousTrackNames);
  const currentSet = new Set(currentTrackNames);
  const removed = previousTrackNames.filter((name) => !currentSet.has(name));
  const added = currentTrackNames.filter((name) => !previousSet.has(name));

  console.log(`${logPrefix} Previous tracks:`);
  for (const name of previousTrackNames) {
    console.log(`${logPrefix} - ${name}`);
  }

  console.log(`${logPrefix} Current tracks:`);
  for (const name of currentTrackNames) {
    console.log(`${logPrefix} - ${name}`);
  }

  if (removed.length > 0) {
    console.log(`${logPrefix} Removed / missing from current set:`);
    for (const name of removed) {
      console.log(`${logPrefix} - ${name}`);
    }
  }

  if (added.length > 0) {
    console.log(`${logPrefix} New tracks:`);
    for (const name of added) {
      console.log(`${logPrefix} - ${name}`);
    }
  }
}

async function writeRoutingOverrides(template: RoutingOverridesTemplate): Promise<void> {
  await writeFile(routingOverridesPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
  console.log(`${logPrefix} New routing-overrides.json created`);
}

async function runCreate(force: boolean): Promise<void> {
  console.log(`${logPrefix} Create routing overrides template started`);

  if (!force && (await pathExists(routingOverridesPath))) {
    console.log(`${logPrefix} routing-overrides.json already exists`);
    return;
  }

  const previousTrackNames = force ? await readPreviousTrackNames() : [];
  const sessionMap = await readSessionMap();

  if (force) {
    await backupExistingRoutingOverrides();
  }

  const template = buildTemplate(sessionMap);
  await writeRoutingOverrides(template);

  if (force) {
    logTrackDiff(previousTrackNames, Object.keys(template.tracks));
  }

  console.log(`${logPrefix} Create routing overrides template completed: ${routingOverridesPath}`);
}

async function runRefresh(): Promise<void> {
  console.log(`${logPrefix} Routing overrides refresh started`);

  const previousTrackNames = await readPreviousTrackNames();
  const sessionMap = await readSessionMap();
  await backupExistingRoutingOverrides();

  const template = buildTemplate(sessionMap);
  await writeRoutingOverrides(template);
  logTrackDiff(previousTrackNames, Object.keys(template.tracks));

  console.log(`${logPrefix} Routing overrides refresh completed`);
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const refresh = args.has("--refresh");
  const force = args.has("--force");

  if (refresh) {
    await runRefresh();
    return;
  }

  await runCreate(force);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`${logPrefix} ${message}`);
  process.exitCode = 1;
});
