import { access, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import { resolveExportLocations } from "../exportJson.js";
import { routingOverridesPath } from "../routingOverrides.js";
import type { DeviceInfo, SessionMap, TrackInfo } from "../types.js";
import {
  createInternalViewerHtml,
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

function formatManualRouting(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value.trim() : "—";
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
      key: "routing-overrides",
      label: "Open routing-overrides.json",
      path: routingOverridesPath(exportDirectory),
      openLabel: "routing-overrides.json",
      group: "Routing / Diagnostics",
    },
    {
      key: "capability-matrix-html",
      label: "Open SDK Capability Matrix",
      path: join(exportDirectory, "sdk-capability-matrix.html"),
      openLabel: "SDK Capability Matrix",
      group: "Routing / Diagnostics",
    },
    {
      key: "capability-matrix-json",
      label: "Open SDK Capability Matrix JSON",
      path: join(exportDirectory, "sdk-capability-matrix.json"),
      openLabel: "SDK Capability Matrix JSON",
      group: "Routing / Diagnostics",
    },
    {
      key: "sdk-diagnostic",
      label: "Open sdk-diagnostic.json",
      path: join(exportDirectory, "sdk-diagnostic.json"),
      openLabel: "sdk-diagnostic.json",
      group: "Routing / Diagnostics",
    },
    {
      key: "rack-diagnostic",
      label: "Open rack-diagnostic.json",
      path: join(exportDirectory, "rack-diagnostic.json"),
      openLabel: "rack-diagnostic.json",
      group: "Routing / Diagnostics",
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
  connections: InternalViewerModel["connections"];
  hasMissingRoutingData: boolean;
} {
  console.log("[Ableton Session Mapper] Internal Viewer outputs model started");

  if (!sessionMap) {
    console.log("[Ableton Session Mapper] Internal Viewer outputs model completed");
    return { outputs: [], connections: [], hasMissingRoutingData: false };
  }

  const outputs = orderedTracks(sessionMap).map(({ track, sectionType }) => ({
    index: track.index,
    name: track.name,
    kind: formatTrackKind(track.kind),
    midiFrom: formatManualRouting(track.routing?.midiFrom),
    midiTo: formatManualRouting(track.routing?.midiTo),
    audioFrom: track.routing?.source === "manual" ? formatManualRouting(track.routing?.audioFrom) : formatRoutingLabel(track.input),
    audioTo: track.routing?.source === "manual" ? formatManualRouting(track.routing?.audioTo) : formatRoutingLabel(track.output),
    monitor: formatManualRouting(track.routing?.monitor),
    source: track.routing?.source === "manual" ? "MANUAL" : track.routing?.source === "sdk" ? "SDK" : "NONE",
    sends: formatSendSummary(track),
    sectionType,
  }));
  const connections = (sessionMap.manualRouting?.connections ?? []).map((connection) => ({
    from: connection.from,
    to: connection.to,
    type: connection.type,
    label: connection.label,
  }));

  const hasMissingRoutingData =
    outputs.length > 0 &&
    outputs.every(
      (row) => row.audioFrom === ROUTING_NOT_EXPOSED && row.audioTo === ROUTING_NOT_EXPOSED && row.source !== "MANUAL",
    );

  if (hasMissingRoutingData) {
    console.log("[Ableton Session Mapper] Internal Viewer missing routing data detected");
  }

  console.log("[Ableton Session Mapper] Internal Viewer outputs built");
  console.log("[Ableton Session Mapper] Internal Viewer outputs model completed");
  return { outputs, connections, hasMissingRoutingData };
}

function buildDevicesModel(sessionMap: SessionMap | null): InternalViewerDeviceTrack[] {
  if (!sessionMap) {
    console.log("[Ableton Session Mapper] Internal Viewer devices built");
    return [];
  }

  const model = orderedTracks(sessionMap).map(({ track, sectionType }) => {
    const rackDevices = track.devices.filter((device) => isRackLike(device));
    const deviceSummary = track.devices
      .slice(0, MAX_DEVICE_SUMMARY_ITEMS)
      .map((device) => describeDevice(device));
    if (track.devices.length > MAX_DEVICE_SUMMARY_ITEMS) {
      deviceSummary.push(`+${track.devices.length - MAX_DEVICE_SUMMARY_ITEMS} more devices`);
    }

    const rackSummary = rackDevices
      .slice(0, MAX_RACK_SUMMARY_ITEMS)
      .map((device) => describeRack(device));
    if (rackDevices.length > MAX_RACK_SUMMARY_ITEMS) {
      rackSummary.push(`+${rackDevices.length - MAX_RACK_SUMMARY_ITEMS} more racks`);
    }

    return {
      index: track.index,
      name: track.name,
      kind: formatTrackKind(track.kind),
      deviceCount: track.devices.length,
      rackCount: rackDevices.length,
      deviceSummary,
      rackSummary,
      sectionType,
    };
  });

  console.log("[Ableton Session Mapper] Internal Viewer devices built");
  return model;
}

function buildSessionPreviewColumns(sessionMap: SessionMap | null): InternalViewerModel["sessionPreviewColumns"] {
  if (!ENABLE_INTERNAL_VISUAL_PREVIEW || !sessionMap) {
    console.log("[Ableton Session Mapper] Internal Viewer session preview built");
    console.log("[Ableton Session Mapper] Internal Viewer kanban preview built");
    console.log("[Ableton Session Mapper] Internal Viewer metro preview built");
    return [];
  }

  const columns = orderedTracks(sessionMap).map(({ track, sectionType }) => {
    const rackCount = track.devices.filter((device) => isRackLike(device)).length;
    const deviceCards = track.devices
      .slice(0, MAX_PREVIEW_DEVICE_ITEMS)
      .map((device) => ({
        name: device.name,
        summary: describePreviewDevice(device),
        isRack: isRackLike(device),
      }));

    if (track.devices.length > MAX_PREVIEW_DEVICE_ITEMS) {
      deviceCards.push({
        name: "More devices",
        summary: `+${track.devices.length - MAX_PREVIEW_DEVICE_ITEMS} more devices`,
        isRack: false,
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
): InternalViewerModel {
  const sessionMap = latest.sessionMap;
  const ordered = sessionMap ? orderedTracks(sessionMap).map((entry) => entry.track) : [];
  const devices = ordered.reduce((sum, track) => sum + track.devices.length, 0);
  const racks = ordered.reduce(
    (sum, track) => sum + track.devices.filter((device) => isRackLike(device)).length,
    0,
  );
  const sends = ordered.reduce((sum, track) => sum + track.sends.length, 0);

  const { outputs, connections, hasMissingRoutingData } = buildOutputsModel(sessionMap);
  const deviceTracks = buildDevicesModel(sessionMap);
  const sessionPreviewColumns = buildSessionPreviewColumns(sessionMap);
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
    connections,
    manualRoutingStatus: sessionMap?.manualRouting?.status ?? "missing",
    manualRoutingStale: sessionMap?.manualRouting?.stale ?? false,
    manualRoutingSetMatch: sessionMap?.manualRouting?.setMatch ?? false,
    manualRoutingWarnings: sessionMap?.manualRouting?.warnings ?? [],
    routingOverridesPath: sessionMap?.manualRouting?.sourcePath ?? routingOverridesPath(exportDirectory),
    routingOverridesExists: links.some((link) => link.key === "routing-overrides" && link.exists),
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
    const links = await buildLinkTargets(
      locations.exportDirectory,
      locations.sessionMapJsonPath,
      locations.sessionMapHtmlPath,
      locations.sessionGridHtmlPath,
      locations.sessionMapDiagramsPath,
    );
    const latest = overrideState ?? await readLatestSessionMap(locations.sessionMapJsonPath);
    overrideState = null;
    const model = buildModel(latest, links, locations.exportDirectory);
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
