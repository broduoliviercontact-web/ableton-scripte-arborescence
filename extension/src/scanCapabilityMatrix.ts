import {
  AudioTrack,
  MidiTrack,
  RackDevice,
  type Device,
  type ExtensionContext,
  type Track,
} from "@ableton-extensions/sdk";
import { safeGet } from "./types.js";

export type CapabilityStatus =
  | "supported"
  | "partial"
  | "unavailable"
  | "unsafe"
  | "unknown"
  | "not-tested";

export interface CapabilityItem {
  capability: string;
  status: CapabilityStatus;
  evidence: string;
  valuePreview: unknown;
  notes: string;
  durationMs: number;
  risk: "low" | "medium" | "high";
}

export interface CapabilitySection {
  name: string;
  items: CapabilityItem[];
}

export interface CapabilityMatrix {
  version: "0.9.0";
  generatedAt: string;
  mode: "sdk-capability-matrix";
  safety: {
    deepRackScan: false;
    recursiveScan: false;
    maxTracks: number;
    maxDevices: number;
    maxParameters: number;
    maxDurationMs: number;
  };
  summary: {
    supported: number;
    partial: number;
    unavailable: number;
    unsafe: number;
    unknown: number;
    notTested: number;
  };
  sections: CapabilitySection[];
}

interface CapabilityMatrixLimits {
  maxTracks: number;
  maxDevices: number;
  maxParameters: number;
  maxDurationMs: number;
}

interface ProbeOutcome {
  status: CapabilityStatus;
  evidence?: string;
  valuePreview?: unknown;
  notes?: string;
  risk?: "low" | "medium" | "high";
}

interface ScanState {
  startedAt: number;
  inspectedDevices: number;
  inspectedParameters: number;
  limits: CapabilityMatrixLimits;
}

const DEFAULT_LIMITS: CapabilityMatrixLimits = {
  maxTracks: 20,
  maxDevices: 80,
  maxParameters: 200,
  maxDurationMs: 15_000,
};

const ROUTING_VARIANTS = {
  inputType: ["inputRoutingType", "input_routing_type", "currentInputRouting", "current_input_routing"],
  inputChannel: ["inputRoutingChannel", "input_routing_channel"],
  outputType: ["outputRoutingType", "output_routing_type", "currentOutputRouting", "current_output_routing"],
  outputChannel: ["outputRoutingChannel", "output_routing_channel"],
  sidechain: ["sidechain", "sideChain", "sidechainRouting", "sidechain_routing", "hasSidechain", "has_sidechain"],
  monitorMode: ["monitorMode", "monitor_mode", "monitoringState", "monitoring_state"],
} as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function objectType(value: unknown): string {
  try {
    if (typeof value !== "object" || value === null) return typeof value;
    return value.constructor?.name ?? "Object";
  } catch {
    return "UnknownObject";
  }
}

function shortenText(value: string, max = 140): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function summarizeValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "bigint") return value.toString();
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (depth >= 2) return `[${objectType(value)}]`;
  if (Array.isArray(value)) {
    return {
      length: value.length,
      items: value.slice(0, 8).map((item) => summarizeValue(item, depth + 1, seen)),
      truncated: value.length > 8,
    };
  }
  const summary: Record<string, unknown> = { objectType: objectType(value) };
  for (const key of ["name", "className", "type", "value"] as const) {
    try {
      const raw = Reflect.get(value, key) as unknown;
      if (raw === undefined) continue;
      summary[key] = summarizeValue(raw, depth + 1, seen);
    } catch {
      // Ignore preview failures.
    }
  }
  return summary;
}

async function readExistingProperty(target: object, property: string): Promise<{
  exists: boolean;
  value?: unknown;
  error?: string;
}> {
  try {
    if (!(property in target)) return { exists: false };
  } catch (error) {
    return { exists: false, error: errorMessage(error) };
  }
  try {
    const value = await Promise.resolve(Reflect.get(target, property) as unknown);
    return { exists: true, value };
  } catch (error) {
    return { exists: true, error: errorMessage(error) };
  }
}

async function inspectVariants(
  targets: object[],
  variants: readonly string[],
): Promise<{
  found: boolean;
  hasProperty: boolean;
  property?: string;
  values: unknown[];
  errors: string[];
}> {
  const values: unknown[] = [];
  const errors: string[] = [];
  let hasProperty = false;
  let property: string | undefined;

  for (const target of targets) {
    for (const variant of variants) {
      const result = await readExistingProperty(target, variant);
      if (!result.exists) continue;
      hasProperty = true;
      property ??= variant;
      if (result.error) {
        errors.push(`${variant}: ${result.error}`);
        continue;
      }
      if (result.value !== undefined && result.value !== null) {
        values.push(result.value);
      }
    }
  }

  return {
    found: values.length > 0,
    hasProperty,
    ...(property ? { property } : {}),
    values,
    errors,
  };
}

function isTimeLimitReached(state: ScanState): boolean {
  return Date.now() - state.startedAt >= state.limits.maxDurationMs;
}

async function safeProbe(
  capability: string,
  fn: () => Promise<ProbeOutcome>,
): Promise<CapabilityItem> {
  const startedAt = Date.now();
  try {
    const outcome = await fn();
    return {
      capability,
      status: outcome.status,
      evidence: outcome.evidence ?? "",
      valuePreview: outcome.valuePreview ?? null,
      notes: outcome.notes ?? "",
      durationMs: Date.now() - startedAt,
      risk: outcome.risk ?? "low",
    };
  } catch (error) {
    return {
      capability,
      status: "unknown",
      evidence: "Probe failed",
      valuePreview: null,
      notes: errorMessage(error),
      durationMs: Date.now() - startedAt,
      risk: "medium",
    };
  }
}

