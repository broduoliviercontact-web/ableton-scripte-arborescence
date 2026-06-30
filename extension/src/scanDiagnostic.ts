import {
  AudioTrack,
  MidiTrack,
  RackDevice,
  type Device,
  type ExtensionContext,
  type Song,
  type Track,
} from "@ableton-extensions/sdk";
import { safeGet } from "./types.js";

export type DiagnosticStatus = "available" | "missing" | "error";

export interface PropertyDiagnostic {
  property: string;
  status: DiagnosticStatus;
  value?: unknown;
  error?: string;
}

export interface ObjectDiagnostic {
  objectType: string;
  id: string | null;
  name: string | null;
  availableProperties: string[];
  properties: PropertyDiagnostic[];
}

export interface DeviceDiagnostic extends ObjectDiagnostic {
  index: number;
  isRack: boolean;
  chains: ChainDiagnostic[];
}

export interface ChainDiagnostic extends ObjectDiagnostic {
  index: number;
  devices: DeviceDiagnostic[];
  mixer: ObjectDiagnostic | null;
}

export interface TrackDiagnostic extends ObjectDiagnostic {
  index: number;
  role: "track" | "return" | "master";
  detectedType: string;
  devices: DeviceDiagnostic[];
  mixer: ObjectDiagnostic | null;
}

export interface SdkDiagnostic {
  version: "0.3.0";
  generatedAt: string;
  sdkApiVersion: "1.0.0";
  summary: {
    tracksInspected: number;
    routingsFound: number;
    devicesInspected: number;
    racksDetected: number;
    chainsDetected: number;
    propertyErrors: number;
  };
  song: ObjectDiagnostic;
  tracks: TrackDiagnostic[];
}

const TRACK_PROPERTIES = [
  "name", "mute", "solo", "arm", "mutedViaSolo", "groupTrack", "group_track",
  "isFoldable", "is_foldable", "devices", "mixer", "mixerDevice", "mixer_device",
  "inputRoutingType", "input_routing_type", "currentInputRouting", "current_input_routing",
  "inputRoutingChannel", "input_routing_channel", "availableInputRoutingTypes",
  "available_input_routing_types", "availableInputRoutingChannels",
  "available_input_routing_channels", "outputRoutingType", "output_routing_type",
  "currentOutputRouting", "current_output_routing", "outputRoutingChannel",
  "output_routing_channel", "availableOutputRoutingTypes", "available_output_routing_types",
  "availableOutputRoutingChannels", "available_output_routing_channels", "sends",
  "sidechain", "sideChain", "sidechainRouting", "sidechain_routing",
] as const;

const DEVICE_PROPERTIES = [
  "name", "parameters", "chains", "canHaveChains", "can_have_chains", "className",
  "type", "isActive", "is_active", "sidechain", "sideChain", "hasSidechain",
  "has_sidechain", "sidechainRouting", "sidechain_routing", "inputRoutingType",
  "input_routing_type", "inputRoutingChannel", "input_routing_channel",
] as const;

const MIXER_PROPERTIES = [
  "volume", "panning", "sends", "crossfader", "cueVolume", "cue_volume",
  "inputRoutingType", "input_routing_type", "outputRoutingType", "output_routing_type",
  "sidechain", "sideChain", "sidechainRouting", "sidechain_routing",
] as const;

const CHAIN_PROPERTIES = [
  "devices", "mixer", "mixerDevice", "mixer_device", "name", "receivingNote",
  "receiving_note", "sends", "inputRoutingType", "input_routing_type",
  "outputRoutingType", "output_routing_type", "sidechain", "sideChain",
] as const;

const SONG_PROPERTIES = [
  "tempo", "tracks", "returnTracks", "return_tracks", "mainTrack", "masterTrack",
  "master_track", "scenes", "name", "filePath", "file_path",
] as const;

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

function getAvailableProperties(target: object): string[] {
  const properties = new Set<string>();
  try {
    for (const key of Object.getOwnPropertyNames(target)) properties.add(key);
  } catch {
    // Some host proxies reject own-property inspection.
  }
  let prototype: object | null = target;
  for (let depth = 0; depth < 8 && prototype; depth += 1) {
    try {
      prototype = Object.getPrototypeOf(prototype) as object | null;
      if (!prototype || prototype === Object.prototype) break;
      for (const key of Object.getOwnPropertyNames(prototype)) {
        if (key !== "constructor") properties.add(key);
      }
    } catch {
      break;
    }
  }
  return [...properties].sort();
}

function summarizeValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
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
      items: value.slice(0, 64).map((item) => summarizeValue(item, depth + 1, seen)),
      truncated: value.length > 64,
    };
  }

  const summary: Record<string, unknown> = { objectType: objectType(value) };
  for (const key of ["handle", "id", "name", "value", "type", "channel"] as const) {
    try {
      const raw = Reflect.get(value, key) as unknown;
      if (raw === undefined) continue;
      if (key === "handle" && typeof raw === "object" && raw !== null) {
        const id = Reflect.get(raw, "id") as unknown;
        summary.handleId = typeof id === "bigint" ? id.toString() : id;
      } else {
        summary[key] = summarizeValue(raw, depth + 1, seen);
      }
    } catch (error) {
      summary[`${key}Error`] = errorMessage(error);
    }
  }
  return summary;
}

interface InspectedValue {
  diagnostic: PropertyDiagnostic;
  rawValue?: unknown;
}

async function inspectValue(target: object, property: string): Promise<InspectedValue> {
  let exists = false;
  try {
    exists = property in target;
  } catch (error) {
    return {
      diagnostic: { property, status: "error", error: errorMessage(error) },
    };
  }
  if (!exists) return { diagnostic: { property, status: "missing" } };
  try {
    const rawValue = await Promise.resolve(Reflect.get(target, property) as unknown);
    return {
      rawValue,
      diagnostic: {
        property,
        status: "available",
        value: summarizeValue(rawValue),
      },
    };
  } catch (error) {
    return {
      diagnostic: { property, status: "error", error: errorMessage(error) },
    };
  }
}

export async function safeInspect(
  target: object,
  properties: readonly string[],
): Promise<PropertyDiagnostic[]> {
  return Promise.all(properties.map(async (property) => (await inspectValue(target, property)).diagnostic));
}

async function identity(target: object): Promise<Pick<ObjectDiagnostic, "objectType" | "id" | "name">> {
  const handle = await inspectValue(target, "handle");
  const name = await inspectValue(target, "name");
  let id: string | null = null;
  try {
    const rawHandle = handle.rawValue as { id?: bigint } | undefined;
    id = rawHandle?.id?.toString() ?? null;
  } catch {
    id = null;
  }
  return {
    objectType: objectType(target),
    id,
    name: typeof name.rawValue === "string" ? name.rawValue : null,
  };
}

async function inspectMixer(mixer: object | null): Promise<ObjectDiagnostic | null> {
  if (!mixer) return null;
  return {
    ...(await identity(mixer)),
    availableProperties: getAvailableProperties(mixer),
    properties: await safeInspect(mixer, MIXER_PROPERTIES),
  };
}

async function inspectDevice(
  device: Device<"1.0.0">,
  index: number,
): Promise<DeviceDiagnostic> {
  const chainsValue = await inspectValue(device, "chains");
  const rawChains = Array.isArray(chainsValue.rawValue) ? chainsValue.rawValue : [];
  const chains = await Promise.all(
    rawChains.map((chain, chainIndex) => inspectChain(chain as object, chainIndex)),
  );
  return {
    ...(await identity(device)),
    index,
    isRack: device instanceof RackDevice || chainsValue.diagnostic.status === "available",
    availableProperties: getAvailableProperties(device),
    properties: await safeInspect(device, DEVICE_PROPERTIES),
    chains,
  };
}

async function inspectChain(chain: object, index: number): Promise<ChainDiagnostic> {
  const devicesValue = await inspectValue(chain, "devices");
  const mixerValue = await inspectValue(chain, "mixer");
  const devices = Array.isArray(devicesValue.rawValue)
    ? await Promise.all(
        devicesValue.rawValue.map((device, deviceIndex) =>
          inspectDevice(device as Device<"1.0.0">, deviceIndex),
        ),
      )
    : [];
  return {
    ...(await identity(chain)),
    index,
    availableProperties: getAvailableProperties(chain),
    properties: await safeInspect(chain, CHAIN_PROPERTIES),
    devices,
    mixer: await inspectMixer(
      typeof mixerValue.rawValue === "object" && mixerValue.rawValue !== null
        ? mixerValue.rawValue
        : null,
    ),
  };
}

