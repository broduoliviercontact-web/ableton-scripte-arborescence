import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";
export type MermaidProfile = "flow" | "git" | "kanban";
const USE_EMOJI_LABELS = false;

interface StructureSummaryItem {
  index: number;
  name: string;
  note: number | null;
  receivingNote: number | null;
  deviceCount: number | null;
}

interface StructureSummary {
  count: number;
  items: StructureSummaryItem[];
}

interface DeviceInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  chainsSummary?: StructureSummary | null;
  padsSummary?: StructureSummary | null;
}

interface SendInfo {
  id: string;
  index: number;
  name: string;
  value: number | null;
}

interface TrackInfo {
  id: string;
  index: number;
  name: string;
  kind: TrackKind;
  routing?: {
    source: "sdk" | "manual" | "none";
    audioFrom: string | null;
    audioTo: string | null;
    midiFrom: string | null;
    midiTo: string | null;
    monitor: string | null;
    group: string | null;
    notes: string;
  };
  devices: DeviceInfo[];
  sends: SendInfo[];
}

interface ManualRoutingConnection {
  from: string;
  to: string;
  type: "audio" | "midi" | "sidechain" | "unknown";
  label: string;
}

interface SessionMap {
  version: string;
  exportedAt: string;
  set: {
    name: string | null;
    tempo: number | null;
  };
  tracks: TrackInfo[];
  returnTracks: TrackInfo[];
  masterTrack: TrackInfo | null;
  manualRouting?: {
    status: "missing" | "loaded" | "invalid";
    warnings: string[];
    connections: ManualRoutingConnection[];
  };
}

interface MermaidPaths {
  latestPath: string;
  archivePath: string;
}

const mermaidDirectory = typeof __dirname !== "undefined"
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(mermaidDirectory, "..");

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const profile = (argumentValue("--profile") as MermaidProfile | undefined) ?? "flow";
const profileFileSuffix = argumentValue("--file-suffix") ?? "";
const jsonPath = resolve(
  argumentValue("--json") ?? resolve(rootDirectory, "exports/session-map.json"),
);
const latestOutputPath = resolve(
  argumentValue("--output") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.mmd"
        : profile === "kanban"
          ? "exports/session-map-kanban.mmd"
          : "exports/session-map.mmd",
    ),
);
const logPrefix = profileFileSuffix
  ? `[mermaid:${profileFileSuffix}]`
  : profile === "flow"
    ? "[mermaid]"
    : `[mermaid:${profile}]`;