function notTested(capability: string, notes: string, evidence = "Skipped in shallow capability mode"): Promise<CapabilityItem> {
  return Promise.resolve({
    capability,
    status: "not-tested",
    evidence,
    valuePreview: null,
    notes,
    durationMs: 0,
    risk: "low",
  });
}

function unsafeCapability(capability: string, notes: string, evidence = "Disabled in diagnostic mode to protect Live stability"): Promise<CapabilityItem> {
  return Promise.resolve({
    capability,
    status: "unsafe",
    evidence,
    valuePreview: null,
    notes,
    durationMs: 0,
    risk: "high",
  });
}

async function getSong(context: ExtensionContext<"1.0.0">): Promise<object> {
  const song = await safeGet(() => context.application.song, null, "application.song");
  if (!song) throw new Error("The current Live Set is unavailable.");
  return song as unknown as object;
}

async function getRegularTracks(song: object): Promise<Track<"1.0.0">[]> {
  return safeGet(() => Reflect.get(song, "tracks") as Track<"1.0.0">[], [], "song.tracks");
}

async function getReturnTracks(song: object): Promise<Track<"1.0.0">[]> {
  return safeGet(
    () => (Reflect.get(song, "returnTracks") ?? Reflect.get(song, "return_tracks")) as Track<"1.0.0">[],
    [],
    "song.returnTracks",
  );
}

async function getMainTrack(song: object): Promise<Track<"1.0.0"> | null> {
  return safeGet(
    () => (Reflect.get(song, "mainTrack") ?? Reflect.get(song, "masterTrack") ?? Reflect.get(song, "master_track")) as Track<"1.0.0"> | null,
    null,
    "song.mainTrack",
  );
}

async function getSampleTracks(song: object, state: ScanState): Promise<Array<{
  track: Track<"1.0.0">;
  role: "track" | "return" | "master";
  index: number;
}>> {
  const regularTracks = (await getRegularTracks(song)).slice(0, state.limits.maxTracks);
  const remaining = Math.max(0, state.limits.maxTracks - regularTracks.length);
  const returnTracks = (await getReturnTracks(song)).slice(0, remaining);
  const mainTrack = remaining > returnTracks.length ? await getMainTrack(song) : null;
  return [
    ...regularTracks.map((track, index) => ({ track, role: "track" as const, index })),
    ...returnTracks.map((track, index) => ({ track, role: "return" as const, index })),
    ...(mainTrack ? [{ track: mainTrack, role: "master" as const, index: 0 }] : []),
  ];
}

async function getTrackDevices(track: Track<"1.0.0">): Promise<Device<"1.0.0">[]> {
  return safeGet(() => Reflect.get(track, "devices") as Device<"1.0.0">[], [], "track.devices");
}

async function getSampleDevices(
  trackSamples: Array<{ track: Track<"1.0.0"> }>,
  state: ScanState,
): Promise<Device<"1.0.0">[]> {
  const devices: Device<"1.0.0">[] = [];
  for (const { track } of trackSamples) {
    if (devices.length >= state.limits.maxDevices || isTimeLimitReached(state)) break;
    const trackDevices = await getTrackDevices(track);
    for (const device of trackDevices) {
      if (devices.length >= state.limits.maxDevices) break;
      devices.push(device);
      state.inspectedDevices += 1;
    }
  }
  return devices;
}

function trackTypeLabel(track: Track<"1.0.0">, role: "track" | "return" | "master"): string {
  if (role === "return") return "return";
  if (role === "master") return "master";
  if (track instanceof AudioTrack) return "audio";
  if (track instanceof MidiTrack) return "midi";
  return objectType(track);
}

async function probeDirectVariants(
  capability: string,
  targets: object[],
  variants: readonly string[],
  unavailableNote: string,
): Promise<CapabilityItem> {
  return safeProbe(capability, async () => {
    const result = await inspectVariants(targets, variants);
    if (result.found) {
      return {
        status: "supported",
        evidence: `Read via ${result.property ?? variants[0]}`,
        valuePreview: summarizeValue(result.values[0]),
      };
    }
    if (result.hasProperty) {
      return {
        status: "partial",
        evidence: `Property exists (${result.property ?? variants[0]}) but no stable value was returned`,
        valuePreview: result.errors.length > 0 ? result.errors : null,
        notes: unavailableNote,
        risk: "medium",
      };
    }
    return {
      status: "unavailable",
      evidence: "Not exposed by current SDK scan",
      valuePreview: null,
      notes: unavailableNote,
      risk: "low",
    };
  });
}

function previewNames(values: unknown[], max = 5): string[] {
  return values.slice(0, max).map((value) => shortenText(String(value)));
}