async function inspectTrack(
  track: Track<"1.0.0">,
  index: number,
  role: TrackDiagnostic["role"],
): Promise<TrackDiagnostic> {
  const devicesValue = await inspectValue(track, "devices");
  const mixerValue = await inspectValue(track, "mixer");
  const devices = Array.isArray(devicesValue.rawValue)
    ? await Promise.all(
        devicesValue.rawValue.map((device, deviceIndex) => inspectDevice(device, deviceIndex)),
      )
    : [];
  const sdkType = track instanceof AudioTrack
    ? "AudioTrack"
    : track instanceof MidiTrack
      ? "MidiTrack"
      : objectType(track);
  return {
    ...(await identity(track)),
    index,
    role,
    detectedType: role === "return" ? "ReturnTrack" : role === "master" ? "MasterTrack" : sdkType,
    availableProperties: getAvailableProperties(track),
    properties: await safeInspect(track, TRACK_PROPERTIES),
    devices,
    mixer: await inspectMixer(
      typeof mixerValue.rawValue === "object" && mixerValue.rawValue !== null
        ? mixerValue.rawValue
        : null,
    ),
  };
}

function countNestedDevices(devices: DeviceDiagnostic[]): number {
  return devices.reduce(
    (total, device) =>
      total + 1 + device.chains.reduce((sum, chain) => sum + countNestedDevices(chain.devices), 0),
    0,
  );
}

function countNestedChains(devices: DeviceDiagnostic[]): number {
  return devices.reduce(
    (total, device) =>
      total + device.chains.length + device.chains.reduce((sum, chain) => sum + countNestedChains(chain.devices), 0),
    0,
  );
}

function countNestedRacks(devices: DeviceDiagnostic[]): number {
  return devices.reduce(
    (total, device) =>
      total + (device.isRack ? 1 : 0) + device.chains.reduce((sum, chain) => sum + countNestedRacks(chain.devices), 0),
    0,
  );
}

function countStatuses(value: unknown, status: DiagnosticStatus): number {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countStatuses(item, status), 0);
  if (typeof value !== "object" || value === null) return 0;
  const record = value as Record<string, unknown>;
  return (record.status === status ? 1 : 0) +
    Object.values(record).reduce<number>(
      (sum, item) => sum + countStatuses(item, status),
      0,
    );
}

function countRoutings(tracks: TrackDiagnostic[]): number {
  const routingPattern = /(input|output).*routing|routing.*(type|channel)|sidechain/i;
  return tracks.reduce(
    (total, track) => total + track.properties.filter(
      (property) =>
        routingPattern.test(property.property) &&
        property.status === "available" &&
        property.value !== null &&
        property.value !== undefined,
    ).length,
    0,
  );
}

export async function scanSdkDiagnostic(
  context: ExtensionContext<"1.0.0">,
): Promise<SdkDiagnostic> {
  const song = await safeGet(() => context.application.song, null, "application.song");
  if (!song) throw new Error("The current Live Set is unavailable.");
  const regularTracks = await safeGet(() => song.tracks, [], "song.tracks");
  const returnTracks = await safeGet(() => song.returnTracks, [], "song.returnTracks");
  const mainTrack = await safeGet(() => song.mainTrack, null, "song.mainTrack");
  const tracks = [
    ...(await Promise.all(regularTracks.map((track, index) => inspectTrack(track, index, "track")))),
    ...(await Promise.all(returnTracks.map((track, index) => inspectTrack(track, index, "return")))),
    ...(mainTrack ? [await inspectTrack(mainTrack, 0, "master")] : []),
  ];
  const songDiagnostic: ObjectDiagnostic = {
    ...(await identity(song as Song<"1.0.0">)),
    availableProperties: getAvailableProperties(song),
    properties: await safeInspect(song, SONG_PROPERTIES),
  };
  const draft = { song: songDiagnostic, tracks };
  return {
    version: "0.3.0",
    generatedAt: new Date().toISOString(),
    sdkApiVersion: "1.0.0",
    summary: {
      tracksInspected: tracks.length,
      routingsFound: countRoutings(tracks),
      devicesInspected: tracks.reduce((sum, track) => sum + countNestedDevices(track.devices), 0),
      racksDetected: tracks.reduce((sum, track) => sum + countNestedRacks(track.devices), 0),
      chainsDetected: tracks.reduce((sum, track) => sum + countNestedChains(track.devices), 0),
      propertyErrors: countStatuses(draft, "error"),
    },
    song: songDiagnostic,
    tracks,
  };
}
