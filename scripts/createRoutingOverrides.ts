import { access, readFile, writeFile } from "node:fs/promises";
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

interface RoutingOverridesTemplate {
  version: "1.0.0";
  generatedAt: string;
  source: "manual-routing-overrides";
  notes: string;
  tracks: Record<string, {
    kind: TrackKind | null;
    midiFrom: string | null;
    midiTo: string | null;
    audioFrom: string | null;
    audioTo: string | null;
    monitor: string | null;
    sends: Record<string, number | null>;
    group: string | null;
    notes: string;
  }>;
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

function buildTrackTemplate(track: TrackInfo, returnNames: string[]) {
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
      notes: "Placeholder. Fill manually from Ableton I/O.",
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
      notes: "Placeholder. Fill manually from Ableton I/O.",
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
    notes: "Fill manually from Ableton I/O.",
  };
}

async function main(): Promise<void> {
  console.log(`${logPrefix} Create routing overrides template started`);

  if (!(await pathExists(sessionMapPath))) {
    throw new Error(`Latest session-map.json not found at ${sessionMapPath}`);
  }

  if (await pathExists(routingOverridesPath)) {
    console.log(`${logPrefix} routing-overrides.json already exists`);
    return;
  }

  const sessionMap = JSON.parse(await readFile(sessionMapPath, "utf8")) as SessionMap;
  const returnNames = sessionMap.returnTracks.map((track) => track.name);
  const template: RoutingOverridesTemplate = {
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

  await writeFile(routingOverridesPath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
  console.log(`${logPrefix} Create routing overrides template completed: ${routingOverridesPath}`);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`${logPrefix} ${message}`);
  process.exitCode = 1;
});
