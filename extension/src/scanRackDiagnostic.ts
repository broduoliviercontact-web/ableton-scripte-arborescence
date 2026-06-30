import type { Device, ExtensionContext } from "@ableton-extensions/sdk";
import { safeGet } from "./types.js";

const RACK_PROPERTY_CANDIDATES = [
  "name",
  "className",
  "chains",
  "chain",
  "children",
  "devices",
  "drumPads",
  "visibleDrumPads",
  "pads",
  "selectedChain",
  "chainSelector",
  "mixer",
  "canonicalParent",
  "parent",
  "parameters",
  "canHaveChains",
  "can_have_chains",
] as const;

const CHAIN_PROPERTY_CANDIDATES = [
  "name",
  "devices",
  "mixer",
  "receivingNote",
  "note",
  "midiNote",
] as const;

export interface RackPropertyDiagnostic {
  property: string;
  status: "available" | "missing" | "error";
  value?: unknown;
  error?: string;
}

export interface RackStructureItemDiagnostic {
  id: string | null;
  name: string | null;
  objectType: string;
  index: number;
  note: string | null;
  deviceCount: number;
  properties: RackPropertyDiagnostic[];
}

export interface RackDiagnosticEntry {
  id: string | null;
  name: string | null;
  objectType: string;
  trackId: string | null;
  trackName: string | null;
  trackRole: "track" | "return" | "master";
  trackIndex: number;
  deviceIndex: number;
  availableProperties: string[];
  properties: RackPropertyDiagnostic[];
  chains: RackStructureItemDiagnostic[];
  pads: RackStructureItemDiagnostic[];
}

export interface RackDiagnostic {
  version: "0.4.0";
  generatedAt: string;
  sdkApiVersion: "1.0.0";
  summary: {
    racksInspected: number;
    chainsFound: number;
    padsFound: number;
    propertyErrors: number;
  };
  racks: RackDiagnosticEntry[];
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
  let prototype: object | null = target;
  for (let depth = 0; depth < 8 && prototype; depth += 1) {
    try {
      for (const key of Object.getOwnPropertyNames(prototype)) {
        if (key !== "constructor") properties.add(key);
      }
      prototype = Object.getPrototypeOf(prototype) as object | null;
      if (!prototype || prototype === Object.prototype) break;
    } catch {
      break;
    }
  }
  return [...properties].sort();
}

function summarizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return {
      length: value.length,
      items: value.slice(0, 24).map((item) => summarizeValue(item)),
      truncated: value.length > 24,
    };
  }
  const summary: Record<string, unknown> = { objectType: objectType(value) };
  for (const key of ["handle", "name", "value", "className"] as const) {
    try {
      const raw = Reflect.get(value, key) as unknown;
      if (raw === undefined) continue;
      if (key === "handle" && typeof raw === "object" && raw !== null) {
        summary.handleId = (Reflect.get(raw, "id") as bigint | undefined)?.toString() ?? null;
      } else {
        summary[key] = summarizeValue(raw);
      }
    } catch {
      // Ignore summary failures to keep diagnostic resilient.
    }
  }
  return summary;
}