async function buildSetSection(song: object): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Set started");
  const items = await Promise.all([
    probeDirectVariants("Set name", [song], ["name"], "Set name is not exposed on this SDK object."),
    safeProbe("Tempo", async () => {
      const tempo = await safeGet(() => Reflect.get(song, "tempo") as number | null, null, "song.tempo");
      return typeof tempo === "number"
        ? { status: "supported", evidence: "Read from song.tempo", valuePreview: tempo }
        : { status: "unavailable", evidence: "Not exposed by current SDK scan", valuePreview: null };
    }),
    probeDirectVariants("Time signature", [song], ["signatureNumerator", "signature_numerator", "timeSignature", "time_signature"], "No stable time signature property found."),
    probeDirectVariants("Key / scale", [song], ["scaleName", "scale_name", "key", "musicalKey", "scale"], "No key/scale property found on the current song object."),
    safeProbe("Arrangement / session info", async () => {
      const scenes = await safeGet(() => Reflect.get(song, "scenes") as unknown[], [], "song.scenes");
      const tracks = await getRegularTracks(song);
      if (tracks.length > 0 || scenes.length > 0) {
        return {
          status: scenes.length > 0 ? "supported" : "partial",
          evidence: scenes.length > 0 ? "Tracks and scenes are readable from the song object" : "Tracks readable but scenes missing",
          valuePreview: { tracks: tracks.length, scenes: scenes.length },
        };
      }
      return {
        status: "unavailable",
        evidence: "No arrangement/session collection found",
        valuePreview: null,
      };
    }),
  ]);
  console.log("[Ableton Session Mapper] Probe Set completed");
  return { name: "Set", items };
}

async function buildTracksSection(trackSamples: Array<{
  track: Track<"1.0.0">;
  role: "track" | "return" | "master";
  index: number;
}>): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Tracks started");
  const trackObjects = trackSamples.map((item) => item.track as unknown as object);
  const names = await Promise.all(trackSamples.map(({ track }) => safeGet(() => track.name, null, "track.name")));
  const groupLinks = await Promise.all(trackObjects.map((track) => inspectVariants([track], ["groupTrack", "group_track"])));
  const items = await Promise.all([
    safeProbe("Track list", async () => ({
      status: trackSamples.length > 0 ? "supported" : "unavailable",
      evidence: `Read from first ${trackSamples.length} tracks`,
      valuePreview: trackSamples.length,
    })),
    safeProbe("Track order", async () => ({
      status: trackSamples.length > 0 ? "supported" : "unavailable",
      evidence: "Order preserved from song.tracks / returnTracks / mainTrack",
      valuePreview: previewNames(names.filter((value): value is string => typeof value === "string")),
    })),
    safeProbe("Track name", async () => ({
      status: names.some((value) => typeof value === "string" && value.length > 0) ? "supported" : "partial",
      evidence: `Read from first ${trackSamples.length} tracks`,
      valuePreview: previewNames(names.filter((value): value is string => typeof value === "string")),
    })),
    safeProbe("Track type audio/midi/return/master", async () => ({
      status: "supported",
      evidence: "Derived from SDK track classes and role",
      valuePreview: trackSamples.slice(0, 6).map(({ track, role }) => trackTypeLabel(track, role)),
    })),
    probeDirectVariants("Track color", trackObjects, ["color", "colorIndex", "color_index"], "Track color is not exposed by the current SDK scan."),
    probeDirectVariants("Mute", trackObjects, ["mute", "muted"], "No stable mute property found."),
    probeDirectVariants("Solo", trackObjects, ["solo"], "No stable solo property found."),
    probeDirectVariants("Arm", trackObjects, ["arm", "armed"], "No stable arm property found."),
    probeDirectVariants("Fold", trackObjects, ["isFoldable", "is_foldable", "foldState", "fold_state"], "Fold information is not consistently exposed."),
    safeProbe("Group membership", async () => {
      const linked = groupLinks.filter((result) => result.hasProperty || result.found);
      if (linked.length === 0) {
        return {
          status: "unavailable",
          evidence: "No groupTrack property found",
          valuePreview: null,
        };
      }
      const grouped = groupLinks.filter((result) => result.found).length;
      return {
        status: grouped > 0 ? "partial" : "partial",
        evidence: `groupTrack property visible on ${linked.length}/${trackSamples.length} sampled tracks`,
        valuePreview: { groupedTracks: grouped },
        notes: "Only parent-link visibility is tested here.",
        risk: "medium",
      };
    }),
    safeProbe("Parent group", async () => {
      const groupedNames = await Promise.all(
        trackSamples.slice(0, 8).map(async ({ track }) => {
          const probe = await inspectVariants([track as unknown as object], ["groupTrack", "group_track"]);
          if (!probe.found) return null;
          return summarizeValue(probe.values[0]);
        }),
      );
      return groupedNames.some(Boolean)
        ? {
            status: "partial",
            evidence: "Parent group links are readable on some tracks",
            valuePreview: groupedNames.filter(Boolean),
            notes: "Parent group object is visible, but mapping completeness depends on the current Set.",
            risk: "medium",
          }
        : {
            status: "unavailable",
            evidence: "No parent group value returned on sampled tracks",
            valuePreview: null,
          };
    }),
    safeProbe("Child tracks", async () => {
      const childCount = groupLinks.filter((result) => result.found).length;
      return childCount > 0
        ? {
            status: "partial",
            evidence: "Child relationships can be derived indirectly from groupTrack links",
            valuePreview: { derivedChildren: childCount },
            notes: "No direct childTracks collection was found.",
            risk: "medium",
          }
        : {
            status: "unavailable",
            evidence: "No direct child tracks collection found",
            valuePreview: null,
          };
    }),
  ]);
  console.log("[Ableton Session Mapper] Probe Tracks completed");
  return { name: "Tracks", items };
}

