import { RackDevice, type Device, type DeviceParameter } from "@ableton-extensions/sdk";
import {
  safeGet,
  type DeviceInfo,
  type DeviceParameterInfo,
  type StructureSummary,
  type StructureSummaryItem,
} from "./types.js";

const MAX_PARAMETERS_PER_DEVICE = 12;
export const MAX_DEVICE_DEPTH = 0;
export const SCAN_MODE = "ultra-safe";
export const SCAN_INTERNAL_CHAIN_DEVICES = false;
export const SCAN_NESTED_RACKS = false;
const MAX_CHAINS_PER_RACK = 32;
const MAX_PADS_PER_DRUM_RACK = 64;
const MAX_TOTAL_SCANNED_DEVICES = 500;
const GLOBAL_SCAN_TIMEOUT_MS = 10_000;
const TECHNICAL_PARAMETER = /^(Device On|Chain Selector|Chain Volume|Chain Pan|Volume|Pan|Panning|Dry\/Wet|Output|Input|On|Activator)$/i;
const MACRO_PARAMETER = /(^|\s)Macro(\s|$|\s*\d+)/i;
const CHAIN_PROPERTY_CANDIDATES = ["chains", "chain"] as const;

export interface ScanState {
  totalScannedDevices: number;
  partial: boolean;
  warnings: string[];
  deadlineAt: number;
}

export function createScanState(): ScanState {
  return {
    totalScannedDevices: 0,
    partial: false,
    warnings: [],
    deadlineAt: Date.now() + GLOBAL_SCAN_TIMEOUT_MS,
  };
}

function pushWarning(state: ScanState, warning: string): void {
  state.partial = true;
  if (!state.warnings.includes(warning)) state.warnings.push(warning);
  console.warn(`[Ableton Session Mapper] ${warning}`);
}

export function scanTimedOut(state: ScanState): boolean {
  return Date.now() >= state.deadlineAt;
}

function handleId(handle: { id: bigint } | null): string {
  return handle?.id.toString() ?? "unknown";
}

async function optionalBoolean(target: object, candidates: string[]): Promise<boolean | null> {
  for (const property of candidates) {
    const value = await safeGet(
      () => Reflect.get(target, property) as unknown,
      undefined,
      `${target.constructor.name}.${property}`,
    );
    if (typeof value === "boolean") return value;
  }
  return null;
}

async function readUnknown(target: object, property: string): Promise<unknown> {
  return safeGet(
    () => Reflect.get(target, property) as unknown,
    undefined,
    `${target.constructor.name}.${property}`,
  );
}

async function readFirstArray(target: object, properties: readonly string[]): Promise<object[]> {
  for (const property of properties) {
    const value = await readUnknown(target, property);
    if (Array.isArray(value)) {
      return value.filter((item): item is object => typeof item === "object" && item !== null);
    }
  }
  return [];
}