async function inspectProperty(target: object, property: string): Promise<RackPropertyDiagnostic> {
  const exists = await safeGet(() => property in target, false, `${objectType(target)}.${property}.exists`);
  if (!exists) return { property, status: "missing" };
  try {
    const value = await Promise.resolve(Reflect.get(target, property) as unknown);
    return { property, status: "available", value: summarizeValue(value) };
  } catch (error) {
    return {
      property,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function handleId(target: object): Promise<string | null> {
  const handle = await safeGet(
    () => Reflect.get(target, "handle") as { id?: bigint } | undefined,
    undefined,
    `${objectType(target)}.handle`,
  );
  return handle?.id?.toString() ?? null;
}

function midiNoteToName(note: number | null): string | null {
  if (typeof note !== "number" || !Number.isFinite(note)) return null;
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const pitchClass = notes[((note % 12) + 12) % 12];
  const octave = Math.floor(note / 12) - 2;
  return `${pitchClass}${octave}`;
}

async function readFirstArray(target: object, properties: readonly string[]): Promise<object[]> {
  for (const property of properties) {
    const value = await safeGet(
      () => Reflect.get(target, property) as unknown,
      undefined,
      `${objectType(target)}.${property}`,
    );
    if (Array.isArray(value)) {
      return value.filter((item): item is object => typeof item === "object" && item !== null);
    }
  }
  return [];
}

async function inspectStructureItem(target: object, index: number): Promise<RackStructureItemDiagnostic> {
  const explicitName = await safeGet(
    () => Reflect.get(target, "name") as string | undefined,
    undefined,
    `${objectType(target)}.name`,
  );
  const noteValue = await safeGet(
    async () => {
      for (const property of ["receivingNote", "note", "midiNote"] as const) {
        const value = Reflect.get(target, property) as unknown;
        if (typeof value === "number") return value;
      }
      return null;
    },
    null,
    `${objectType(target)}.note`,
  );
  const devices = await readFirstArray(target, ["devices"]);
  return {
    id: await handleId(target),
    name: explicitName ?? null,
    objectType: objectType(target),
    index,
    note: midiNoteToName(noteValue),
    deviceCount: devices.length,
    properties: await Promise.all(
      CHAIN_PROPERTY_CANDIDATES.map((property) => inspectProperty(target, property)),
    ),
  };
}

async function inspectRack(
  device: Device<"1.0.0">,
  trackName: string | null,
  trackId: string | null,
  trackRole: RackDiagnosticEntry["trackRole"],
  trackIndex: number,
  deviceIndex: number,
): Promise<RackDiagnosticEntry> {
  const chains = await readFirstArray(device, ["chains", "chain"]);
  const pads = await readFirstArray(device, ["drumPads", "visibleDrumPads", "pads", "children"]);
  return {
    id: await handleId(device),
    name: await safeGet(() => device.name, null, "rack.name"),
    objectType: objectType(device),
    trackId,
    trackName,
    trackRole,
    trackIndex,
    deviceIndex,
    availableProperties: getAvailableProperties(device),
    properties: await Promise.all(
      RACK_PROPERTY_CANDIDATES.map((property) => inspectProperty(device, property)),
    ),
    chains: await Promise.all(chains.map((chain, index) => inspectStructureItem(chain, index))),
    pads: await Promise.all(pads.map((pad, index) => inspectStructureItem(pad, index))),
  };
}

function isRackLike(device: Device<"1.0.0">): boolean {
  const type = objectType(device);
  return /rack/i.test(type);
}

function countErrors(racks: RackDiagnosticEntry[]): number {
  return racks.reduce(
    (total, rack) =>
      total +
      rack.properties.filter((property) => property.status === "error").length +
      rack.chains.reduce(
        (chainTotal, chain) => chainTotal + chain.properties.filter((property) => property.status === "error").length,
        0,
      ) +
      rack.pads.reduce(
        (padTotal, pad) => padTotal + pad.properties.filter((property) => property.status === "error").length,
        0,
      ),
    0,
  );
}

export async function scanRackDiagnostic(
  context: ExtensionContext<"1.0.0">,
): Promise<RackDiagnostic> {
  const song = await safeGet(() => context.application.song, null, "application.song");
  if (!song) throw new Error("The current Live Set is unavailable.");
  const regularTracks = await safeGet(() => song.tracks, [], "song.tracks");
  const returnTracks = await safeGet(() => song.returnTracks, [], "song.returnTracks");
  const mainTrack = await safeGet(() => song.mainTrack, null, "song.mainTrack");

  const rackEntries: RackDiagnosticEntry[] = [];
  const inspectTrackDevices = async (
    role: RackDiagnosticEntry["trackRole"],
    trackIndex: number,
    track: { devices: Device<"1.0.0">[]; name: string },
  ) => {
    const trackName = await safeGet(() => track.name, null, "track.name");
    const trackId = await handleId(track as unknown as object);
    const devices = await safeGet(() => track.devices, [], "track.devices");
    for (const [deviceIndex, device] of devices.entries()) {
      if (!isRackLike(device)) continue;
      rackEntries.push(
        await inspectRack(device, trackName, trackId, role, trackIndex, deviceIndex),
      );
    }
  };

  await Promise.all(regularTracks.map((track, index) => inspectTrackDevices("track", index, track)));
  await Promise.all(returnTracks.map((track, index) => inspectTrackDevices("return", index, track)));
  if (mainTrack) await inspectTrackDevices("master", 0, mainTrack);

  return {
    version: "0.4.0",
    generatedAt: new Date().toISOString(),
    sdkApiVersion: "1.0.0",
    summary: {
      racksInspected: rackEntries.length,
      chainsFound: rackEntries.reduce((sum, rack) => sum + rack.chains.length, 0),
      padsFound: rackEntries.reduce((sum, rack) => sum + rack.pads.length, 0),
      propertyErrors: countErrors(rackEntries),
    },
    racks: rackEntries,
  };
}