async function buildMixerSection(song: object, trackSamples: Array<{
  track: Track<"1.0.0">;
  role: "track" | "return" | "master";
}>): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Mixer started");
  const mixerTargets = (
    await Promise.all(
      trackSamples.map(async ({ track }) =>
        safeGet(() => Reflect.get(track, "mixer") as object | null, null, "track.mixer"),
      ),
    )
  ).filter((value): value is object => typeof value === "object" && value !== null);
  const firstTrack = trackSamples[0]?.track ?? null;
  const items = await Promise.all([
    probeDirectVariants("Volume", mixerTargets, ["volume"], "Mixer volume is not exposed on sampled tracks."),
    probeDirectVariants("Pan", mixerTargets, ["panning", "pan"], "Mixer panning is not exposed on sampled tracks."),
    safeProbe("Sends count", async () => {
      if (!firstTrack) return { status: "unavailable", evidence: "No sampled track available" };
      const sends = await safeGet(() => Reflect.get(firstTrack, "sends") as unknown[], [], "track.sends");
      return {
        status: Array.isArray(sends) ? "supported" : "unavailable",
        evidence: "Read from first sampled track",
        valuePreview: Array.isArray(sends) ? sends.length : null,
      };
    }),
    safeProbe("Send names", async () => {
      if (!firstTrack) return { status: "unavailable", evidence: "No sampled track available" };
      const sends = await safeGet(() => Reflect.get(firstTrack, "sends") as Array<{ name?: string }>, [], "track.sends");
      const names = sends
        .map((send) => (typeof send?.name === "string" ? send.name : null))
        .filter((name): name is string => Boolean(name));
      return names.length > 0
        ? {
            status: "supported",
            evidence: "Read send names from first sampled track",
            valuePreview: previewNames(names),
          }
        : {
            status: sends.length > 0 ? "partial" : "unavailable",
            evidence: sends.length > 0 ? "Send objects exist but names were empty" : "No sends on sampled track",
            valuePreview: null,
          };
    }),
    safeProbe("Send values", async () => {
      if (!firstTrack) return { status: "unavailable", evidence: "No sampled track available" };
      const sends = await safeGet(() => Reflect.get(firstTrack, "sends") as Array<{ value?: number }>, [], "track.sends");
      const values = sends
        .map((send) => (typeof send?.value === "number" ? send.value : null))
        .filter((value): value is number => value !== null);
      return values.length > 0
        ? {
            status: "supported",
            evidence: "Read send values from first sampled track",
            valuePreview: values.slice(0, 8),
          }
        : {
            status: sends.length > 0 ? "partial" : "unavailable",
            evidence: sends.length > 0 ? "Send objects exist but values were empty" : "No sends on sampled track",
            valuePreview: null,
          };
    }),
    safeProbe("Return tracks", async () => {
      const returns = await getReturnTracks(song);
      return {
        status: returns.length >= 0 ? "supported" : "unavailable",
        evidence: "Read from song.returnTracks",
        valuePreview: returns.length,
      };
    }),
    safeProbe("Master track", async () => {
      const mainTrack = await getMainTrack(song);
      return mainTrack
        ? {
            status: "supported",
            evidence: "Read from song.mainTrack",
            valuePreview: summarizeValue(mainTrack),
          }
        : {
            status: "unavailable",
            evidence: "No mainTrack returned by song object",
            valuePreview: null,
          };
    }),
  ]);
  console.log("[Ableton Session Mapper] Probe Mixer completed");
  return { name: "Mixer", items };
}

async function buildRoutingSection(
  trackSamples: Array<{ track: Track<"1.0.0">; role: "track" | "return" | "master" }>,
): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Routing I/O started");
  const trackObjects = trackSamples.map(({ track }) => track as unknown as object);
  const items = await Promise.all([
    probeDirectVariants("Audio From", trackObjects, [...ROUTING_VARIANTS.inputType, ...ROUTING_VARIANTS.inputChannel], "Not exposed by current SDK scan"),
    probeDirectVariants("Audio To", trackObjects, [...ROUTING_VARIANTS.outputType, ...ROUTING_VARIANTS.outputChannel], "Not exposed by current SDK scan"),
    probeDirectVariants("MIDI From", trackObjects, [...ROUTING_VARIANTS.inputType, ...ROUTING_VARIANTS.inputChannel], "Not exposed by current SDK scan"),
    probeDirectVariants("MIDI To", trackObjects, [...ROUTING_VARIANTS.outputType, ...ROUTING_VARIANTS.outputChannel], "Not exposed by current SDK scan"),
    probeDirectVariants("External In", trackObjects, ["externalInput", "external_input", ...ROUTING_VARIANTS.inputType], "Not exposed by current SDK scan"),
    probeDirectVariants("External Out", trackObjects, ["externalOutput", "external_output", ...ROUTING_VARIANTS.outputType], "Not exposed by current SDK scan"),
    probeDirectVariants("Monitor mode", trackObjects, ROUTING_VARIANTS.monitorMode, "Monitor mode is not exposed by the sampled tracks."),
    probeDirectVariants("Sidechain source", trackObjects, ROUTING_VARIANTS.sidechain, "Sidechain source is not exposed by current SDK scan"),
    probeDirectVariants("Sidechain enabled", trackObjects, ["hasSidechain", "has_sidechain", "sidechainEnabled", "sidechain_enabled"], "Sidechain enabled state is not exposed by current SDK scan"),
    probeDirectVariants("Group routing", trackObjects, ["groupTrack", "group_track", ...ROUTING_VARIANTS.outputType], "Group routing is not directly exposed."),
    probeDirectVariants("Return routing", trackObjects, [...ROUTING_VARIANTS.outputType], "Return routing is not exposed by current SDK scan"),
    probeDirectVariants("Master routing", trackObjects, [...ROUTING_VARIANTS.outputType], "Master routing is not exposed by current SDK scan"),
  ]);
  console.log("[Ableton Session Mapper] Probe Routing I/O completed");
  return { name: "Routing I/O", items };
}