function logPath(path: string): string {
  const rel = relative(rootDirectory, path);
  return rel && !rel.startsWith("..") ? rel : path;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatArchiveTimestamp(dateLike: string, includeSeconds: boolean): string {
  const date = new Date(dateLike);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const datePart = [
    safeDate.getFullYear(),
    pad(safeDate.getMonth() + 1),
    pad(safeDate.getDate()),
  ].join("-");
  const timeParts = [pad(safeDate.getHours()), pad(safeDate.getMinutes())];
  if (includeSeconds) timeParts.push(pad(safeDate.getSeconds()));
  return `${datePart}_${timeParts.join("-")}`;
}

function sanitizeFileToken(value: string | null | undefined): string {
  const normalized = (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/[^A-Za-z0-9._ -]/g, " ")
    .trim()
    .replace(/[ .]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  return normalized;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function buildArchiveBaseName(sessionMap: SessionMap): string {
  const setName = sanitizeFileToken(sessionMap.set.name);
  return setName ? `${setName}_Session-Map` : "Ableton-Session-Map";
}

async function resolveMermaidPaths(sessionMap: SessionMap): Promise<MermaidPaths> {
  const outputDirectory = dirname(latestOutputPath);
  await mkdir(outputDirectory, { recursive: true });

  const baseName = buildArchiveBaseName(sessionMap);
  const profileSuffix = profileFileSuffix ? `_${profileFileSuffix}` : "";
  const minuteStamp = formatArchiveTimestamp(sessionMap.exportedAt, false);
  const secondStamp = formatArchiveTimestamp(sessionMap.exportedAt, true);
  const candidates = [
    `${baseName}_${minuteStamp}${profileSuffix}`,
    `${baseName}_${secondStamp}${profileSuffix}`,
  ];

  for (const candidate of candidates) {
    const archivePath = join(outputDirectory, `${candidate}.mmd`);
    if (!(await pathExists(archivePath))) {
      return { latestPath: latestOutputPath, archivePath };
    }
  }

  let suffix = 2;
  while (suffix < 10_000) {
    const archivePath = join(
      outputDirectory,
      `${baseName}_${secondStamp}${profileSuffix}-${suffix}.mmd`,
    );
    if (!(await pathExists(archivePath))) {
      return { latestPath: latestOutputPath, archivePath };
    }
    suffix += 1;
  }

  throw new Error("Unable to reserve a unique Mermaid archive filename.");
}

function clampLabel(value: string, maxLength = 96): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function truncateLabel(value: string, maxLength: number): string {
  return clampLabel(value.trim(), maxLength);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeQuotedText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function formatLabel(...parts: Array<string | null | undefined>): string {
  return clampLabel(
    parts
      .filter((part): part is string => Boolean(part && part.trim().length > 0))
      .join("<br/>")
      .replace(/\r?\n/g, "<br/>"),
  );
}

function formatInlineLabel(...parts: Array<string | null | undefined>): string {
  return clampLabel(
    parts
      .filter((part): part is string => Boolean(part && part.trim().length > 0))
      .join(" | ")
      .replace(/\r?\n/g, " "),
    72,
  );
}

function shortTrackTypeLabel(kind: TrackKind): string {
  switch (kind) {
    case "audio":
      return "Audio";
    case "midi":
      return "MIDI";
    case "group":
      return "Group";
    case "return":
      return "Return";
    case "master":
      return "Master";
    default:
      return "Track";
  }
}

function trackPrefix(kind: TrackKind): string {
  if (USE_EMOJI_LABELS) {
    switch (kind) {
      case "midi":
        return "🎹";
      case "audio":
        return "🎧";
      case "return":
        return "↩";
      case "master":
        return "★";
      case "group":
        return "▤";
      default:
        return "•";
    }
  }

  switch (kind) {
    case "midi":
      return "MIDI";
    case "audio":
      return "AUD";
    case "return":
      return "RET";
    case "master":
      return "MAIN";
    case "group":
      return "GRP";
    default:
      return "TRK";
  }
}

function devicePrefix(device: DeviceInfo): string {
  const rackLike = isRackDevice(device);
  if (USE_EMOJI_LABELS) {
    return rackLike ? "▣" : "•";
  }
  return rackLike ? "RACK" : "DEV";
}

function shortTrackTitle(track: TrackInfo, index: number): string {
  const rawName = track.name?.trim() || `Track ${index + 1}`;
  const firstSegment = rawName.split("|")[0]?.trim() || rawName;
  return truncateLabel(firstSegment, 18);
}

function mermaidText(value: string): string {
  return value
    .split("<br/>")
    .map((part) => escapeHtml(part).replaceAll("[", "(").replaceAll("]", ")"))
    .join("<br/>");
}

function trackTypeLabel(kind: TrackKind): string {
  switch (kind) {
    case "audio":
      return "Audio Track";
    case "midi":
      return "MIDI Track";
    case "group":
      return "Group Track";
    case "return":
      return "Return Track";
    case "master":
      return "Master Track";
    default:
      return "Track";
  }
}

function isRackDevice(device: DeviceInfo): boolean {
  return (
    device.type.toLowerCase().includes("rack") ||
    Boolean(device.chainsSummary?.count) ||
    Boolean(device.padsSummary?.count)
  );
}

function pushNode(lines: string[], id: string, label: string): void {
  lines.push(`  ${id}["${mermaidText(label)}"]`);
}

function pushEdge(lines: string[], from: string, to: string): void {
  lines.push(`  ${from} --> ${to}`);
}

function sendSummary(track: TrackInfo): string | null {
  if (!track.sends.length) return null;
  const names = track.sends.slice(0, 2).map((send) => send.name.trim()).filter(Boolean);
  if (names.length === 0) return `sends: ${track.sends.length}`;
  const suffix = track.sends.length > names.length ? " +" : "";
  return `sends: ${names.join(", ")}${suffix}`;
}

function structureItemLabel(
  prefix: string,
  item: StructureSummaryItem,
  fallbackIndex: number,
): string {
  const name = item.name?.trim() || `${prefix} ${String(fallbackIndex + 1).padStart(2, "0")}`;
  const note = item.receivingNote ?? item.note;
  const metaParts = [
    note !== null ? `note: ${note}` : null,
    item.deviceCount !== null ? `devices: ${item.deviceCount}` : null,
  ].filter(Boolean);
  return formatLabel(name, metaParts.join(" · "));
}

function flowDiagram(sessionMap: SessionMap): string {
  const lines: string[] = ["flowchart TD"];
  const classMap = new Map<string, string[]>();
  const trackNodeByName = new Map<string, string>();

  const addClass = (nodeId: string, className: string) => {
    const current = classMap.get(className) ?? [];
    current.push(nodeId);
    classMap.set(className, current);
  };

  pushNode(
    lines,
    "set",
    formatLabel(
      sessionMap.set.name ? `${sessionMap.set.name}` : "Ableton Live Set",
      sessionMap.set.tempo !== null ? `${sessionMap.set.tempo} BPM` : null,
      `JSON ${sessionMap.version}`,
    ),
  );
  addClass("set", "set");

  pushNode(lines, "section_tracks", formatLabel("Tracks", `${sessionMap.tracks.length} normal tracks`));
  pushNode(
    lines,
    "section_returns",
    formatLabel("Return Tracks", `${sessionMap.returnTracks.length} return tracks`),
  );
  pushNode(
    lines,
    "section_master",
    formatLabel("Master Track", sessionMap.masterTrack ? "1 master track" : "no master track"),
  );
  pushEdge(lines, "set", "section_tracks");
  pushEdge(lines, "set", "section_returns");
  pushEdge(lines, "set", "section_master");
  addClass("section_tracks", "track");
  addClass("section_returns", "return");
  addClass("section_master", "master");

  const renderTrack = (
    track: TrackInfo,
    trackId: string,
    parentId: string,
    className: "track" | "return" | "master",
  ) => {
    pushNode(
      lines,
      trackId,
      formatLabel(
        track.name || `Track ${track.index + 1}`,
        trackTypeLabel(track.kind),
        `devices: ${track.devices.length}`,
        sendSummary(track),
      ),
    );
    pushEdge(lines, parentId, trackId);
    addClass(trackId, className);
    trackNodeByName.set(track.name, trackId);

    track.devices.forEach((device, deviceIndex) => {
      const deviceId = `${trackId}_device_${deviceIndex}`;
      const rackLike = isRackDevice(device);
      const chainCount = device.chainsSummary?.count ?? 0;
      const padCount = device.padsSummary?.count ?? 0;
      const summaryBits = [
        rackLike && chainCount > 0 ? `chains: ${chainCount}` : null,
        rackLike && padCount > 0 ? `pads: ${padCount}` : null,
      ].filter(Boolean);

      pushNode(
        lines,
        deviceId,
        formatLabel(
          device.name || `Device ${device.index + 1}`,
          device.type || "Device",
          summaryBits.join(" · "),
        ),
      );
      pushEdge(lines, trackId, deviceId);
      addClass(deviceId, rackLike ? "rack" : "device");

      const chainItems = device.chainsSummary?.items ?? [];
      chainItems.forEach((item, chainIndex) => {
        const chainId = `${deviceId}_chain_${chainIndex}`;
        pushNode(lines, chainId, structureItemLabel("Chain", item, chainIndex));
        pushEdge(lines, deviceId, chainId);
        addClass(chainId, "chain");
      });
      if ((device.chainsSummary?.count ?? 0) > chainItems.length) {
        const moreChainsId = `${deviceId}_chains_more`;
        pushNode(
          lines,
          moreChainsId,
          formatLabel("Additional chains", `+${device.chainsSummary!.count - chainItems.length} more`),
        );
        pushEdge(lines, deviceId, moreChainsId);
        addClass(moreChainsId, "chain");
      }

      const padItems = device.padsSummary?.items ?? [];
      padItems.forEach((item, padIndex) => {
        const padId = `${deviceId}_pad_${padIndex}`;
        pushNode(lines, padId, structureItemLabel("Pad", item, padIndex));
        pushEdge(lines, deviceId, padId);
        addClass(padId, "chain");
      });
      if ((device.padsSummary?.count ?? 0) > padItems.length) {
        const morePadsId = `${deviceId}_pads_more`;
        pushNode(
          lines,
          morePadsId,
          formatLabel("Additional pads", `+${device.padsSummary!.count - padItems.length} more`),
        );
        pushEdge(lines, deviceId, morePadsId);
        addClass(morePadsId, "chain");
      }
    });
  };

  sessionMap.tracks.forEach((track, index) => {
    renderTrack(track, `track_${index}`, "section_tracks", "track");
  });

  sessionMap.returnTracks.forEach((track, index) => {
    renderTrack(track, `return_${index}`, "section_returns", "return");
  });

  if (sessionMap.masterTrack) {
    renderTrack(sessionMap.masterTrack, "master_0", "section_master", "master");
  }

  (sessionMap.manualRouting?.connections ?? []).forEach((connection) => {
    const fromId = trackNodeByName.get(connection.from);
    const toId = trackNodeByName.get(connection.to);
    if (!fromId || !toId) return;
    lines.push(`  ${fromId} -. "${escapeQuotedText(connection.label || connection.type || "manual")}" .-> ${toId}`);
  });

  lines.push("");
  lines.push("classDef set fill:#111,stroke:#f5a623,color:#fff");
  lines.push("classDef track fill:#1b1b1b,stroke:#666,color:#fff");
  lines.push("classDef return fill:#1b1b1b,stroke:#4aa3ff,color:#fff");
  lines.push("classDef master fill:#1b1b1b,stroke:#ff4a4a,color:#fff");
  lines.push("classDef device fill:#242424,stroke:#999,color:#fff");
  lines.push("classDef rack fill:#2b2114,stroke:#f5a623,color:#fff");
  lines.push("classDef chain fill:#141f2b,stroke:#4aa3ff,color:#fff");
  lines.push("");

  for (const [className, nodeIds] of classMap.entries()) {
    if (nodeIds.length > 0) {
      lines.push(`class ${nodeIds.join(",")} ${className};`);
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function gitCommitLabelForTrack(track: TrackInfo): string {
  const primaryName = (track.name || `Track ${track.index + 1}`).split("|")[0]?.trim()
    || track.name
    || `Track ${track.index + 1}`;
  return formatGitLabel(primaryName, "track", 22);
}

function compactTrackName(track: TrackInfo): string {
  const primaryName = (track.name || `Track ${track.index + 1}`).split("|")[0]?.trim()
    || track.name
    || `Track ${track.index + 1}`;
  return formatGitLabel(primaryName, "track", 22);
}

function simplifyDeviceName(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\bBasic Stereo Chorus Jazz Amp\b/gi, "Basic Chorus Amp")
    .replace(/\bCabinet Mic Mixer\b/gi, "Cabinet Mixer")
    .replace(/\bProducer Pal\b/gi, "Producer Pal")
    .replace(/\bProducer_Pal\b/gi, "Producer Pal")
    .replace(/\bVocal Harmony\b/gi, "Vocal Harm")
    .replace(/\bTransform Se\b/gi, "Transform")
    .replace(/\s+/g, " ")
    .trim();
}

function formatGitLabel(
  label: string,
  type: "track" | "device" | "summary",
  maxLength: number,
): string {
  const cleaned = (type === "device" ? simplifyDeviceName(label) : label)
    .replace(/\s+/g, " ")
    .trim();
  return truncateLabel(cleaned, maxLength);
}

function gitCommitLabelForDevice(device: DeviceInfo): string {
  return formatGitLabel(device.name || `Device ${device.index + 1}`, "device", 18);
}

function reserveUniqueBranchLabel(
  usedLabels: Map<string, number>,
  preferredLabel: string,
  fallbackPrefix: "T" | "R",
  visibleIndex: number,
): string {
  const normalizedPreferred = preferredLabel.replaceAll("[", "(").replaceAll("]", ")").trim();
  const currentCount = usedLabels.get(normalizedPreferred) ?? 0;
  usedLabels.set(normalizedPreferred, currentCount + 1);

  if (currentCount === 0) {
    return normalizedPreferred;
  }

  return `${fallbackPrefix}${visibleIndex + 1} — ${normalizedPreferred}`;
}

function gitTrackSummaryCommits(track: TrackInfo): string[] {
  const rackCount = track.devices.filter((device) => isRackDevice(device)).length;
  return [
    `dev:${track.devices.length}`,
    track.sends.length > 0 ? `sends:${track.sends.length}` : null,
    rackCount > 0 ? `racks:${rackCount}` : null,
  ].filter((label): label is string => Boolean(label));
}

function gitDeviceSummaryCommits(device: DeviceInfo): string[] {
  const chainCount = device.chainsSummary?.count ?? 0;
  const padCount = device.padsSummary?.count ?? 0;
  return [
    chainCount > 0 ? `chains:${chainCount}` : null,
    padCount > 0 ? `pads:${padCount}` : null,
  ].filter((label): label is string => Boolean(label));
}

function pushGitCommit(lines: string[], label: string): void {
  lines.push(`  commit id:"${escapeQuotedText(label)}"`);
}

function gitDiagram(sessionMap: SessionMap): string {
  const lines: string[] = ["gitGraph"];
  const usedBranchLabels = new Map<string, number>();
  pushGitCommit(lines, formatGitLabel(sessionMap.set.name || "Live Set", "track", 18));

  const renderBranch = (
    branchCommandName: string,
    track: TrackInfo,
    branchOrder: number,
  ) => {
    lines.push(`  branch "${branchCommandName}" order:${branchOrder}`);
    lines.push(`  checkout "${branchCommandName}"`);
    pushGitCommit(lines, gitCommitLabelForTrack(track));

    for (const summaryCommit of gitTrackSummaryCommits(track)) {
      pushGitCommit(lines, summaryCommit);
    }
    if (track.devices.length === 0) {
      pushGitCommit(lines, "no-dev");
    }

    for (const device of track.devices) {
      pushGitCommit(lines, gitCommitLabelForDevice(device));
      for (const summaryCommit of gitDeviceSummaryCommits(device)) {
        pushGitCommit(lines, summaryCommit);
      }
    }

    lines.push("  checkout main");
  };

  sessionMap.tracks.forEach((track, index) => {
    renderBranch(
      escapeQuotedText(
        reserveUniqueBranchLabel(usedBranchLabels, compactTrackName(track), "T", index),
      ),
      track,
      index + 1,
    );
  });

  sessionMap.returnTracks.forEach((track, index) => {
    renderBranch(
      escapeQuotedText(
        reserveUniqueBranchLabel(usedBranchLabels, compactTrackName(track), "R", index),
      ),
      track,
      sessionMap.tracks.length + index + 1,
    );
  });

  if (sessionMap.masterTrack) {
    pushGitCommit(lines, formatGitLabel(sessionMap.masterTrack.name || "Main", "track", 20));
    pushGitCommit(lines, `dev:${sessionMap.masterTrack.devices.length}`);
  } else {
    pushGitCommit(lines, "Main");
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function kanbanItemLabel(track: TrackInfo): string {
  const rackCount = track.devices.filter((device) => isRackDevice(device)).length;
  return truncateLabel(
    [
      `${trackPrefix(track.kind)} ${truncateLabel(track.name || `Track ${track.index + 1}`, 24)}`,
      shortTrackTypeLabel(track.kind),
      `dev:${track.devices.length}`,
      `sends:${track.sends.length}`,
      rackCount > 0 ? `racks:${rackCount}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    80,
  );
}

function kanbanDeviceLabel(device: DeviceInfo): string {
  const chainCount = device.chainsSummary?.count ?? 0;
  const padCount = device.padsSummary?.count ?? 0;
  return truncateLabel(
    [
      `${devicePrefix(device)} ${truncateLabel(device.name || `Device ${device.index + 1}`, 22)}`,
      isRackDevice(device) ? "Rack" : "Device",
      chainCount > 0 ? `chains:${chainCount}` : null,
      padCount > 0 ? `pads:${padCount}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    72,
  );
}

function kanbanDiagram(sessionMap: SessionMap): string {
  const lines: string[] = ["kanban"];
  const orderedTracks: TrackInfo[] = [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];

  for (const [index, track] of orderedTracks.entries()) {
    const columnTitle = shortTrackTitle(track, index)
      .replaceAll("[", "(")
      .replaceAll("]", ")");
    lines.push(`  ${columnTitle}`);
    lines.push(
      `    [${escapeQuotedText(kanbanItemLabel(track)).replaceAll("[", "(").replaceAll("]", ")")}]`,
    );

    for (const device of track.devices) {
      lines.push(
        `    [${escapeQuotedText(kanbanDeviceLabel(device)).replaceAll("[", "(").replaceAll("]", ")")}]`,
      );
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function generateDiagramForProfile(
  sessionMap: SessionMap,
  selectedProfile: MermaidProfile,
): string {
  switch (selectedProfile) {
    case "git":
      return gitDiagram(sessionMap);
    case "kanban":
      return kanbanDiagram(sessionMap);
    default:
      return flowDiagram(sessionMap);
  }
}

export interface WriteMermaidArtifactOptions {
  jsonPath: string;
  outputPath: string;
  profile: MermaidProfile;
  fileSuffix?: string;
  logPrefix?: string;
  rootDirectory?: string;
}

export async function writeMermaidArtifact(
  options: WriteMermaidArtifactOptions,
): Promise<MermaidPaths> {
  const effectiveLogPrefix = options.logPrefix
    ?? (options.fileSuffix
      ? `[mermaid:${options.fileSuffix}]`
      : options.profile === "flow"
        ? "[mermaid]"
        : `[mermaid:${options.profile}]`);
  const effectiveRootDirectory = options.rootDirectory ?? rootDirectory;
  const logOutputPath = (path: string): string => {
    const rel = relative(effectiveRootDirectory, path);
    return rel && !rel.startsWith("..") ? rel : path;
  };

  console.log(`${effectiveLogPrefix} Read JSON started: ${logOutputPath(options.jsonPath)}`);
  const json = await readFile(options.jsonPath, "utf8");
  console.log(`${effectiveLogPrefix} Read JSON completed`);
  const sessionMap = JSON.parse(json) as SessionMap;

  console.log(`${effectiveLogPrefix} Generate Mermaid started`);
  const mermaid = generateDiagramForProfile(sessionMap, options.profile);
  const outputDirectory = dirname(options.outputPath);
  await mkdir(outputDirectory, { recursive: true });

  const baseName = buildArchiveBaseName(sessionMap);
  const profileSuffix = options.fileSuffix ? `_${options.fileSuffix}` : "";
  const minuteStamp = formatArchiveTimestamp(sessionMap.exportedAt, false);
  const secondStamp = formatArchiveTimestamp(sessionMap.exportedAt, true);
  const candidates = [
    `${baseName}_${minuteStamp}${profileSuffix}`,
    `${baseName}_${secondStamp}${profileSuffix}`,
  ];

  let archivePath: string | null = null;
  for (const candidate of candidates) {
    const candidatePath = join(outputDirectory, `${candidate}.mmd`);
    if (!(await pathExists(candidatePath))) {
      archivePath = candidatePath;
      break;
    }
  }

  if (!archivePath) {
    let suffix = 2;
    while (suffix < 10_000) {
      const candidatePath = join(
        outputDirectory,
        `${baseName}_${secondStamp}${profileSuffix}-${suffix}.mmd`,
      );
      if (!(await pathExists(candidatePath))) {
        archivePath = candidatePath;
        break;
      }
      suffix += 1;
    }
  }

  if (!archivePath) {
    throw new Error("Unable to reserve a unique Mermaid archive filename.");
  }

  const paths = {
    latestPath: options.outputPath,
    archivePath,
  };

  await writeFile(paths.latestPath, mermaid, "utf8");
  await writeFile(paths.archivePath, mermaid, "utf8");
  console.log(`${effectiveLogPrefix} Write Mermaid latest completed: ${logOutputPath(paths.latestPath)}`);
  console.log(`${effectiveLogPrefix} Write Mermaid archive completed: ${logOutputPath(paths.archivePath)}`);
  console.log(`${effectiveLogPrefix} Generate Mermaid completed`);
  return paths;
}

async function main(): Promise<void> {
  await writeMermaidArtifact({
    jsonPath,
    outputPath: latestOutputPath,
    profile,
    fileSuffix: profileFileSuffix,
    logPrefix,
    rootDirectory,
  });
}

const currentModuleHref = typeof __filename !== "undefined"
  ? pathToFileURL(__filename).href
  : import.meta.url;
const isDirectExecution =
  process.argv[1] != null && currentModuleHref === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`${logPrefix} Generation failed: ${detail}`);
    process.exitCode = 1;
  });
}
