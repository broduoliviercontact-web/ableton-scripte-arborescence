export type TrackKind =
  | "audio"
  | "midi"
  | "group"
  | "return"
  | "master"
  | "unknown";

export interface RoutingInfo {
  type: string | null;
  channel: string | null;
}

export type RoutingSource = "sdk" | "manual" | "none";

export interface TrackRoutingInfo {
  source: RoutingSource;
  audioFrom: string | null;
  audioTo: string | null;
  midiFrom: string | null;
  midiTo: string | null;
  monitor: string | null;
  group: string | null;
  notes: string;
}

export interface ManualRoutingOverrideTrack {
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

export interface ManualRoutingSidechain {
  targetTrack: string;
  targetDevice: string;
  sourceTrack: string;
  enabled: boolean | null;
  notes: string;
}

export interface ManualRoutingConnection {
  from: string;
  to: string;
  type: "audio" | "midi" | "sidechain" | "unknown";
  label: string;
}

export type ManualRoutingStatus = "missing" | "loaded" | "invalid";

export interface ManualRoutingState {
  status: ManualRoutingStatus;
  stale: boolean;
  setMatch: boolean;
  sourcePath: string;
  sourceModifiedAt: string | null;
  sessionMapModifiedAt: string | null;
  currentTrackCount: number;
  overrideTrackCount: number;
  missingFromCurrent: string[];
  missingFromOverrides: string[];
  warnings: string[];
  tracks: Record<string, ManualRoutingOverrideTrack>;
  sidechains: ManualRoutingSidechain[];
  connections: ManualRoutingConnection[];
}

export interface StructureSummaryItem {
  index: number;
  name: string;
  note: number | null;
  receivingNote: number | null;
  deviceCount: number | null;
}

export interface StructureSummary {
  count: number;
  items: StructureSummaryItem[];
}

export interface DeviceInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  enabled: boolean | null;
  parameters: DeviceParameterInfo[];
  chains: ChainInfo[];
  pads: PadInfo[];
  scanStatus?: "complete" | "partial" | "summary";
  scanWarning?: string | null;
  chainsSummary?: StructureSummary | null;
  padsSummary?: StructureSummary | null;
}

export interface DeviceParameterInfo {
  id: string;
  index: number;
  name: string;
  value: number | null;
  min: number | null;
  max: number | null;
  isQuantized: boolean | null;
  isMacro: boolean;
}

export interface ChainInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  note: string | null;
  devices: DeviceInfo[];
  deviceCount: number | null;
  volume: number | null;
  pan: number | null;
  isMuted: boolean | null;
  isSoloed: boolean | null;
  isActive: boolean | null;
  scanStatus?: "complete" | "partial" | "summary";
  scanWarning?: string | null;
}

export interface PadInfo {
  id: string;
  index: number;
  name: string;
  note: string | null;
  devices: DeviceInfo[];
  deviceCount: number | null;
  volume: number | null;
  pan: number | null;
  isMuted: boolean | null;
  isSoloed: boolean | null;
  isActive: boolean | null;
  scanStatus?: "complete" | "partial" | "summary";
  scanWarning?: string | null;
}

export interface SendInfo {
  id: string;
  index: number;
  name: string;
  value: number | null;
}

export interface TrackInfo {
  id: string;
  index: number;
  name: string;
  kind: TrackKind;
  color: string | null;
  isMuted: boolean | null;
  isSoloed: boolean | null;
  isArmed: boolean | null;
  groupTrackId: string | null;
  input: RoutingInfo;
  output: RoutingInfo;
  routing?: TrackRoutingInfo;
  devices: DeviceInfo[];
  sends: SendInfo[];
}

export interface SessionMap {
  version: "1.0.0";
  exportedAt: string;
  set: {
    name: string | null;
    tempo: number | null;
  };
  scan: {
    mode: "ultra-safe";
    maxDeviceDepth: number;
    scanInternalChainDevices: boolean;
    scanNestedRacks: boolean;
    partial: boolean;
    warnings: string[];
    totalScannedDevices: number;
    maxTotalScannedDevices: number;
  };
  tracks: TrackInfo[];
  returnTracks: TrackInfo[];
  masterTrack: TrackInfo | null;
  manualRouting?: ManualRoutingState;
}

/**
 * Executes every SDK read behind one error boundary. A deleted Live object or a
 * property missing from a future/older host therefore degrades to a fallback.
 */
export async function safeGet<T>(
  getter: () => T | Promise<T>,
  fallback: T,
  label = "Ableton property",
): Promise<T> {
  try {
    return await getter();
  } catch (error) {
    console.warn(`[Ableton Session Mapper] Unable to read ${label}.`, error);
    return fallback;
  }
}