async function buildDevicesSection(
  trackSamples: Array<{ track: Track<"1.0.0">; role: "track" | "return" | "master" }>,
  state: ScanState,
): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Devices started");
  const devices = await getSampleDevices(trackSamples, state);
  const deviceObjects = devices.map((device) => device as unknown as object);
  const parameterSamples: object[] = [];
  for (const device of devices) {
    if (isTimeLimitReached(state) || state.inspectedParameters >= state.limits.maxParameters) break;
    const parameters = await safeGet(() => Reflect.get(device, "parameters") as object[], [], "device.parameters");
    for (const parameter of parameters) {
      if (state.inspectedParameters >= state.limits.maxParameters) break;
      if (typeof parameter === "object" && parameter !== null) {
        parameterSamples.push(parameter);
        state.inspectedParameters += 1;
      }
    }
  }
  const items = await Promise.all([
    safeProbe("Device list", async () => ({
      status: devices.length > 0 ? "supported" : "unavailable",
      evidence: `Read from ${Math.min(trackSamples.length, state.limits.maxTracks)} sampled tracks`,
      valuePreview: devices.length,
    })),
    safeProbe("Device order", async () => ({
      status: devices.length > 0 ? "supported" : "unavailable",
      evidence: "Order preserved from track.devices",
      valuePreview: devices.slice(0, 8).map((device) => shortenText(device.name)),
    })),
    safeProbe("Device name", async () => ({
      status: devices.some((device) => typeof device.name === "string" && device.name.length > 0) ? "supported" : "partial",
      evidence: `Read from ${devices.length} sampled devices`,
      valuePreview: devices.slice(0, 8).map((device) => shortenText(device.name)),
    })),
    probeDirectVariants("Device type/class", deviceObjects, ["className", "type"], "Device class/type is not stably exposed on sampled devices."),
    safeProbe("Is rack", async () => {
      const rackLike = devices.filter((device) => device instanceof RackDevice || /rack/i.test(objectType(device)));
      return {
        status: rackLike.length > 0 ? "supported" : "partial",
        evidence: "Derived from RackDevice instances and object type names",
        valuePreview: rackLike.slice(0, 6).map((device) => device.name),
      };
    }),
    probeDirectVariants("Device enabled", deviceObjects, ["isActive", "is_active", "enabled"], "Device enabled state is not consistently exposed."),
    safeProbe("Device parameters", async () => ({
      status: parameterSamples.length > 0 ? "supported" : "partial",
      evidence: `Read from up to ${state.limits.maxParameters} sampled parameters`,
      valuePreview: parameterSamples.length,
    })),
    probeDirectVariants("Parameter name", parameterSamples, ["name"], "Parameter names are not exposed on sampled parameters."),
    probeDirectVariants("Parameter value", parameterSamples, ["value"], "Parameter values are not exposed on sampled parameters."),
    probeDirectVariants("Parameter min/max", parameterSamples, ["min", "max"], "Parameter min/max are not exposed on sampled parameters."),
    probeDirectVariants("Parameter automation state", parameterSamples, ["automationState", "automation_state", "isAutomated", "is_automated"], "Automation state is not exposed on sampled parameters."),
  ]);
  console.log("[Ableton Session Mapper] Probe Devices completed");
  return { name: "Devices", items };
}

