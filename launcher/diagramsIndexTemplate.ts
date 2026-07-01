import { access, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";
type ArtifactStatus = "current" | "outdated" | "missing";
type ArtifactRole = "primary" | "render" | "data";

interface DeviceInfo {
  type: string;
  chainsSummary?: { count: number } | null;
  padsSummary?: { count: number } | null;
}

interface TrackInfo {
  kind: TrackKind;
  devices: DeviceInfo[];
  sends: Array<unknown>;
}

interface SessionMap {
  version: string;
  exportedAt: string;
  set: {
    name: string | null;
    tempo: number | null;
  };
  scan?: {
    mode?: string;
  };
  tracks: TrackInfo[];
  returnTracks: TrackInfo[];
  masterTrack: TrackInfo | null;
}

interface FileMetadata {
  exists: boolean;
  mtimeMs: number | null;
}

interface ArtifactEntry {
  label: string;
  fileName: string;
  href: string;
  status: ArtifactStatus;
  role: ArtifactRole;
  note?: string;
}

interface PrimaryViewCard {
  title: string;
  description: string;
  accentClass: string;
  primary: ArtifactEntry;
  extras?: ArtifactEntry[];
  footerNote?: string;
}

export interface GenerateDiagramsIndexOptions {
  jsonPath: string;
  outputPath: string;
  rootDirectory: string;
}

const DIAGRAM_FILES = [
  "session-map.html",
  "session-map-session-grid.html",
  "session-map-mermaid-flow.html",
  "session-map-flow.mmd",
  "session-map-flow.svg",
  "session-map-flow.png",
  "session-map-mermaid-git.html",
  "session-map-git.mmd",
  "session-map-git.svg",
  "session-map-git.png",
  "session-map-mermaid-kanban.html",
  "session-map-kanban.mmd",
  "session-map-kanban.svg",
  "session-map-kanban.png",
] as const;

const SDK_MATRIX_FILES = [
  "sdk-capability-matrix.html",
  "sdk-capability-matrix.json",
  "sdk-capability-matrix.md",
] as const;

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatExportDate(dateLike: string): string {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "Unknown export date";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function getFileMetadata(path: string): Promise<FileMetadata> {
  if (!(await pathExists(path))) {
    return { exists: false, mtimeMs: null };
  }

  const details = await stat(path);
  return {
    exists: true,
    mtimeMs: details.mtimeMs,
  };
}

function isRackLike(device: DeviceInfo): boolean {
  return (
    device.type.toLowerCase().includes("rack") ||
    Boolean(device.chainsSummary?.count) ||
    Boolean(device.padsSummary?.count)
  );
}

function metricSummary(sessionMap: SessionMap): Array<{ value: string; label: string }> {
  const allTracks = [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];
  const deviceCount = allTracks.reduce((sum, track) => sum + track.devices.length, 0);
  const rackCount = allTracks.reduce(
    (sum, track) => sum + track.devices.filter((device) => isRackLike(device)).length,
    0,
  );
  const sendCount = allTracks.reduce((sum, track) => sum + track.sends.length, 0);

  return [
    { value: String(sessionMap.tracks.length), label: "Tracks" },
    { value: String(sessionMap.returnTracks.length), label: "Returns" },
    { value: String(deviceCount), label: "Devices" },
    { value: String(rackCount), label: "Racks" },
    { value: String(sendCount), label: "Sends" },
  ];
}

function artifactStatus(metadata: FileMetadata, jsonMtimeMs: number): ArtifactStatus {
  if (!metadata.exists) return "missing";
  if (metadata.mtimeMs != null && metadata.mtimeMs < jsonMtimeMs) return "outdated";
  return "current";
}

function statusNote(artifact: ArtifactEntry): string | undefined {
  if (artifact.role === "render") {
    if (artifact.status === "outdated") {
      return "Older manual render.";
    }
    if (artifact.status === "missing") {
      return "Optional manual render.";
    }
    return "Manual render available.";
  }

  if (artifact.role === "data" && artifact.fileName.startsWith("sdk-capability-matrix")) {
    if (artifact.status === "outdated") {
      return "Separate Live diagnostic.";
    }
    if (artifact.status === "missing") {
      return "Not generated yet.";
    }
    return "Separate Live diagnostic.";
  }

  if (artifact.status === "outdated") {
    return "Older than latest session export.";
  }
  if (artifact.status === "missing") {
    return "Not generated yet.";
  }
  return undefined;
}

function buildArtifact(
  fileName: string,
  label: string,
  metadataMap: Map<string, FileMetadata>,
  jsonMtimeMs: number,
  role: ArtifactRole,
): ArtifactEntry {
  const metadata = metadataMap.get(fileName) ?? { exists: false, mtimeMs: null };
  const status = artifactStatus(metadata, jsonMtimeMs);
  const artifact: ArtifactEntry = {
    label,
    fileName,
    href: fileName,
    status,
    role,
  };
  artifact.note = statusNote(artifact);
  return artifact;
}

function renderStatusBadge(label: string, tone: "ok" | "warn" | "neutral" | "missing"): string {
  return `<span class="status-badge status-${tone}">${escapeHtml(label)}</span>`;
}

function cardStatus(card: PrimaryViewCard): { label: string; tone: "ok" | "warn" | "neutral" | "missing"; note?: string } {
  if (card.primary.status === "missing") {
    return { label: "Missing files", tone: "missing" };
  }
  if (card.primary.status === "outdated") {
    return { label: "Needs refresh", tone: "warn" };
  }

  const olderExtras = (card.extras ?? []).filter((artifact) => artifact.status === "outdated");
  const missingExtras = (card.extras ?? []).filter((artifact) => artifact.status === "missing");

  if (olderExtras.length > 0) {
    return { label: "Current", tone: "ok", note: "Some older renders" };
  }
  if (missingExtras.length > 0) {
    return { label: "Current", tone: "ok", note: "More exports available" };
  }

  return { label: "Current", tone: "ok" };
}

function moreStatusLabel(artifact: ArtifactEntry): string {
  if (artifact.role === "render") {
    switch (artifact.status) {
      case "current":
        return "Current";
      case "outdated":
        return "Older render";
      default:
        return "Missing";
    }
  }

  switch (artifact.status) {
    case "current":
      return "Current";
    case "outdated":
      return "Older";
    default:
      return "Missing";
  }
}

function moreStatusTone(artifact: ArtifactEntry): "ok" | "warn" | "neutral" | "missing" {
  if (artifact.status === "missing") return "missing";
  if (artifact.status === "outdated") return artifact.role === "render" ? "neutral" : "warn";
  return artifact.role === "render" ? "neutral" : "ok";
}

function renderPrimaryCard(card: PrimaryViewCard): string {
  const status = cardStatus(card);
  const moreCount = card.extras?.length ?? 0;

  return `<article class="view-card ${escapeHtml(card.accentClass)}">
    <div class="view-head">
      <div class="view-copy">
        <h2>${escapeHtml(card.title)}</h2>
        <p>${escapeHtml(card.description)}</p>
      </div>
      ${renderStatusBadge(status.label, status.tone)}
    </div>

    ${status.note ? `<p class="status-note">${escapeHtml(status.note)}</p>` : ""}

    <div class="view-actions">
      <a class="open-button" href="${escapeHtml(card.primary.href)}">${escapeHtml(card.primary.label)}</a>
      ${moreCount > 0 ? `<details class="more-exports">
        <summary>More</summary>
        <div class="more-list">
          ${card.extras!.map((artifact) => `<div class="more-row">
            <div class="more-copy">
              <strong>${escapeHtml(artifact.label)}</strong>
              <small>${escapeHtml(artifact.note ?? artifact.fileName)}</small>
            </div>
            <div class="more-actions">
              ${renderStatusBadge(moreStatusLabel(artifact), moreStatusTone(artifact))}
              ${artifact.status === "missing"
                ? `<span class="mini-button is-disabled">${escapeHtml(artifact.label)}</span>`
                : `<a class="mini-button" href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a>`}
            </div>
          </div>`).join("\n")}
        </div>
      </details>` : ""}
    </div>

    ${card.footerNote ? `<p class="view-foot">${escapeHtml(card.footerNote)}</p>` : ""}
  </article>`;
}

function renderDataRow(artifact: ArtifactEntry): string {
  return `<div class="compact-row">
    <div class="compact-copy">
      <strong>${escapeHtml(artifact.label)}</strong>
      <small>${escapeHtml(artifact.note ?? artifact.fileName)}</small>
    </div>
    <div class="compact-actions">
      ${renderStatusBadge(moreStatusLabel(artifact), moreStatusTone(artifact))}
      ${artifact.status === "missing"
        ? `<span class="mini-button is-disabled">${escapeHtml(artifact.label)}</span>`
        : `<a class="mini-button" href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a>`}
    </div>
  </div>`;
}

function buildMetricsHtml(sessionMap: SessionMap): string {
  return metricSummary(sessionMap)
    .map(
      (metric) => `<article class="metric">
        <strong>${escapeHtml(metric.value)}</strong>
        <span>${escapeHtml(metric.label)}</span>
      </article>`,
    )
    .join("\n");
}

export async function buildDiagramsIndexHtml(
  options: GenerateDiagramsIndexOptions,
): Promise<string> {
  const json = await readFile(options.jsonPath, "utf8");
  const sessionMap = JSON.parse(json) as SessionMap;
  const jsonStats = await stat(options.jsonPath);
  const jsonMtimeMs = jsonStats.mtimeMs;
  const outputDirectory = dirname(options.outputPath);
  const exportsDirectory = resolve(options.rootDirectory, "exports");
  const relativeJsonPath = relative(outputDirectory, options.jsonPath) || basename(options.jsonPath);
  const projectName = sessionMap.set.name?.trim() || "Ableton Live Set";

  const trackedFiles = [
    ...DIAGRAM_FILES,
    ...SDK_MATRIX_FILES,
    "session-map.json",
  ];
  const metadataMap = new Map<string, FileMetadata>();
  await Promise.all(
    trackedFiles.map(async (fileName) => {
      metadataMap.set(fileName, await getFileMetadata(resolve(exportsDirectory, fileName)));
    }),
  );

  const primaryViews: PrimaryViewCard[] = [
    {
      title: "Session Grid",
      description: "Live-like overview",
      accentClass: "accent-grid",
      primary: buildArtifact("session-map-session-grid.html", "Open", metadataMap, jsonMtimeMs, "primary"),
    },
    {
      title: "HTML Report",
      description: "Detailed report",
      accentClass: "accent-report",
      primary: buildArtifact("session-map.html", "Open", metadataMap, jsonMtimeMs, "primary"),
    },
    {
      title: "Git / Metro",
      description: "Track/device metro map",
      accentClass: "accent-git",
      primary: buildArtifact("session-map-mermaid-git.html", "Open", metadataMap, jsonMtimeMs, "primary"),
      extras: [
        buildArtifact("session-map-git.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-git.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-git.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "data"),
      ],
      footerNote: "Custom Metro is canonical.",
    },
    {
      title: "Flow",
      description: "Technical tree",
      accentClass: "accent-flow",
      primary: buildArtifact("session-map-mermaid-flow.html", "Open", metadataMap, jsonMtimeMs, "primary"),
      extras: [
        buildArtifact("session-map-flow.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-flow.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-flow.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "data"),
      ],
    },
    {
      title: "Kanban",
      description: "External column view",
      accentClass: "accent-kanban",
      primary: buildArtifact("session-map-mermaid-kanban.html", "Open", metadataMap, jsonMtimeMs, "primary"),
      extras: [
        buildArtifact("session-map-kanban.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-kanban.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-kanban.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "data"),
      ],
    },
  ];

  const rawArtifacts: ArtifactEntry[] = [
    buildArtifact("session-map.json", "session-map.json", metadataMap, jsonMtimeMs, "data"),
    {
      label: "Exports folder",
      fileName: "exports/",
      href: `file://${exportsDirectory}`,
      status: "current",
      role: "data",
      note: "Open latest files and archives.",
    },
    buildArtifact("session-map-flow.mmd", "Flow .mmd", metadataMap, jsonMtimeMs, "data"),
    buildArtifact("session-map-git.mmd", "Git / Metro .mmd", metadataMap, jsonMtimeMs, "data"),
    buildArtifact("session-map-kanban.mmd", "Kanban .mmd", metadataMap, jsonMtimeMs, "data"),
  ];

  const sdkArtifacts: ArtifactEntry[] = [
    buildArtifact("sdk-capability-matrix.html", "Capability Matrix HTML", metadataMap, jsonMtimeMs, "data"),
    buildArtifact("sdk-capability-matrix.json", "Capability Matrix JSON", metadataMap, jsonMtimeMs, "data"),
    buildArtifact("sdk-capability-matrix.md", "Capability Matrix Markdown", metadataMap, jsonMtimeMs, "data"),
  ];

  const allPrimaryArtifacts = primaryViews.map((view) => view.primary);
  const allExtras = primaryViews.flatMap((view) => view.extras ?? []);
  const hasOutdatedPrimaryViews = allPrimaryArtifacts.some((artifact) => artifact.status === "outdated");
  const hasOlderManualRenders = allExtras.some((artifact) => artifact.role === "render" && artifact.status === "outdated");
  const hasMissingPrimaryViews = allPrimaryArtifacts.some((artifact) => artifact.status === "missing");
  const hasOutdatedSdkMatrix = sdkArtifacts.some((artifact) => artifact.status === "outdated");
  const localhostLauncherUrl = "http://localhost:5177/exports/session-map-diagrams.html";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ableton Session Mapper — External Launcher</title>
  <style>
    :root {
      --live-bg: #b7b7b7;
      --live-panel: #cbcbcb;
      --live-panel-light: #d8d8d8;
      --live-border: #8f8f8f;
      --live-border-soft: rgba(0,0,0,0.12);
      --live-grid: rgba(0,0,0,0.035);
      --live-text: #202020;
      --live-muted: #5e5e5e;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
      --live-cyan: #3fc2d7;
      --live-magenta: #cb67ba;
      --ok: #407a40;
      --warn: #b67814;
      --neutral: #5a6d7d;
      --missing: #7a655a;
      --matrix: #49a97f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--live-text);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.16), transparent 22%),
        repeating-linear-gradient(0deg, var(--live-grid) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(90deg, var(--live-grid) 0 1px, transparent 1px 24px),
        var(--live-bg);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 1440px;
      margin: 0 auto;
      padding: 16px;
      display: grid;
      gap: 10px;
    }
    .panel {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .header {
      display: grid;
      gap: 10px;
      padding: 12px 14px;
    }
    .header-top {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
    }
    .eyebrow {
      margin: 0 0 2px;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--live-orange-dark);
    }
    h1 {
      margin: 0;
      font-size: 21px;
      line-height: 1.05;
    }
    .header-line {
      margin: 4px 0 0;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.4;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      justify-content: flex-end;
      font-size: 11px;
      color: var(--live-muted);
    }
    .meta strong { color: var(--live-text); font-weight: 700; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      overflow: hidden;
      border-top: 1px solid var(--live-border-soft);
      padding-top: 10px;
      gap: 8px;
    }
    .metric {
      padding: 6px 8px;
      border: 1px solid var(--live-border-soft);
      border-radius: 4px;
      background: rgba(255,255,255,0.14);
      display: grid;
      gap: 2px;
      text-align: center;
    }
    .metric strong {
      font-size: 18px;
      line-height: 1;
    }
    .metric span {
      font-size: 10px;
      color: var(--live-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .note-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      color: var(--live-muted);
      font-size: 11px;
    }
    .note-chip {
      padding: 5px 8px;
      border: 1px solid var(--live-border-soft);
      border-radius: 999px;
      background: rgba(255,255,255,0.15);
    }
    .primary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .view-card {
      padding: 12px;
      display: grid;
      gap: 8px;
      background: var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-left-width: 4px;
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
    }
    .accent-grid { border-left-color: #8477ff; }
    .accent-report { border-left-color: var(--live-orange); }
    .accent-flow { border-left-color: #6ba7ff; }
    .accent-git { border-left-color: var(--live-cyan); }
    .accent-kanban { border-left-color: var(--live-magenta); }
    .view-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: start;
    }
    .view-copy h2 {
      margin: 0;
      font-size: 15px;
      line-height: 1.15;
    }
    .view-copy p {
      margin: 3px 0 0;
      color: var(--live-muted);
      font-size: 11px;
      line-height: 1.3;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 21px;
      padding: 0 7px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.12);
      font-size: 10px;
      line-height: 1;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
      background: rgba(255,255,255,0.16);
    }
    .status-ok { color: #1f4d1f; background: rgba(76,141,76,0.18); }
    .status-warn { color: #8a5600; background: rgba(198,134,25,0.18); }
    .status-neutral { color: #35556d; background: rgba(99,144,176,0.16); }
    .status-missing { color: #6f5645; background: rgba(139,111,95,0.18); }
    .status-note {
      margin: 0;
      color: var(--live-muted);
      font-size: 11px;
      line-height: 1.25;
      min-height: 14px;
    }
    .view-actions {
      display: grid;
      gap: 6px;
      align-items: start;
    }
    .open-button,
    .mini-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1px solid #8d8d8d;
      background: linear-gradient(180deg, #eeeeee, #cfcfcf);
      color: #1a1a1a;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
    }
    .open-button {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-dark));
      border-color: #9a6200;
      color: #181204;
      width: 100%;
    }
    .mini-button.is-disabled {
      opacity: 0.5;
      color: #6a6a6a;
      cursor: default;
    }
    .more-exports {
      border: 1px solid var(--live-border-soft);
      border-radius: 4px;
      background: rgba(255,255,255,0.12);
      overflow: hidden;
    }
    .more-exports summary,
    .fold summary {
      cursor: pointer;
      list-style: none;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      color: var(--live-text);
    }
    .more-exports summary::-webkit-details-marker,
    .fold summary::-webkit-details-marker {
      display: none;
    }
    .more-exports summary::after,
    .fold summary::after {
      content: "▸";
      float: right;
      color: var(--live-muted);
    }
    .more-exports[open] summary::after,
    .fold[open] summary::after {
      content: "▾";
    }
    .more-list,
    .fold-body {
      padding: 0 8px 8px;
      display: grid;
      gap: 6px;
    }
    .more-row,
    .compact-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      padding: 7px 8px;
      border-radius: 4px;
      border: 1px solid var(--live-border-soft);
      background: rgba(255,255,255,0.12);
    }
    .more-copy,
    .compact-copy {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    .more-copy strong,
    .compact-copy strong {
      font-size: 11px;
      line-height: 1.2;
    }
    .more-copy small,
    .compact-copy small {
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.3;
      word-break: break-word;
    }
    .more-actions,
    .compact-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .view-foot {
      margin: 0;
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.25;
    }
    .fold {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .fold p {
      margin: 0;
      color: var(--live-muted);
      font-size: 11px;
      line-height: 1.4;
    }
    .commands {
      display: grid;
      gap: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
    }
    .command {
      padding: 7px 8px;
      border-radius: 4px;
      border: 1px solid var(--live-border-soft);
      background: rgba(255,255,255,0.12);
      color: var(--live-text);
    }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      padding: 0 4px;
      color: var(--live-muted);
      font-size: 10px;
    }
    .footer a {
      color: inherit;
      text-decoration: none;
    }
    @media (max-width: 900px) {
      .header-top { grid-template-columns: 1fr; }
      .meta { justify-content: flex-start; }
      .metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .more-row,
      .compact-row,
      .footer { grid-template-columns: 1fr; display: grid; }
      .more-actions,
      .compact-actions { justify-content: start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="panel header">
      <div class="header-top">
        <div>
          <p class="eyebrow">Session Mapper / External Launcher</p>
          <h1>Session Mapper</h1>
          <p class="header-line">Set: <strong>${escapeHtml(projectName)}</strong> · Export: <strong>${escapeHtml(formatExportDate(sessionMap.exportedAt))}</strong> · Mode: <strong>${escapeHtml(sessionMap.scan?.mode ?? "unknown")}</strong></p>
        </div>
        <div class="meta">
          <span><strong>JSON</strong> ${escapeHtml(relativeJsonPath)}</span>
        </div>
      </div>

      <section class="metrics" aria-label="Session metrics">
        ${buildMetricsHtml(sessionMap)}
      </section>

      <div class="note-strip">
        <span class="note-chip">HTML views are current on export</span>
        <span class="note-chip">SVG/PNG are optional manual renders</span>
        ${hasOutdatedPrimaryViews ? `<span class="note-chip">Some primary views need refresh</span>` : ""}
        ${!hasOutdatedPrimaryViews && hasOlderManualRenders ? `<span class="note-chip">Some older renders</span>` : ""}
        ${hasMissingPrimaryViews ? `<span class="note-chip">Some files missing</span>` : ""}
      </div>
    </section>

    <section class="primary-grid" aria-label="Primary views">
      ${primaryViews.map((card) => renderPrimaryCard(card)).join("\n")}
    </section>

    <details class="fold">
      <summary>Advanced exports</summary>
      <div class="fold-body">
        <p>Raw data, exports folder, Mermaid sources, and quick access to archived outputs.</p>
        ${rawArtifacts.map((artifact) => renderDataRow(artifact)).join("\n")}
      </div>
    </details>

    <details class="fold">
      <summary>Diagnostics</summary>
      <div class="fold-body">
        <p>SDK Capability Matrix is a separate Live diagnostic.</p>
        ${hasOutdatedSdkMatrix ? `<p>Current launcher views may be up to date even if the Capability Matrix is older.</p>` : ""}
        ${sdkArtifacts.map((artifact) => renderDataRow(artifact)).join("\n")}
      </div>
    </details>

    <details class="fold">
      <summary>Commands</summary>
      <div class="fold-body">
        <p>Use these only when you want manual renders or localhost preview.</p>
        <div class="commands">
          <div class="command">npm run export:diagram:all</div>
          <div class="command">npm run serve:exports</div>
          <div class="command">npm run open:diagrams:http</div>
        </div>
        <p>Localhost preview: <a href="${localhostLauncherUrl}">${localhostLauncherUrl}</a></p>
      </div>
    </details>

    <footer class="footer">
      <span>Exports folder: ${escapeHtml(exportsDirectory)}</span>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`;
}

export async function writeDiagramsIndex(
  options: GenerateDiagramsIndexOptions,
): Promise<string> {
  const html = await buildDiagramsIndexHtml(options);
  await writeFile(options.outputPath, html, "utf8");
  return options.outputPath;
}