async function readNumericProperty(target: object, candidates: readonly string[]): Promise<number | null> {
  for (const property of candidates) {
    const value = await readUnknown(target, property);
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

interface ParameterCandidate {
  parameter: DeviceParameter<"1.0.0">;
  index: number;
  name: string;
  isMacro: boolean;
}

async function scanParameter(
  candidate: ParameterCandidate,
): Promise<DeviceParameterInfo> {
  const { parameter, index, name, isMacro } = candidate;
  const handle = await safeGet(() => parameter.handle, null, "parameter.handle");
  return {
    id: handleId(handle),
    index,
    name,
    value: await safeGet(() => parameter.getValue(), null, `parameter.${name}.value`),
    min: await safeGet(() => parameter.min, null, `parameter.${name}.min`),
    max: await safeGet(() => parameter.max, null, `parameter.${name}.max`),
    isQuantized: await safeGet(
      () => parameter.isQuantized,
      null,
      `parameter.${name}.isQuantized`,
    ),
    isMacro,
  };
}

async function selectImportantParameters(
  device: Device<"1.0.0">,
): Promise<{ parameters: DeviceParameterInfo[]; enabled: boolean | null }> {
  const sdkParameters = await safeGet(() => device.parameters, [], "device.parameters");
  const candidates = await Promise.all(
    sdkParameters.map(async (parameter, index): Promise<ParameterCandidate> => {
      const name = await safeGet(
        () => parameter.name,
        `Parameter ${index + 1}`,
        "parameter.name",
      );
      return { parameter, index, name, isMacro: MACRO_PARAMETER.test(name) };
    }),
  );

  const activator = candidates.find((candidate) =>
    /^(Device On|Device Activator|On|Activator)$/i.test(candidate.name),
  );
  const enabledValue = activator
    ? await safeGet(
        () => activator.parameter.getValue(),
        null,
        `parameter.${activator.name}.value`,
      )
    : null;
  const enabled = typeof enabledValue === "number" ? enabledValue > 0 : null;

  const macros = candidates.filter((candidate) => candidate.isMacro);
  const readableCustom = candidates.filter(
    (candidate) => !candidate.isMacro && !TECHNICAL_PARAMETER.test(candidate.name),
  );
  const selected = [...macros, ...readableCustom]
    .filter((candidate, index, list) =>
      list.findIndex((item) => item.parameter === candidate.parameter) === index,
    )
    .slice(0, MAX_PARAMETERS_PER_DEVICE);

  return { parameters: await Promise.all(selected.map(scanParameter)), enabled };
}

async function summarizeStructureItem(
  target: object,
  index: number,
): Promise<StructureSummaryItem> {
  const explicitName = await readUnknown(target, "name");
  const receivingNote = await readNumericProperty(target, ["receivingNote"]);
  const note = await readNumericProperty(target, ["note", "midiNote"]);
  const rawDevices = await safeGet(
    () => Reflect.get(target, "devices") as Device<"1.0.0">[] | undefined,
    undefined,
    `${target.constructor.name}.devices`,
  );
  return {
    index,
    name: typeof explicitName === "string" && explicitName.length > 0
      ? explicitName
      : `Chain ${String(index + 1).padStart(2, "0")}`,
    note,
    receivingNote,
    deviceCount: Array.isArray(rawDevices) ? rawDevices.length : null,
  };
}

async function summarizeStructure(
  items: object[],
  limit: number,
): Promise<StructureSummary> {
  const summaryItems: StructureSummaryItem[] = [];
  for (const [index, item] of items.slice(0, limit).entries()) {
    summaryItems.push(await summarizeStructureItem(item, index));
  }
  return {
    count: items.length,
    items: summaryItems,
  };
}

async function summarizeRack(
  device: Device<"1.0.0">,
  name: string,
  state: ScanState,
): Promise<{
  chainsSummary: StructureSummary | null;
  padsSummary: StructureSummary | null;
}> {
  console.log(`[Ableton Session Mapper] Scan rack summary started: ${name}`);
  const chainTargets = await readFirstArray(device, CHAIN_PROPERTY_CANDIDATES);
  const chainsSummary = await summarizeStructure(chainTargets, MAX_CHAINS_PER_RACK);
  const padsSummary = device.constructor.name === "DrumRack"
    ? {
        count: chainTargets.length,
        items: (await summarizeStructure(chainTargets, MAX_PADS_PER_DRUM_RACK)).items.map((item) => ({
          ...item,
          note: item.receivingNote ?? item.note,
        })),
      }
    : null;
  if (chainTargets.length > MAX_CHAINS_PER_RACK) {
    pushWarning(state, `Rack summary truncated for ${name}`);
  }
  console.log(
    `[Ableton Session Mapper] Scan rack summary completed: ${name} (chains=${chainsSummary.count}, pads=${padsSummary?.count ?? 0})`,
  );
  return { chainsSummary, padsSummary };
}

async function scanDevice(
  device: Device<"1.0.0">,
  index: number,
  state: ScanState,
): Promise<DeviceInfo> {
  const handle = await safeGet(() => device.handle, null, "device.handle");
  const type = await safeGet(() => device.constructor.name, "Device", "device.type");
  const name = await safeGet(() => device.name, "Unnamed device", "device.name");

  if (scanTimedOut(state)) {
    pushWarning(state, "Global scan timeout");
    return {
      id: handleId(handle),
      index,
      name,
      type,
      enabled: null,
      parameters: [],
      chains: [],
      pads: [],
      scanStatus: "partial",
      scanWarning: "Global scan timeout",
      chainsSummary: null,
      padsSummary: null,
    };
  }

  state.totalScannedDevices += 1;
  if (state.totalScannedDevices > MAX_TOTAL_SCANNED_DEVICES) {
    pushWarning(state, "Global scanned device limit reached");
    return {
      id: handleId(handle),
      index,
      name,
      type,
      enabled: null,
      parameters: [],
      chains: [],
      pads: [],
      scanStatus: "partial",
      scanWarning: "Global scanned device limit reached",
      chainsSummary: null,
      padsSummary: null,
    };
  }

  const filtered = await selectImportantParameters(device);
  const sdkEnabled = await optionalBoolean(device, ["isActive", "active", "enabled"]);
  const isRackLike = device instanceof RackDevice || /rack/i.test(type);
  const summary = isRackLike
    ? await summarizeRack(device, name, state)
    : { chainsSummary: null, padsSummary: null };

  return {
    id: handleId(handle),
    index,
    name,
    type,
    enabled: sdkEnabled ?? filtered.enabled,
    parameters: filtered.parameters,
    chains: [],
    pads: [],
    scanStatus: isRackLike ? "summary" : "complete",
    scanWarning: null,
    chainsSummary: summary.chainsSummary,
    padsSummary: summary.padsSummary,
  };
}

export async function scanDevices(
  devices: Device<"1.0.0">[] | null,
  state: ScanState,
): Promise<DeviceInfo[]> {
  if (!devices?.length) return [];
  const results: DeviceInfo[] = [];
  for (const [index, device] of devices.entries()) {
    if (scanTimedOut(state)) {
      pushWarning(state, "Global scan timeout");
      break;
    }
    results.push(await scanDevice(device, index, state));
  }
  return results;
}

export function scanStateSummary(state: ScanState): {
  mode: "ultra-safe";
  maxDeviceDepth: number;
  scanInternalChainDevices: boolean;
  scanNestedRacks: boolean;
  partial: boolean;
  warnings: string[];
  totalScannedDevices: number;
  maxTotalScannedDevices: number;
} {
  return {
    mode: SCAN_MODE,
    maxDeviceDepth: MAX_DEVICE_DEPTH,
    scanInternalChainDevices: SCAN_INTERNAL_CHAIN_DEVICES,
    scanNestedRacks: SCAN_NESTED_RACKS,
    partial: state.partial,
    warnings: [...state.warnings],
    totalScannedDevices: state.totalScannedDevices,
    maxTotalScannedDevices: MAX_TOTAL_SCANNED_DEVICES,
  };
}