async function buildRacksSection(
  trackSamples: Array<{ track: Track<"1.0.0">; role: "track" | "return" | "master" }>,
  state: ScanState,
): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Racks started");
  const devices = await getSampleDevices(trackSamples, state);
  const rackDevices = devices.filter((device) => device instanceof RackDevice || /rack/i.test(objectType(device)));
  const rackObjects = rackDevices.map((device) => device as unknown as object);
  const macroParameters: object[] = [];
  for (const device of rackDevices) {
    const parameters = await safeGet(() => Reflect.get(device, "parameters") as Array<{ name?: string }>, [], "rack.parameters");
    for (const parameter of parameters) {
      if (typeof parameter?.name === "string" && /macro/i.test(parameter.name)) {
        macroParameters.push(parameter as unknown as object);
      }
    }
  }
  const items = await Promise.all([
    safeProbe("Rack detection", async () => ({
      status: rackDevices.length > 0 ? "supported" : "partial",
      evidence: "Rack-like devices detected from sampled device list",
      valuePreview: rackDevices.slice(0, 8).map((device) => shortenText(device.name)),
    })),
    probeDirectVariants("Rack chains count", rackObjects, ["chains"], "Chains are not exposed on sampled racks."),
    safeProbe("Chain names", async () => {
      const chainNames: string[] = [];
      for (const rack of rackObjects) {
        const chains = await safeGet(() => Reflect.get(rack, "chains") as Array<{ name?: string }>, [], "rack.chains");
        for (const chain of chains) {
          if (typeof chain?.name === "string" && chain.name.length > 0) chainNames.push(chain.name);
        }
      }
      return chainNames.length > 0
        ? { status: "partial", evidence: "Chain names readable from shallow rack scan", valuePreview: previewNames(chainNames) }
        : { status: rackObjects.length > 0 ? "partial" : "unavailable", evidence: rackObjects.length > 0 ? "Racks found but chain names were empty" : "No racks sampled", valuePreview: null };
    }),
    unsafeCapability("Chain devices", "Deep chain-device recursion is intentionally disabled because earlier scans could stall or freeze Live."),
    unsafeCapability("Nested racks", "Nested rack recursion remains disabled in capability-matrix mode."),
    probeDirectVariants("Drum rack pads", rackObjects, ["drumPads", "visibleDrumPads", "pads"], "Pad collections are not exposed on sampled racks."),
    safeProbe("Pad names", async () => {
      const padNames: string[] = [];
      for (const rack of rackObjects) {
        const pads = await safeGet(
          () =>
            (Reflect.get(rack, "drumPads") ??
              Reflect.get(rack, "visibleDrumPads") ??
              Reflect.get(rack, "pads")) as Array<{ name?: string }>,
          [],
          "rack.pads",
        );
        for (const pad of pads) {
          if (typeof pad?.name === "string" && pad.name.length > 0) padNames.push(pad.name);
        }
      }
      return padNames.length > 0
        ? {
            status: "partial",
            evidence: "Pad names readable from shallow pad collections",
            valuePreview: previewNames(padNames),
          }
        : {
            status: rackObjects.length > 0 ? "partial" : "unavailable",
            evidence: rackObjects.length > 0 ? "Pad collections were empty" : "No racks sampled",
            valuePreview: null,
          };
    }),
    unsafeCapability("Pad chains", "Per-pad chain traversal is intentionally skipped in shallow capability mode."),
    safeProbe("Macro controls", async () => ({
      status: macroParameters.length > 0 ? "partial" : rackObjects.length > 0 ? "partial" : "unavailable",
      evidence: rackObjects.length > 0 ? "Scanned shallow rack parameters for names matching Macro" : "No racks sampled",
      valuePreview: macroParameters.slice(0, 8).map((parameter) => summarizeValue(parameter)),
      notes: "Only visible macro-like parameter names are counted here.",
      risk: "medium",
    })),
    probeDirectVariants("Rack variations", rackObjects, ["variations", "variation", "selectedVariation", "selected_variation"], "Rack variations are not exposed on sampled racks."),
  ]);
  console.log("[Ableton Session Mapper] Probe Racks completed");
  return { name: "Racks", items };
}

async function buildClipsSection(song: object): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Clips started");
  const scenes = await safeGet(() => Reflect.get(song, "scenes") as object[], [], "song.scenes");
  const sceneObjects = scenes.filter((scene): scene is object => typeof scene === "object" && scene !== null).slice(0, 2);
  const items = await Promise.all([
    safeProbe("Session clips", async () => {
      if (sceneObjects.length === 0) {
        return { status: "not-tested", evidence: "No scenes available to probe safely", valuePreview: null, notes: "Result depends on the currently opened Set." };
      }
      const clipSlots = await inspectVariants(sceneObjects, ["clipSlots", "clip_slots"]);
      if (clipSlots.found || clipSlots.hasProperty) {
        return {
          status: clipSlots.found ? "partial" : "partial",
          evidence: `Scene clip-slot collections visible via ${clipSlots.property ?? "clipSlots"}`,
          valuePreview: summarizeValue(clipSlots.values[0] ?? null),
          notes: "Only shallow clip-slot collections are tested.",
          risk: "medium",
        };
      }
      return {
        status: "unavailable",
        evidence: "No clipSlots collection found on sampled scenes",
        valuePreview: null,
      };
    }),
    probeDirectVariants("Clip slots", sceneObjects, ["clipSlots", "clip_slots"], "Clip-slot collections are not exposed on sampled scenes."),
    notTested("Clip names", "Clip object traversal is skipped by default to avoid context-dependent scans."),
    notTested("Clip colors", "Clip color probing is skipped in shallow capability mode."),
    notTested("MIDI clip notes", "Reading note lists can be expensive and is not part of the default capability scan."),
    notTested("Audio clip metadata", "Audio clip metadata remains untested in shallow capability mode."),
    notTested("Arrangement clips", "Arrangement clip traversal is not enabled by default."),
    notTested("Clip start/end", "Clip timing fields are not traversed in the default safe scan."),
    notTested("Loop start/end", "Loop timing fields are not traversed in the default safe scan."),
    notTested("Warp info", "Warp-related clip probing remains disabled by default."),
  ]);
  console.log("[Ableton Session Mapper] Probe Clips completed");
  return { name: "Clips", items };
}

async function buildArrangementSection(song: object): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Arrangement started");
  const items = await Promise.all([
    probeDirectVariants("Arrangement locators", [song], ["locators", "arrangementLocators", "arrangement_locators"], "Arrangement locators are not exposed on the current song object."),
    notTested("Arrangement clips", "Arrangement clip traversal remains disabled in capability-matrix mode."),
    notTested("Automation lanes", "Automation-lane probing remains disabled in capability-matrix mode."),
    probeDirectVariants("Selected arrangement region", [song], ["selection", "arrangementSelection", "arrangement_selection"], "Arrangement selection is not exposed on the current song object."),
    probeDirectVariants("Current song position", [song], ["currentSongTime", "current_song_time", "songTime", "song_time"], "Current song position is not exposed on the current song object."),
  ]);
  console.log("[Ableton Session Mapper] Probe Arrangement completed");
  return { name: "Arrangement", items };
}

