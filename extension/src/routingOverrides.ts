import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  ManualRoutingConnection,
  ManualRoutingOverrideTrack,
  ManualRoutingSidechain,
  ManualRoutingState,
  SessionMap,
  TrackInfo,
  TrackRoutingInfo,
  TrackKind,
} from "./types.js";

const ROUTING_OVERRIDES_FILE_NAME = "routing-overrides.json";

interface ManualRoutingOverrideFile {
  version?: string;
  generatedAt?: string;
  source?: string;
  notes?: string;
  tracks?: Record<string, Partial<ManualRoutingOverrideTrack>>;
  sidechains?: Array<Partial<ManualRoutingSidechain>>;
  connections?: Array<Partial<ManualRoutingConnection>>;
}

function emptyTrackOverride(kind: TrackKind | null = null): ManualRoutingOverrideTrack {
  return {
    kind,
    midiFrom: null,
    midiTo: null,
    audioFrom: null,
    audioTo: null,
    monitor: null,
    sends: {},
    group: null,
    notes: "",
  };
}

function normalizeTrackOverride(
  name: string,
  input: Partial<ManualRoutingOverrideTrack> | undefined,
): ManualRoutingOverrideTrack {
  const base = emptyTrackOverride(input?.kind ?? null);
  const sends =
    input?.sends && typeof input.sends === "object" && !Array.isArray(input.sends)
      ? Object.fromEntries(
          Object.entries(input.sends).map(([sendName, value]) => [
            sendName,
            typeof value === "number" ? value : value === null ? null : null,
          ]),
        )
      : {};
  return {
    kind: input?.kind ?? base.kind,
    midiFrom: typeof input?.midiFrom === "string" ? input.midiFrom : null,
    midiTo: typeof input?.midiTo === "string" ? input.midiTo : null,
    audioFrom: typeof input?.audioFrom === "string" ? input.audioFrom : null,
    audioTo: typeof input?.audioTo === "string" ? input.audioTo : null,
    monitor: typeof input?.monitor === "string" ? input.monitor : null,
    sends,
    group: typeof input?.group === "string" ? input.group : null,
    notes: typeof input?.notes === "string" ? input.notes : "",
  };
}

function normalizeSidechains(
  sidechains: Array<Partial<ManualRoutingSidechain>> | undefined,
): ManualRoutingSidechain[] {
  if (!Array.isArray(sidechains)) return [];
  return sidechains
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      targetTrack: typeof item.targetTrack === "string" ? item.targetTrack : "",
      targetDevice: typeof item.targetDevice === "string" ? item.targetDevice : "",
      sourceTrack: typeof item.sourceTrack === "string" ? item.sourceTrack : "",
      enabled: typeof item.enabled === "boolean" ? item.enabled : item.enabled === null ? null : null,
      notes: typeof item.notes === "string" ? item.notes : "",
    }))
    .filter((item) => item.targetTrack.length > 0 || item.sourceTrack.length > 0 || item.targetDevice.length > 0);
}

function normalizeConnections(
  connections: Array<Partial<ManualRoutingConnection>> | undefined,
): ManualRoutingConnection[] {
  if (!Array.isArray(connections)) return [];
  return connections
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      from: typeof item.from === "string" ? item.from : "",
      to: typeof item.to === "string" ? item.to : "",
      type:
        item.type === "audio" || item.type === "midi" || item.type === "sidechain" || item.type === "unknown"
          ? item.type
          : "unknown",
      label: typeof item.label === "string" ? item.label : "",
    }))
    .filter((item) => item.from.length > 0 || item.to.length > 0 || item.label.length > 0);
}

export function routingOverridesPath(exportDirectory: string): string {
  return join(exportDirectory, ROUTING_OVERRIDES_FILE_NAME);
}

