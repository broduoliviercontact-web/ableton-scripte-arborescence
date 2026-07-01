import { access, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import { APP_VERSION } from "../appInfo.js";
import { resolveExportLocations } from "../exportJson.js";
import type { DeviceInfo, SessionMap, TrackInfo } from "../types.js";
import {
  createInternalViewerHtml,
  type InternalViewerDeviceDescriptor,
  type InternalViewerDeviceTrack,
  type InternalViewerFileEntry,
  type InternalViewerModel,
  type InternalViewerOutputRow,
  type InternalViewerQuickLink,
} from "./template.js";

const INTERNAL_VIEWER_WIDTH = 1400;
const INTERNAL_VIEWER_HEIGHT = 950;
const ENABLE_INTERNAL_VISUAL_PREVIEW = true;
const ROUTING_NOT_EXPOSED = "Non exposé par le SDK";
const MAX_DEVICE_SUMMARY_ITEMS = 12;
const MAX_RACK_SUMMARY_ITEMS = 8;
const MAX_PREVIEW_DEVICE_ITEMS = 16;

const INSTRUMENT_NAMES = [
  "drum rack",
  "instrument rack",
  "simpler",
  "sampler",
  "wavetable",
  "operator",
  "analog",
  "drift",
  "meld",
  "collision",
  "tension",
  "electric",
  "external instrument",
  "dexed",
  "serum",
  "massive",
  "kontakt",
  "pigments",
  "drum synth",
  "ds clap",
  "ds kick",
  "ds snare",
  "ds hh",
  "ds cymbal",
  "ds tom",
];

const MIDI_EFFECT_NAMES = [
  "arpeggiator",
  "chord",
  "scale",
  "scale awareness",
  "pitch",
  "random",
  "velocity",
  "note length",
  "note echo",
  "midi monitor",
  "mpe control",
  "expression control",
  "envelope midi",
  "cc control",
  "midi effect rack",
];

const WEAK_INSTRUMENT_NAMES = [
  "bass",
  "piano",
  "e-piano",
  "clap",
  "kick",
  "snare",
];

const AUDIO_EFFECT_NAMES = [
  "eq eight",
  "auto filter",
  "compressor",
  "glue compressor",
  "limiter",
  "reverb",
  "hybrid reverb",
  "echo",
  "delay",
  "filter delay",
  "shifter",
  "chorus",
  "phaser",
  "flanger",
  "saturator",
  "overdrive",
  "cabinet",
  "amp",
  "utility",
  "gate",
  "redux",
  "roar",
  "audio effect rack",
];

const MAX_FOR_LIVE_NAMES = [
  "max for live",
  "max midi effect",
  "max audio effect",
  "max instrument",
  "m4l",
  ".amxd",
  "lfo",
  "envelope follower",
  "shaper",
  "shaper midi",
  "multimap",
  "expression control",
  "midi monitor",
  "sting",
  "sting!64",
  "maxdevice",
];

const MAX_FOR_LIVE_SDK_HINTS = [
  "max",
  "maxdevice",
  "max for live",
  "amxd",
  ".amxd",
  "m4l",
];

type DeviceClassificationCategory =
  | "instrument"
  | "midi-effect"
  | "audio-effect"
  | "max-for-live"
  | "rack"
  | "unknown";

type DeviceClassificationSource = "sdk" | "inferred" | "manual" | "unknown";
type DeviceClassificationConfidence = "high" | "medium" | "low";
type DeviceM4lKind = "midi" | "audio" | "instrument" | "unknown";

interface DeviceClassificationOverrideEntry {
  category: DeviceClassificationCategory;
  label?: string;
  badge?: string;
  confidence?: DeviceClassificationConfidence;
  m4lKind?: DeviceM4lKind;
  notes?: string;
}

interface DeviceClassificationOverrideFile {
  version?: string;
  devices?: Record<string, DeviceClassificationOverrideEntry>;
}

interface DeviceClassificationOverrides {
  sourcePath: string | null;
  devices: Map<string, DeviceClassificationOverrideEntry>;
}

interface DeviceClassificationContext {
  overrides: DeviceClassificationOverrides;
  loggedManualMatches: Set<string>;
  loggedInferredMatches: Set<string>;
  loggedUnknownMatches: Set<string>;
}

type ExportReadStatus = "ok" | "missing" | "invalid";

interface LatestSessionMapState {
  sessionMap: SessionMap | null;
  status: ExportReadStatus;
}

interface LinkTarget {
  key: string;
  label: string;
  path: string;
  openLabel: string;
  exists: boolean;
  group: string;
  quickOpen?: boolean;
}

interface InternalViewerOptions {
  sessionMapOverride?: SessionMap | null;
}

function formatTrackKind(kind: TrackInfo["kind"]): string {
  switch (kind) {
    case "audio":
      return "audio";
    case "midi":
      return "midi";
    case "return":
      return "return";
    case "master":
      return "master";
    case "group":
      return "group";
    default:
      return "unknown";
  }
}

function formatRoutingPart(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatRoutingLabel(track: TrackInfo["input"] | TrackInfo["output"]): string {
  const type = formatRoutingPart(track.type);
  const channel = formatRoutingPart(track.channel);
  if (!type && !channel) return ROUTING_NOT_EXPOSED;
  return [type, channel].filter(Boolean).join(" · ");
}

function formatSendSummary(track: TrackInfo): string {
  if (track.sends.length === 0) return "—";
  return track.sends
    .map((send) => `${send.name}: ${send.value == null ? "—" : send.value.toFixed(3)}`)
    .join(", ");
}

function isRackLike(device: DeviceInfo): boolean {
  return (
    device.type.toLowerCase().includes("rack") ||
    Boolean(device.chainsSummary?.count) ||
    Boolean(device.padsSummary?.count)
  );
}

function describeDevice(device: DeviceInfo): string {
  const parts = [device.name, device.type];
  if (device.chainsSummary?.count) parts.push(`chains:${device.chainsSummary.count}`);
  if (device.padsSummary?.count) parts.push(`pads:${device.padsSummary.count}`);
  if (device.scanStatus === "summary") parts.push("summary");
  return parts.join(" · ");
}

function describeRack(device: DeviceInfo): string {
  const parts = [device.name];
  if (device.chainsSummary?.count) parts.push(`chains:${device.chainsSummary.count}`);
  if (device.padsSummary?.count) parts.push(`pads:${device.padsSummary.count}`);
  if (device.scanWarning) parts.push(device.scanWarning);
  return parts.join(" · ");
}

function describePreviewDevice(device: DeviceInfo): string {
  const parts = [device.name];
  if (isRackLike(device)) {
    parts.push("Rack");
  } else {
    parts.push(device.type);
  }
  if (device.chainsSummary?.count) parts.push(`chains:${device.chainsSummary.count}`);
  if (device.padsSummary?.count) parts.push(`pads:${device.padsSummary.count}`);
  return parts.join(" · ");
}

function includesKnownName(value: string, knownNames: string[]): boolean {
  return knownNames.some((name) => value.includes(name));
}

function buildClassificationResult(
  category: DeviceClassificationCategory,
  categorySource: DeviceClassificationSource,
  categoryConfidence: DeviceClassificationConfidence,
  options?: {
    m4lKind?: DeviceM4lKind;
    label?: string;
    badge?: string;
  },
): Pick<
  InternalViewerDeviceDescriptor,
  "category" | "categoryLabel" | "categoryBadge" | "categorySource" | "categoryConfidence" | "m4lKind"
> {
  const defaultLabel = category === "max-for-live"
    ? "Max for Live"
    : category === "midi-effect"
      ? "MIDI FX"
      : category === "audio-effect"
        ? "Audio FX"
        : category === "instrument"
          ? "Instrument"
          : category === "rack"
            ? "Rack"
            : "Unknown";

  const defaultBadge = category === "max-for-live"
    ? options?.m4lKind === "midi"
      ? "M4L MIDI"
      : options?.m4lKind === "audio"
        ? "M4L AUDIO"
        : options?.m4lKind === "instrument"
          ? "M4L INST"
          : "M4L"
    : category === "midi-effect"
      ? "MIDI FX"
      : category === "audio-effect"
        ? "AUDIO FX"
        : category === "instrument"
          ? "INST"
          : category === "rack"
            ? "RACK"
            : "?";

  return {
    category,
    categoryLabel: options?.label ?? defaultLabel,
    categoryBadge: options?.badge ?? defaultBadge,
    categorySource,
    categoryConfidence,
    ...(options?.m4lKind ? { m4lKind: options.m4lKind } : {}),
  };
}

function normalizeDeviceText(device: DeviceInfo): { rawName: string; rawType: string } {
  const rawName = `${device.name} ${device.type}`.toLowerCase();
  const deviceRecord = device as unknown as Record<string, unknown>;
  const rawType = String(
    deviceRecord.deviceType ??
      deviceRecord.className ??
      deviceRecord.kind ??
      deviceRecord.objectType ??
      device.type ??
      "",
  ).toLowerCase();
  return { rawName, rawType };
}

function determineM4lKind(rawName: string, rawType: string): DeviceM4lKind {
  if (rawName.includes("max midi effect") || rawType.includes("max midi effect")) return "midi";
  if (rawName.includes("max audio effect") || rawType.includes("max audio effect")) return "audio";
  if (rawName.includes("max instrument") || rawType.includes("max instrument")) return "instrument";
  if (
    rawName.includes("shaper midi") ||
    rawName.includes("midi monitor") ||
    rawName.includes("multimap") ||
    rawName.includes("expression control") ||
    rawName.includes("sting")
  ) {
    return "midi";
  }
  return "unknown";
}

function isLikelyInstrumentName(rawName: string, track: TrackInfo): boolean {
  if (includesKnownName(rawName, INSTRUMENT_NAMES)) return true;
  if (track.kind !== "midi") return false;
  return includesKnownName(rawName, WEAK_INSTRUMENT_NAMES);
}

function findFirstLikelyInstrumentIndex(track: TrackInfo): number {
  return track.devices.findIndex((device) => {
    const { rawName, rawType } = normalizeDeviceText(device);
    if (rawType.includes("instrument")) return true;
    return isLikelyInstrumentName(rawName, track);
  });
}

function normalizeOverrideEntry(
  deviceName: string,
  entry: unknown,
): DeviceClassificationOverrideEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const category = record.category;
  const allowedCategories: DeviceClassificationCategory[] = [
    "instrument",
    "midi-effect",
    "audio-effect",
    "max-for-live",
    "rack",
    "unknown",
  ];

  if (typeof category !== "string" || !allowedCategories.includes(category as DeviceClassificationCategory)) {
    console.warn(`[Ableton Session Mapper] Device classification override invalid category for ${deviceName}.`);
    return null;
  }

  const allowedConfidence: DeviceClassificationConfidence[] = ["high", "medium", "low"];
  const confidence = typeof record.confidence === "string" && allowedConfidence.includes(record.confidence as DeviceClassificationConfidence)
    ? record.confidence as DeviceClassificationConfidence
    : "high";

  const allowedM4lKinds: DeviceM4lKind[] = ["midi", "audio", "instrument", "unknown"];
  const m4lKind = typeof record.m4lKind === "string" && allowedM4lKinds.includes(record.m4lKind as DeviceM4lKind)
    ? record.m4lKind as DeviceM4lKind
    : undefined;

  return {
    category: category as DeviceClassificationCategory,
    ...(typeof record.label === "string" ? { label: record.label } : {}),
    ...(typeof record.badge === "string" ? { badge: record.badge } : {}),
    confidence,
    ...(m4lKind ? { m4lKind } : {}),
    ...(typeof record.notes === "string" ? { notes: record.notes } : {}),
  };
}

async function loadDeviceClassificationOverrides(projectRoot: string, exportDirectory: string): Promise<DeviceClassificationOverrides> {
  const candidatePaths = [
    join(exportDirectory, "device-classification-overrides.json"),
    join(projectRoot, "config", "device-classification-overrides.json"),
  ];

  for (const candidatePath of candidatePaths) {
    if (!(await pathExists(candidatePath))) continue;

    try {
      const raw = await readFile(candidatePath, "utf8");
      const parsed = JSON.parse(raw) as DeviceClassificationOverrideFile;
      const devices = new Map<string, DeviceClassificationOverrideEntry>();

      for (const [deviceName, entry] of Object.entries(parsed.devices ?? {})) {
        const normalized = normalizeOverrideEntry(deviceName, entry);
        if (normalized) devices.set(deviceName.trim(), normalized);
      }

      console.log(`[Ableton Session Mapper] Device classification override loaded: ${candidatePath}`);
      return {
        sourcePath: candidatePath,
        devices,
      };
    } catch (error) {
      console.warn(`[Ableton Session Mapper] Device classification override invalid: ${candidatePath}`, error);
      return {
        sourcePath: candidatePath,
        devices: new Map(),
      };
    }
  }

  console.log("[Ableton Session Mapper] Device classification override missing");
  return {
    sourcePath: null,
    devices: new Map(),
  };
}

function classifyDevice(
  device: DeviceInfo,
  track: TrackInfo,
  deviceIndex: number,
  firstKnownInstrumentIndex: number,
  context: DeviceClassificationContext,
): Pick<
  InternalViewerDeviceDescriptor,
  "category" | "categoryLabel" | "categoryBadge" | "categorySource" | "categoryConfidence" | "m4lKind"
> {
  const { rawName, rawType } = normalizeDeviceText(device);

  const manualOverride = context.overrides.devices.get(device.name.trim());
  if (manualOverride) {
    if (!context.loggedManualMatches.has(device.name)) {
      console.log(`[Ableton Session Mapper] Device classification manual match: ${device.name}`);
      context.loggedManualMatches.add(device.name);
    }
    return buildClassificationResult(
      manualOverride.category,
      "manual",
      manualOverride.confidence ?? "high",
      {
        ...(manualOverride.m4lKind ? { m4lKind: manualOverride.m4lKind } : {}),
        ...(manualOverride.label ? { label: manualOverride.label } : {}),
        ...(manualOverride.badge ? { badge: manualOverride.badge } : {}),
      },
    );
  }

  if (rawType.includes("rack") || rawType.includes("drum") || isRackLike(device)) {
    return buildClassificationResult(
      "rack",
      rawType.includes("rack") || rawType.includes("drum") ? "sdk" : "inferred",
      rawType.includes("rack") || rawType.includes("drum") ? "high" : "medium",
    );
  }

  const explicitM4lSdkHint = MAX_FOR_LIVE_SDK_HINTS.some((hint) => rawType.includes(hint));
  const explicitM4lName = MAX_FOR_LIVE_NAMES.some((name) => rawName.includes(name));
  if (explicitM4lSdkHint || explicitM4lName) {
    if (!explicitM4lSdkHint && !context.loggedInferredMatches.has(device.name)) {
      console.log(`[Ableton Session Mapper] Device classification inferred: ${device.name} -> max-for-live`);
      context.loggedInferredMatches.add(device.name);
    }

    const m4lKind = determineM4lKind(rawName, rawType);
    const confidence: DeviceClassificationConfidence =
      rawName.includes("max midi effect") ||
      rawName.includes("max audio effect") ||
      rawName.includes("max instrument") ||
      rawType.includes("max midi effect") ||
      rawType.includes("max audio effect") ||
      rawType.includes("max instrument") ||
      rawName.includes(".amxd") ||
      rawType.includes(".amxd") ||
      rawType.includes("maxdevice")
        ? "high"
        : "medium";

    return buildClassificationResult(
      "max-for-live",
      explicitM4lSdkHint ? "sdk" : "inferred",
      confidence,
      { m4lKind },
    );
  }

  if (rawType.includes("instrument")) {
    return buildClassificationResult("instrument", "sdk", "high");
  }

  if (rawType.includes("midi") && rawType.includes("effect")) {
    return buildClassificationResult("midi-effect", "sdk", "high");
  }

  if (rawType.includes("audio") && rawType.includes("effect")) {
    return buildClassificationResult("audio-effect", "sdk", "high");
  }

  if (includesKnownName(rawName, MIDI_EFFECT_NAMES)) {
    if (!context.loggedInferredMatches.has(device.name)) {
      console.log(`[Ableton Session Mapper] Device classification inferred: ${device.name} -> midi-effect`);
      context.loggedInferredMatches.add(device.name);
    }
    return buildClassificationResult("midi-effect", "inferred", "high");
  }

  if (isLikelyInstrumentName(rawName, track)) {
    if (!context.loggedInferredMatches.has(device.name)) {
      console.log(`[Ableton Session Mapper] Device classification inferred: ${device.name} -> instrument`);
      context.loggedInferredMatches.add(device.name);
    }
    return buildClassificationResult("instrument", "inferred", track.kind === "midi" ? "high" : "medium");
  }

  if (includesKnownName(rawName, AUDIO_EFFECT_NAMES)) {
    if (!context.loggedInferredMatches.has(device.name)) {
      console.log(`[Ableton Session Mapper] Device classification inferred: ${device.name} -> audio-effect`);
      context.loggedInferredMatches.add(device.name);
    }
    return buildClassificationResult("audio-effect", "inferred", "high");
  }

  if (track.kind === "audio") {
    return buildClassificationResult("audio-effect", "inferred", "medium");
  }

  if (track.kind === "midi") {
    if (firstKnownInstrumentIndex >= 0) {
      if (deviceIndex < firstKnownInstrumentIndex) {
        return buildClassificationResult("midi-effect", "inferred", "medium");
      }

      if (deviceIndex === firstKnownInstrumentIndex) {
        return buildClassificationResult("instrument", "inferred", "high");
      }

      return buildClassificationResult("audio-effect", "inferred", "medium");
    }
  }

  if (!context.loggedUnknownMatches.has(device.name)) {
    console.log(`[Ableton Session Mapper] Device classification inferred: ${device.name} -> unknown`);
    context.loggedUnknownMatches.add(device.name);
  }

  return buildClassificationResult("unknown", "unknown", "low");
}

function toDeviceDescriptor(
  device: DeviceInfo,
  track: TrackInfo,
  deviceIndex: number,
  firstKnownInstrumentIndex: number,
  summary: string,
  context: DeviceClassificationContext,
): InternalViewerDeviceDescriptor {
  const classification = classifyDevice(device, track, deviceIndex, firstKnownInstrumentIndex, context);

  return {
    name: device.name,
    summary,
    isRack: isRackLike(device),
    ...classification,
  };
}

function orderedTracks(sessionMap: SessionMap): Array<{
  track: TrackInfo;
  sectionType: "track" | "return" | "master";
}> {
  return [
    ...sessionMap.tracks.map((track) => ({ track, sectionType: "track" as const })),
    ...sessionMap.returnTracks.map((track) => ({ track, sectionType: "return" as const })),
    ...(sessionMap.masterTrack ? [{ track: sessionMap.masterTrack, sectionType: "master" as const }] : []),
  ];
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readLatestSessionMap(
  jsonPath: string,
): Promise<LatestSessionMapState> {
  console.log("[Ableton Session Mapper] Read latest export metadata started");

  if (!(await pathExists(jsonPath))) {
    console.log("[Ableton Session Mapper] Read latest export metadata completed (no export yet)");
    return { sessionMap: null, status: "missing" };
  }

  try {
    const raw = await readFile(jsonPath, "utf8");
    const parsed = JSON.parse(raw) as SessionMap;
    console.log("[Ableton Session Mapper] Read latest export metadata completed");
    return { sessionMap: parsed, status: "ok" };
  } catch (error) {
    console.warn("[Ableton Session Mapper] Internal Viewer could not parse session-map.json.", error);
    console.log("[Ableton Session Mapper] Read latest export metadata completed (fallback)");
    return { sessionMap: null, status: "invalid" };
  }
}

function latestSessionMapFromOverride(
  sessionMapOverride: SessionMap | null | undefined,
): LatestSessionMapState | null {
  if (!sessionMapOverride) return null;
  console.log("[Ableton Session Mapper] Read latest export metadata started");
  console.log("[Ableton Session Mapper] Read latest export metadata completed (fresh export)");
  return { sessionMap: sessionMapOverride, status: "ok" };
}

async function buildLinkTargets(exportDirectory: string, jsonPath: string, htmlPath: string, sessionGridPath: string, diagramsPath: string): Promise<LinkTarget[]> {
  const specs: Array<Omit<LinkTarget, "exists">> = [
    {
      key: "launcher",
      label: "Open External Launcher",
      path: diagramsPath,
      openLabel: "External Launcher",
      group: "Core Outputs",
      quickOpen: true,
    },
    {
      key: "report",
      label: "Open HTML Report",
      path: htmlPath,
      openLabel: "HTML Report",
      group: "Core Outputs",
      quickOpen: true,
    },
    {
      key: "session-grid",
      label: "Open Session Grid",
      path: sessionGridPath,
      openLabel: "Session Grid",
      group: "Core Outputs",
      quickOpen: true,
    },
    {
      key: "json",
      label: "Open session-map.json",
      path: jsonPath,
      openLabel: "session-map.json",
      group: "Core Outputs",
    },
    {
      key: "capability-matrix-html",
      label: "Open SDK Capability Matrix",
      path: join(exportDirectory, "sdk-capability-matrix.html"),
      openLabel: "SDK Capability Matrix",
      group: "Diagnostics",
    },
    {
      key: "capability-matrix-json",
      label: "Open SDK Capability Matrix JSON",
      path: join(exportDirectory, "sdk-capability-matrix.json"),
      openLabel: "SDK Capability Matrix JSON",
      group: "Diagnostics",
    },
    {
      key: "sdk-diagnostic",
      label: "Open sdk-diagnostic.json",
      path: join(exportDirectory, "sdk-diagnostic.json"),
      openLabel: "sdk-diagnostic.json",
      group: "Diagnostics",
    },
    {
      key: "rack-diagnostic",
      label: "Open rack-diagnostic.json",
      path: join(exportDirectory, "rack-diagnostic.json"),
      openLabel: "rack-diagnostic.json",
      group: "Diagnostics",
    },
    {
      key: "flow-html",
      label: "Open Flow",
      path: join(exportDirectory, "session-map-mermaid-flow.html"),
      openLabel: "Flow",
      group: "Mermaid Flow",
      quickOpen: true,
    },
    {
      key: "flow-svg",
      label: "Open Flow SVG",
      path: join(exportDirectory, "session-map-flow.svg"),
      openLabel: "Flow SVG",
      group: "Mermaid Flow",
    },
    {
      key: "flow-png",
      label: "Open Flow PNG",
      path: join(exportDirectory, "session-map-flow.png"),
      openLabel: "Flow PNG",
      group: "Mermaid Flow",
    },
    {
      key: "git-html",
      label: "Open Git / Metro",
      path: join(exportDirectory, "session-map-mermaid-git.html"),
      openLabel: "Git / Metro",
      group: "Mermaid Git / Metro",
      quickOpen: true,
    },
    {
      key: "git-svg",
      label: "Open Git / Metro SVG",
      path: join(exportDirectory, "session-map-git.svg"),
      openLabel: "Git / Metro SVG",
      group: "Mermaid Git / Metro",
    },
    {
      key: "git-png",
      label: "Open Git / Metro PNG",
      path: join(exportDirectory, "session-map-git.png"),
      openLabel: "Git / Metro PNG",
      group: "Mermaid Git / Metro",
    },
    {
      key: "kanban-html",
      label: "Open Kanban",
      path: join(exportDirectory, "session-map-mermaid-kanban.html"),
      openLabel: "Kanban",
      group: "Mermaid Kanban",
      quickOpen: true,
    },
    {
      key: "kanban-svg",
      label: "Open Kanban SVG",
      path: join(exportDirectory, "session-map-kanban.svg"),
      openLabel: "Kanban SVG",
      group: "Mermaid Kanban",
    },
    {
      key: "kanban-png",
      label: "Open Kanban PNG",
      path: join(exportDirectory, "session-map-kanban.png"),
      openLabel: "Kanban PNG",
      group: "Mermaid Kanban",
    },
  ];

  const targets = await Promise.all(
    specs.map(async (spec) => ({
      ...spec,
      exists: await pathExists(spec.path),
    })),
  );

  console.log("[Ableton Session Mapper] Internal Viewer files built");
  console.log("[Ableton Session Mapper] Internal Viewer files model completed");
  return targets;
}

function buildOutputsModel(sessionMap: SessionMap | null): {
  outputs: InternalViewerOutputRow[];
  hasMissingRoutingData: boolean;
} {
  console.log("[Ableton Session Mapper] Internal Viewer outputs model started");

  if (!sessionMap) {
    console.log("[Ableton Session Mapper] Internal Viewer outputs model completed");
    return { outputs: [], hasMissingRoutingData: false };
  }

  const outputs = orderedTracks(sessionMap).map(({ track, sectionType }) => ({
    index: track.index,
    name: track.name,
    kind: formatTrackKind(track.kind),
    midiFrom: "—",
    midiTo: "—",
    audioFrom: formatRoutingLabel(track.input),
    audioTo: formatRoutingLabel(track.output),
    monitor: "—",
    source: "SDK",
    sends: formatSendSummary(track),
    sectionType,
  }));

  const hasMissingRoutingData =
    outputs.length > 0 &&
    outputs.every(
      (row) => row.audioFrom === ROUTING_NOT_EXPOSED && row.audioTo === ROUTING_NOT_EXPOSED,
    );

  if (hasMissingRoutingData) {
  console.log("[Ableton Session Mapper] Internal Viewer missing routing data detected");
  }

  console.log("[Ableton Session Mapper] Internal Viewer outputs built");
  console.log("[Ableton Session Mapper] Internal Viewer outputs model completed");
  return { outputs, hasMissingRoutingData };
}

function buildDevicesModel(
  sessionMap: SessionMap | null,
  classificationContext: DeviceClassificationContext,
): InternalViewerDeviceTrack[] {
  if (!sessionMap) {
    console.log("[Ableton Session Mapper] Internal Viewer devices built");
    return [];
  }

  const model = orderedTracks(sessionMap).map(({ track, sectionType }) => {
    const rackDevices = track.devices.filter((device) => isRackLike(device));
    const firstKnownInstrumentIndex = findFirstLikelyInstrumentIndex(track);
    const deviceItems = track.devices
      .slice(0, MAX_DEVICE_SUMMARY_ITEMS)
      .map((device, index) => toDeviceDescriptor(device, track, index, firstKnownInstrumentIndex, describeDevice(device), classificationContext));
    if (track.devices.length > MAX_DEVICE_SUMMARY_ITEMS) {
      deviceItems.push({
        name: "More devices",
        summary: `+${track.devices.length - MAX_DEVICE_SUMMARY_ITEMS} more devices`,
        isRack: false,
        category: "unknown",
        categoryLabel: "Unknown",
        categoryBadge: "?",
        categorySource: "unknown",
        categoryConfidence: "low",
      });
    }

    const rackItems = rackDevices
      .slice(0, MAX_RACK_SUMMARY_ITEMS)
      .map((device) => toDeviceDescriptor(device, track, track.devices.indexOf(device), firstKnownInstrumentIndex, describeRack(device), classificationContext));
    if (rackDevices.length > MAX_RACK_SUMMARY_ITEMS) {
      rackItems.push({
        name: "More racks",
        summary: `+${rackDevices.length - MAX_RACK_SUMMARY_ITEMS} more racks`,
        isRack: true,
        category: "rack",
        categoryLabel: "Rack",
        categoryBadge: "RACK",
        categorySource: "inferred",
        categoryConfidence: "medium",
      });
    }

    return {
      index: track.index,
      name: track.name,
      kind: formatTrackKind(track.kind),
      deviceCount: track.devices.length,
      rackCount: rackDevices.length,
      deviceItems,
      rackItems,
      sectionType,
    };
  });

  console.log("[Ableton Session Mapper] Internal Viewer devices built");
  return model;
}

function buildSessionPreviewColumns(
  sessionMap: SessionMap | null,
  classificationContext: DeviceClassificationContext,
): InternalViewerModel["sessionPreviewColumns"] {
  if (!ENABLE_INTERNAL_VISUAL_PREVIEW || !sessionMap) {
    console.log("[Ableton Session Mapper] Internal Viewer session preview built");
    console.log("[Ableton Session Mapper] Internal Viewer kanban preview built");
    console.log("[Ableton Session Mapper] Internal Viewer metro preview built");
    return [];
  }

  const columns = orderedTracks(sessionMap).map(({ track, sectionType }) => {
    const rackCount = track.devices.filter((device) => isRackLike(device)).length;
    const firstKnownInstrumentIndex = findFirstLikelyInstrumentIndex(track);
    const deviceCards = track.devices
      .slice(0, MAX_PREVIEW_DEVICE_ITEMS)
      .map((device, index) => toDeviceDescriptor(device, track, index, firstKnownInstrumentIndex, describePreviewDevice(device), classificationContext));

    if (track.devices.length > MAX_PREVIEW_DEVICE_ITEMS) {
      deviceCards.push({
        name: "More devices",
        summary: `+${track.devices.length - MAX_PREVIEW_DEVICE_ITEMS} more devices`,
        isRack: false,
        category: "unknown",
        categoryLabel: "Unknown",
        categoryBadge: "?",
        categorySource: "unknown",
        categoryConfidence: "low",
      });
    }

    return {
      index: track.index,
      name: track.name,
      kind: formatTrackKind(track.kind),
      sectionType,
      deviceCount: track.devices.length,
      sendCount: track.sends.length,
      rackCount,
      deviceCards,
    };
  });

  console.log("[Ableton Session Mapper] Internal Viewer session preview built");
  console.log("[Ableton Session Mapper] Internal Viewer kanban preview built");
  console.log("[Ableton Session Mapper] Internal Viewer metro preview built");
  return columns;
}

function buildModel(
  latest: LatestSessionMapState,
  links: LinkTarget[],
  exportDirectory: string,
  classificationContext: DeviceClassificationContext,
): InternalViewerModel {
  const sessionMap = latest.sessionMap;
  const ordered = sessionMap ? orderedTracks(sessionMap).map((entry) => entry.track) : [];
  const devices = ordered.reduce((sum, track) => sum + track.devices.length, 0);
  const racks = ordered.reduce(
    (sum, track) => sum + track.devices.filter((device) => isRackLike(device)).length,
    0,
  );
  const sends = ordered.reduce((sum, track) => sum + track.sends.length, 0);

  const { outputs, hasMissingRoutingData } = buildOutputsModel(sessionMap);
  const deviceTracks = buildDevicesModel(sessionMap, classificationContext);
  const sessionPreviewColumns = buildSessionPreviewColumns(sessionMap, classificationContext);
  const quickLinks: InternalViewerQuickLink[] = links
    .filter((link) => link.quickOpen)
    .map(({ key, label, exists }) => ({ key, label, exists }));
  const files: InternalViewerFileEntry[] = links.map(({ key, label, path, exists, group }) => ({
    key,
    label,
    fileName: basename(path),
    exists,
    group,
  }));

  let statusMessage =
    "Latest export metadata loaded. Use Quick Open or Files to jump to external outputs.";
  let warningMessage: string | null = null;

  if (latest.status === "missing") {
    statusMessage =
      "No export generated yet. Run Export Session Map first, then reopen this integrated viewer.";
    warningMessage = "No export generated yet.";
  } else if (latest.status === "invalid") {
    statusMessage =
      "Latest session-map.json could not be parsed. Regenerate the export, then reopen this viewer.";
    warningMessage = "Latest session-map.json is missing or invalid.";
  }

  console.log("[Ableton Session Mapper] Internal Viewer tabs mode: css-only");
  console.log("[Ableton Session Mapper] Internal Viewer no inline JS tabs");
  console.log("[Ableton Session Mapper] Internal Viewer tab model completed");

  return {
    appVersion: APP_VERSION,
    setName: sessionMap?.set.name ?? null,
    exportedAt: sessionMap?.exportedAt ?? null,
    statusMessage,
    warningMessage,
    scanMode: sessionMap?.scan.mode ?? "ultra-safe",
    metrics: {
      tracks: sessionMap?.tracks.length ?? 0,
      returns: sessionMap?.returnTracks.length ?? 0,
      devices,
      racks,
      sends,
    },
    quickLinks,
    sessionPreviewColumns,
    outputs,
    connections: [],
    manualRoutingStatus: sessionMap?.manualRouting?.status ?? "missing",
    manualRoutingStale: sessionMap?.manualRouting?.stale ?? false,
    manualRoutingSetMatch: sessionMap?.manualRouting?.setMatch ?? false,
    manualRoutingWarnings: sessionMap?.manualRouting?.warnings ?? [],
    routingOverridesPath: sessionMap?.manualRouting?.sourcePath ?? "",
    routingOverridesExists: false,
    routingOverridesModifiedAt: sessionMap?.manualRouting?.sourceModifiedAt ?? null,
    sessionExportComparedAt: sessionMap?.manualRouting?.sessionMapModifiedAt ?? null,
    missingFromCurrent: sessionMap?.manualRouting?.missingFromCurrent ?? [],
    missingFromOverrides: sessionMap?.manualRouting?.missingFromOverrides ?? [],
    sidechains: (sessionMap?.manualRouting?.sidechains ?? []).map((sidechain) => ({
      targetTrack: sidechain.targetTrack,
      targetDevice: sidechain.targetDevice,
      sourceTrack: sidechain.sourceTrack,
      enabled:
        sidechain.enabled === true ? "enabled" : sidechain.enabled === false ? "disabled" : "unknown",
      notes: sidechain.notes,
    })),
    deviceTracks,
    files,
    hasExport: latest.status === "ok",
    hasMissingRoutingData,
    internalVisualPreviewEnabled: ENABLE_INTERNAL_VISUAL_PREVIEW,
  };
}

export async function showInternalViewerExperimental(
  context: ExtensionContext<"1.0.0">,
  openExternalPath: (path: string, label: string) => void,
  options?: InternalViewerOptions,
): Promise<void> {
  const locations = await resolveExportLocations(context);
  let overrideState = latestSessionMapFromOverride(options?.sessionMapOverride);

  while (true) {
    const classificationOverrides = await loadDeviceClassificationOverrides(
      locations.projectRoot,
      locations.exportDirectory,
    );
    const classificationContext: DeviceClassificationContext = {
      overrides: classificationOverrides,
      loggedManualMatches: new Set(),
      loggedInferredMatches: new Set(),
      loggedUnknownMatches: new Set(),
    };

    const links = await buildLinkTargets(
      locations.exportDirectory,
      locations.sessionMapJsonPath,
      locations.sessionMapHtmlPath,
      locations.sessionGridHtmlPath,
      locations.sessionMapDiagramsPath,
    );
    const latest = overrideState ?? await readLatestSessionMap(locations.sessionMapJsonPath);
    overrideState = null;
    const model = buildModel(latest, links, locations.exportDirectory, classificationContext);
    console.log("[Ableton Session Mapper] Build internal viewer model completed");

    const html = createInternalViewerHtml(model);

    console.log(
      `[Ableton Session Mapper] Internal Viewer requested modal size: ${INTERNAL_VIEWER_WIDTH}x${INTERNAL_VIEWER_HEIGHT}`,
    );
    console.log(
      `[Ableton Session Mapper] Internal Viewer modal size applied: ${INTERNAL_VIEWER_WIDTH}x${INTERNAL_VIEWER_HEIGHT}`,
    );
    console.log("[Ableton Session Mapper] Internal Viewer modal size may be limited by Live");
    console.log("[Ableton Session Mapper] Show internal viewer modal started");

    const resultPromise = context.ui.showModalDialog(
      `data:text/html,${encodeURIComponent(html)}`,
      INTERNAL_VIEWER_WIDTH,
      INTERNAL_VIEWER_HEIGHT,
    );

    console.log("[Ableton Session Mapper] Internal Viewer modal shown");

    const result = await resultPromise;
    console.log("[Ableton Session Mapper] Show internal viewer modal completed");

    let parsed: { action?: string; key?: string } | null = null;
    try {
      parsed = JSON.parse(result) as { action?: string; key?: string };
    } catch (error) {
      console.warn("[Ableton Session Mapper] Internal Viewer returned invalid JSON.", error);
      return;
    }

    if (parsed?.action === "refresh") {
      continue;
    }

    if (parsed?.action !== "open-link" || !parsed.key) {
      return;
    }

    const target = links.find((link) => link.key === parsed?.key);
    if (!target) {
      console.warn(`[Ableton Session Mapper] Internal Viewer requested unknown target: ${parsed.key}`);
      return;
    }

    console.log(`[Ableton Session Mapper] Open external view requested: ${target.openLabel}`);
    if (!target.exists || !(await pathExists(target.path))) {
      console.warn(`[Ableton Session Mapper] Open external view skipped missing file: ${target.path}`);
      return;
    }

    try {
      openExternalPath(target.path, target.openLabel);
      console.log(`[Ableton Session Mapper] Open external view completed: ${target.path}`);
    } catch (error) {
      console.warn("[Ableton Session Mapper] Open external view failed.", error);
    }
    return;
  }
}