async function buildBrowserFilesSection(song: object): Promise<CapabilitySection> {
  console.log("[Ableton Session Mapper] Probe Browser / Files started");
  const items = await Promise.all([
    probeDirectVariants("Project path", [song], ["projectPath", "project_path"], "Project path is not exposed on the current song object."),
    probeDirectVariants("Set path", [song], ["filePath", "file_path", "path"], "Set path is not exposed on the current song object."),
    probeDirectVariants("Sample references", [song], ["sampleReferences", "sample_references"], "Sample references are not exposed on the current song object."),
    probeDirectVariants("Missing media", [song], ["missingMedia", "missing_media"], "Missing media is not exposed on the current song object."),
    probeDirectVariants("Device preset paths", [song], ["presetPath", "preset_path", "devicePresetPaths"], "Device preset paths are not exposed on the current song object."),
  ]);
  console.log("[Ableton Session Mapper] Probe Browser / Files completed");
  return { name: "Browser / Files", items };
}

function buildSummary(sections: CapabilitySection[]): CapabilityMatrix["summary"] {
  const summary: CapabilityMatrix["summary"] = {
    supported: 0,
    partial: 0,
    unavailable: 0,
    unsafe: 0,
    unknown: 0,
    notTested: 0,
  };
  for (const item of sections.flatMap((section) => section.items)) {
    switch (item.status) {
      case "supported":
        summary.supported += 1;
        break;
      case "partial":
        summary.partial += 1;
        break;
      case "unavailable":
        summary.unavailable += 1;
        break;
      case "unsafe":
        summary.unsafe += 1;
        break;
      case "unknown":
        summary.unknown += 1;
        break;
      case "not-tested":
        summary.notTested += 1;
        break;
    }
  }
  return summary;
}

export async function scanCapabilityMatrix(
  context: ExtensionContext<"1.0.0">,
): Promise<CapabilityMatrix> {
  console.log("[Ableton Session Mapper] SDK Capability Matrix started");
  const song = await getSong(context);
  const state: ScanState = {
    startedAt: Date.now(),
    inspectedDevices: 0,
    inspectedParameters: 0,
    limits: DEFAULT_LIMITS,
  };
  const trackSamples = await getSampleTracks(song, state);

  const sections = await Promise.all([
    buildSetSection(song),
    buildTracksSection(trackSamples),
    buildMixerSection(song, trackSamples),
    buildRoutingSection(trackSamples),
    buildDevicesSection(trackSamples, state),
    buildRacksSection(trackSamples, state),
    buildClipsSection(song),
    buildArrangementSection(song),
    buildBrowserFilesSection(song),
  ]);

  const matrix: CapabilityMatrix = {
    version: "0.9.0",
    generatedAt: new Date().toISOString(),
    mode: "sdk-capability-matrix",
    safety: {
      deepRackScan: false,
      recursiveScan: false,
      maxTracks: state.limits.maxTracks,
      maxDevices: state.limits.maxDevices,
      maxParameters: state.limits.maxParameters,
      maxDurationMs: state.limits.maxDurationMs,
    },
    summary: buildSummary(sections),
    sections,
  };
  console.log("[Ableton Session Mapper] SDK Capability Matrix completed");
  return matrix;
}

