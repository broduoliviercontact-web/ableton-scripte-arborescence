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
  devices: DeviceInfo[];
  sends: SendInfo[];
}

export interface SessionMap {
  version: "0.4.3";
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