export async function loadRoutingOverrides(
  exportDirectory: string,
): Promise<ManualRoutingState> {
  const sourcePath = routingOverridesPath(exportDirectory);
  console.log("[Ableton Session Mapper] Load routing overrides started");
  try {
    await access(sourcePath);
  } catch {
    console.log("[Ableton Session Mapper] Routing overrides missing");
    return {
      status: "missing",
      sourcePath,
      warnings: [],
      tracks: {},
      sidechains: [],
      connections: [],
    };
  }

  try {
    const raw = await readFile(sourcePath, "utf8");
    const parsed = JSON.parse(raw) as ManualRoutingOverrideFile;
    const warnings: string[] = [];
    if (parsed.version && parsed.version !== "1.0.0") {
      warnings.push(`routing-overrides.json version ${parsed.version} differs from expected 1.0.0`);
    }
    if (parsed.source && parsed.source !== "manual-routing-overrides") {
      warnings.push(`routing-overrides.json source is ${parsed.source}, expected manual-routing-overrides`);
    }

    const tracks = Object.fromEntries(
      Object.entries(parsed.tracks ?? {}).map(([name, track]) => [name, normalizeTrackOverride(name, track)]),
    );

    console.log("[Ableton Session Mapper] Routing overrides loaded");
    return {
      status: "loaded",
      sourcePath,
      warnings,
      tracks,
      sidechains: normalizeSidechains(parsed.sidechains),
      connections: normalizeConnections(parsed.connections),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Ableton Session Mapper] Routing overrides invalid: ${message}`);
    return {
      status: "invalid",
      sourcePath,
      warnings: [`routing-overrides.json invalid: ${message}`],
      tracks: {},
      sidechains: [],
      connections: [],
    };
  }
}

function hasSdkRouting(track: TrackInfo): boolean {
  return Boolean(
    track.input.type ||
      track.input.channel ||
      track.output.type ||
      track.output.channel,
  );
}

function sdkRoutingLabel(type: string | null, channel: string | null): string | null {
  const parts = [type, channel].filter((value): value is string => Boolean(value && value.trim().length > 0));
  return parts.length > 0 ? parts.join(" / ") : null;
}

function buildTrackRouting(track: TrackInfo, override: ManualRoutingOverrideTrack | undefined): TrackRoutingInfo {
  if (override) {
    return {
      source: "manual",
      audioFrom: override.audioFrom,
      audioTo: override.audioTo,
      midiFrom: override.midiFrom,
      midiTo: override.midiTo,
      monitor: override.monitor,
      group: override.group,
      notes: override.notes,
    };
  }

  if (hasSdkRouting(track)) {
    return {
      source: "sdk",
      audioFrom: sdkRoutingLabel(track.input.type, track.input.channel),
      audioTo: sdkRoutingLabel(track.output.type, track.output.channel),
      midiFrom: null,
      midiTo: null,
      monitor: null,
      group: null,
      notes: "",
    };
  }

  return {
    source: "none",
    audioFrom: null,
    audioTo: null,
    midiFrom: null,
    midiTo: null,
    monitor: null,
    group: null,
    notes: "",
  };
}

function orderedTracks(sessionMap: SessionMap): TrackInfo[] {
  return [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];
}

function validateRoutingOverrides(
  sessionMap: SessionMap,
  manualRouting: ManualRoutingState,
): string[] {
  const warnings = [...manualRouting.warnings];
  const ordered = orderedTracks(sessionMap);
  const trackNames = new Set(ordered.map((track) => track.name));
  const duplicateNames = ordered
    .map((track) => track.name)
    .filter((name, index, names) => names.indexOf(name) !== index);
  for (const duplicateName of new Set(duplicateNames)) {
    warnings.push(`Manual routing override may be ambiguous because track name is duplicated: ${duplicateName}`);
  }

  for (const name of Object.keys(manualRouting.tracks)) {
    if (!trackNames.has(name)) {
      warnings.push(`Manual routing override references missing track: ${name}`);
    }
  }

  for (const connection of manualRouting.connections) {
    if (connection.from && !trackNames.has(connection.from)) {
      warnings.push(`Manual connection source missing: ${connection.from}`);
    }
    if (connection.to && !trackNames.has(connection.to)) {
      warnings.push(`Manual connection target missing: ${connection.to}`);
    }
  }

  for (const sidechain of manualRouting.sidechains) {
    if (sidechain.sourceTrack && !trackNames.has(sidechain.sourceTrack)) {
      warnings.push(`Manual sidechain source missing: ${sidechain.sourceTrack}`);
    }
    if (sidechain.targetTrack && !trackNames.has(sidechain.targetTrack)) {
      warnings.push(`Manual sidechain target missing: ${sidechain.targetTrack}`);
    }
  }

  return warnings;
}

export function mergeManualRouting(
  sessionMap: SessionMap,
  manualRouting: ManualRoutingState,
): SessionMap {
  console.log("[Ableton Session Mapper] Merge manual routing started");
  const warnings = validateRoutingOverrides(sessionMap, manualRouting);

  const decorateTrack = (track: TrackInfo): TrackInfo => ({
    ...track,
    routing: buildTrackRouting(track, manualRouting.tracks[track.name]),
  });

  const merged: SessionMap = {
    ...sessionMap,
    manualRouting: {
      ...manualRouting,
      warnings,
    },
    tracks: sessionMap.tracks.map(decorateTrack),
    returnTracks: sessionMap.returnTracks.map(decorateTrack),
    masterTrack: sessionMap.masterTrack ? decorateTrack(sessionMap.masterTrack) : null,
  };

  console.log("[Ableton Session Mapper] Merge manual routing completed");
  console.log(`[Ableton Session Mapper] Manual routing warnings: ${warnings.length}`);
  return merged;
}