function formatValuePreview(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function statusClass(status: CapabilityStatus): string {
  return `status-${status}`;
}

export function renderCapabilityMatrixHtml(matrix: CapabilityMatrix): string {
  const summaryCards = [
    ["supported", matrix.summary.supported],
    ["partial", matrix.summary.partial],
    ["unavailable", matrix.summary.unavailable],
    ["unsafe", matrix.summary.unsafe],
    ["unknown", matrix.summary.unknown],
    ["not-tested", matrix.summary.notTested],
  ]
    .map(
      ([label, value]) => `<article class="metric-card ${statusClass(label as CapabilityStatus)}">
        <strong>${value}</strong>
        <span>${escapeHtml(String(label))}</span>
      </article>`,
    )
    .join("");

  const sectionTables = matrix.sections
    .map(
      (section) => `<section class="section-card">
        <header class="section-head">
          <h2>${escapeHtml(section.name)}</h2>
          <span>${section.items.length} capabilities</span>
        </header>
        <div class="table-shell">
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Notes</th>
                <th>Duration</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              ${section.items
                .map(
                  (item) => `<tr>
                    <td>
                      <strong>${escapeHtml(item.capability)}</strong>
                      <div class="preview">${escapeHtml(shortenText(formatValuePreview(item.valuePreview), 120))}</div>
                    </td>
                    <td><span class="status-badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
                    <td>${escapeHtml(item.evidence || "—")}</td>
                    <td>${escapeHtml(item.notes || "—")}</td>
                    <td>${item.durationMs} ms</td>
                    <td>${escapeHtml(item.risk)}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SDK Capability Matrix</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #121212;
      --panel: #1d1d1d;
      --panel-2: #252525;
      --border: rgba(255,255,255,0.08);
      --text: #f2efe8;
      --muted: #aaa59c;
      --accent: #f5a623;
      --supported: #53c26b;
      --partial: #e4bf54;
      --unavailable: #8f8f8f;
      --unsafe: #f18d32;
      --unknown: #7a7a7a;
      --not-tested: #6d8fb7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top right, rgba(245,166,35,0.10), transparent 28%),
        linear-gradient(180deg, #252525, #121212);
      color: var(--text);
      padding: 24px;
    }
    .page {
      max-width: 1440px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }
    .hero, .summary, .section-card, .safety-card {
      background: rgba(29,29,29,0.95);
      border: 1px solid var(--border);
      border-radius: 18px;
    }
    .hero, .safety-card, .section-card { padding: 18px; }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 11px;
    }
    h1, h2 { margin: 0; }
    .hero p, .safety-card p, .section-head span { color: var(--muted); }
    .summary {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 1px;
      padding: 1px;
      background: rgba(255,255,255,0.04);
    }
    .metric-card {
      background: var(--panel);
      padding: 16px 12px;
      text-align: center;
    }
    .metric-card strong { display: block; font-size: 26px; margin-bottom: 4px; }
    .metric-card span { text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: var(--muted); }
    .status-supported { color: var(--supported); }
    .status-partial { color: var(--partial); }
    .status-unavailable { color: var(--unavailable); }
    .status-unsafe { color: var(--unsafe); }
    .status-unknown { color: var(--unknown); }
    .status-not-tested { color: var(--not-tested); }
    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }
    .table-shell { overflow: auto; border-radius: 14px; border: 1px solid var(--border); }
    table { width: 100%; min-width: 980px; border-collapse: collapse; background: var(--panel); }
    th, td { padding: 12px; text-align: left; vertical-align: top; }
    th {
      background: var(--panel-2);
      color: var(--accent);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    td { border-top: 1px solid rgba(255,255,255,0.05); font-size: 13px; line-height: 1.45; }
    .status-badge {
      display: inline-flex;
      border-radius: 999px;
      padding: 4px 8px;
      border: 1px solid currentColor;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
    }
    .preview {
      margin-top: 6px;
      color: var(--muted);
      font-size: 11px;
      overflow-wrap: anywhere;
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">SDK Capability Matrix</p>
      <h1>Ability map of the current Ableton Extensions SDK surface</h1>
      <p>Generated at ${escapeHtml(matrix.generatedAt)} · mode: ${escapeHtml(matrix.mode)}</p>
    </section>

    <section class="summary">
      ${summaryCards}
    </section>

    <section class="safety-card">
      <h2>Safety guardrails</h2>
      <p>deepRackScan=${String(matrix.safety.deepRackScan)} · recursiveScan=${String(matrix.safety.recursiveScan)} · maxTracks=${matrix.safety.maxTracks} · maxDevices=${matrix.safety.maxDevices} · maxParameters=${matrix.safety.maxParameters} · maxDurationMs=${matrix.safety.maxDurationMs}</p>
    </section>

    ${sectionTables}
  </div>
</body>
</html>`;
}

export function renderCapabilityMatrixMarkdown(matrix: CapabilityMatrix): string {
  const lines: string[] = [];
  lines.push("# SDK Capability Matrix");
  lines.push("");
  lines.push(`Generated at: ${matrix.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("| --- | ---: |");
  lines.push(`| supported | ${matrix.summary.supported} |`);
  lines.push(`| partial | ${matrix.summary.partial} |`);
  lines.push(`| unavailable | ${matrix.summary.unavailable} |`);
  lines.push(`| unsafe | ${matrix.summary.unsafe} |`);
  lines.push(`| unknown | ${matrix.summary.unknown} |`);
  lines.push(`| not-tested | ${matrix.summary.notTested} |`);
  lines.push("");

  for (const section of matrix.sections) {
    lines.push(`## ${section.name}`);
    lines.push("");
    lines.push("| Capability | Status | Evidence | Notes | Duration | Risk |");
    lines.push("| --- | --- | --- | --- | ---: | --- |");
    for (const item of section.items) {
      lines.push(
        `| ${item.capability.replaceAll("|", "\\|")} | ${item.status} | ${String(item.evidence || "—").replaceAll("|", "\\|")} | ${String(item.notes || "—").replaceAll("|", "\\|")} | ${item.durationMs} ms | ${item.risk} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Supported");
  lines.push("");
  for (const item of matrix.sections.flatMap((section) => section.items).filter((item) => item.status === "supported")) {
    lines.push(`- ${item.capability}`);
  }
  lines.push("");

  lines.push("## Partial");
  lines.push("");
  for (const item of matrix.sections.flatMap((section) => section.items).filter((item) => item.status === "partial")) {
    lines.push(`- ${item.capability}`);
  }
  lines.push("");

  lines.push("## Unavailable");
  lines.push("");
  for (const item of matrix.sections.flatMap((section) => section.items).filter((item) => item.status === "unavailable")) {
    lines.push(`- ${item.capability}`);
  }
  lines.push("");

  lines.push("## Unsafe");
  lines.push("");
  for (const item of matrix.sections.flatMap((section) => section.items).filter((item) => item.status === "unsafe")) {
    lines.push(`- ${item.capability}`);
  }
  lines.push("");

  lines.push("## Unknown / Not tested");
  lines.push("");
  for (const item of matrix.sections.flatMap((section) => section.items).filter((item) => item.status === "unknown" || item.status === "not-tested")) {
    lines.push(`- ${item.capability} (${item.status})`);
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}
