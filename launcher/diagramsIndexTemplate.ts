import { access, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";
type ArtifactStatus = "current" | "outdated" | "missing";

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
  note?: string;
}

interface LauncherCard {
  title: string;
  description: string;
  accentClass: string;
  summary: string;
  artifacts: ArtifactEntry[];
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

function statusLabel(status: ArtifactStatus): string {
  switch (status) {
    case "current":
      return "Current";
    case "outdated":
      return "Outdated";
    default:
      return "Missing";
  }
}

function statusNote(status: ArtifactStatus, type: "diagram" | "matrix"): string | undefined {
  if (status === "outdated") {
    return type === "matrix"
      ? "This diagnostic report may be from an older session export."
      : "This diagram may be from an older Live Set.";
  }
  if (status === "missing") {
    return "Not generated yet.";
  }
  return undefined;
}

function artifactStatus(metadata: FileMetadata, jsonMtimeMs: number): ArtifactStatus {
  if (!metadata.exists) return "missing";
  if (metadata.mtimeMs != null && metadata.mtimeMs < jsonMtimeMs) return "outdated";
  return "current";
}

function buildArtifact(
  fileName: string,
  label: string,
  metadataMap: Map<string, FileMetadata>,
  jsonMtimeMs: number,
  type: "diagram" | "matrix",
): ArtifactEntry {
  const metadata = metadataMap.get(fileName) ?? { exists: false, mtimeMs: null };
  const status = artifactStatus(metadata, jsonMtimeMs);
  return {
    label,
    fileName,
    href: fileName,
    status,
    note: statusNote(status, type),
  };
}

function buildCardSummary(artifacts: ArtifactEntry[]): string {
  const current = artifacts.filter((artifact) => artifact.status === "current").length;
  const outdated = artifacts.filter((artifact) => artifact.status === "outdated").length;
  const missing = artifacts.filter((artifact) => artifact.status === "missing").length;
  return `${current} current · ${outdated} outdated · ${missing} missing`;
}

function buildArtifactRow(artifact: ArtifactEntry): string {
  const isLink = artifact.status !== "missing";
  const button = isLink
    ? `<a class="artifact-button ${artifact.status === "outdated" ? "is-warning" : ""}" href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a>`
    : `<span class="artifact-button is-disabled">${escapeHtml(artifact.label)}</span>`;

  return `<div class="artifact-row">
    <div class="artifact-meta">
      <strong>${escapeHtml(artifact.label)}</strong>
      <span>${escapeHtml(artifact.fileName)}</span>
      ${artifact.note ? `<small>${escapeHtml(artifact.note)}</small>` : ""}
    </div>
    <div class="artifact-actions">
      <span class="status-pill status-${artifact.status}">${escapeHtml(statusLabel(artifact.status))}</span>
      ${button}
    </div>
  </div>`;
}

function buildCard(card: LauncherCard): string {
  return `<section class="launcher-card ${escapeHtml(card.accentClass)}">
    <div class="card-head">
      <div>
        <h2>${escapeHtml(card.title)}</h2>
        <p>${escapeHtml(card.description)}</p>
      </div>
      <span class="card-summary">${escapeHtml(card.summary)}</span>
    </div>
    <div class="artifact-list">
      ${card.artifacts.map((artifact) => buildArtifactRow(artifact)).join("")}
    </div>
    ${card.footerNote ? `<p class="card-footnote">${escapeHtml(card.footerNote)}</p>` : ""}
  </section>`;
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

  const diagramArtifacts = {
    sessionGrid: [buildArtifact("session-map-session-grid.html", "HTML view", metadataMap, jsonMtimeMs, "diagram")],
    report: [buildArtifact("session-map.html", "HTML report", metadataMap, jsonMtimeMs, "diagram")],
    flow: [
      buildArtifact("session-map-mermaid-flow.html", "HTML", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-flow.mmd", ".mmd", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-flow.svg", "SVG", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-flow.png", "PNG", metadataMap, jsonMtimeMs, "diagram"),
    ],
    git: [
      buildArtifact("session-map-mermaid-git.html", "HTML", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-git.mmd", ".mmd", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-git.svg", "SVG", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-git.png", "PNG", metadataMap, jsonMtimeMs, "diagram"),
    ],
    kanban: [
      buildArtifact("session-map-mermaid-kanban.html", "HTML", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-kanban.mmd", ".mmd", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-kanban.svg", "SVG", metadataMap, jsonMtimeMs, "diagram"),
      buildArtifact("session-map-kanban.png", "PNG", metadataMap, jsonMtimeMs, "diagram"),
    ],
  };

  const sdkArtifacts = [
    buildArtifact("sdk-capability-matrix.html", "HTML", metadataMap, jsonMtimeMs, "matrix"),
    buildArtifact("sdk-capability-matrix.json", "JSON", metadataMap, jsonMtimeMs, "matrix"),
    buildArtifact("sdk-capability-matrix.md", "Markdown", metadataMap, jsonMtimeMs, "matrix"),
  ];

  const cards: LauncherCard[] = [
    {
      title: "Session Grid",
      description: "Live-like session overview generated on export.",
      accentClass: "accent-grid",
      artifacts: diagramArtifacts.sessionGrid,
      footerNote: "HTML views are generated on export.",
      summary: buildCardSummary(diagramArtifacts.sessionGrid),
    },
    {
      title: "HTML Report",
      description: "Detailed report with tracks, devices, sends and rack summaries.",
      accentClass: "accent-report",
      artifacts: diagramArtifacts.report,
      footerNote: "HTML views are generated on export.",
      summary: buildCardSummary(diagramArtifacts.report),
    },
    {
      title: "Flow",
      description: "Technical tree of the latest Live Set.",
      accentClass: "accent-flow",
      artifacts: diagramArtifacts.flow,
      footerNote: "HTML + .mmd are refreshed on export. SVG/PNG are manual renders.",
      summary: buildCardSummary(diagramArtifacts.flow),
    },
    {
      title: "Git / Metro",
      description: "Metro-style track map aligned with the latest export.",
      accentClass: "accent-git",
      artifacts: diagramArtifacts.git,
      footerNote: "HTML + .mmd are refreshed on export. SVG/PNG are manual renders.",
      summary: buildCardSummary(diagramArtifacts.git),
    },
    {
      title: "Kanban",
      description: "Session-order columns with devices under each track.",
      accentClass: "accent-kanban",
      artifacts: diagramArtifacts.kanban,
      footerNote: "Kanban stays external. HTML + .mmd are refreshed on export.",
      summary: buildCardSummary(diagramArtifacts.kanban),
    },
    {
      title: "Raw Data",
      description: "Latest JSON export and quick access to the exports folder.",
      accentClass: "accent-raw",
      artifacts: [
        buildArtifact("session-map.json", "session-map.json", metadataMap, jsonMtimeMs, "diagram"),
        {
          label: "Exports folder",
          fileName: "Open folder",
          href: `file://${exportsDirectory}`,
          status: "current",
        },
      ],
      footerNote: "Use this when you want the raw export or archived files directly.",
      summary: buildCardSummary([buildArtifact("session-map.json", "session-map.json", metadataMap, jsonMtimeMs, "diagram")]),
    },
    {
      title: "SDK Capability Matrix",
      description: "Separate diagnostic report about SDK exposure.",
      accentClass: "accent-matrix",
      artifacts: sdkArtifacts,
      footerNote: "Refresh from Live with ENABLE_CAPABILITY_MATRIX=true.",
      summary: buildCardSummary(sdkArtifacts),
    },
  ];

  const hasOutdatedDiagrams = Object.values(diagramArtifacts)
    .flat()
    .some((artifact) => artifact.status === "outdated");
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
      --live-bg: #b9b9b9;
      --live-panel: #cdcdcd;
      --live-panel-light: #d9d9d9;
      --live-border: #8a8a8a;
      --live-grid: rgba(0,0,0,0.04);
      --live-text: #202020;
      --live-muted: #5d5d5d;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
      --live-cyan: #3fc2d7;
      --live-magenta: #d86ec0;
      --ok: #4c8d4c;
      --warn: #c68619;
      --missing: #8b6f5f;
      --matrix: #4fb98f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--live-text);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.18), transparent 22%),
        repeating-linear-gradient(0deg, var(--live-grid) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(90deg, var(--live-grid) 0 1px, transparent 1px 24px),
        var(--live-bg);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 1360px;
      margin: 0 auto;
      padding: 18px;
    }
    .hero, .metrics, .workflow, .launcher-card {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.9fr);
      gap: 14px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .eyebrow {
      margin: 0 0 4px;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--live-orange-dark);
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.1;
    }
    .subtitle {
      margin: 8px 0 0;
      max-width: 48rem;
      color: var(--live-muted);
      font-size: 13px;
      line-height: 1.5;
    }
    .hero-side {
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .meta-label {
      margin: 0 0 2px;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--live-muted);
      font-weight: 700;
    }
    .meta-value {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      margin-bottom: 12px;
      overflow: hidden;
    }
    .metric {
      padding: 14px;
      border-right: 1px solid var(--live-border);
      background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
    }
    .metric:last-child { border-right: 0; }
    .metric strong {
      display: block;
      font-size: 24px;
      line-height: 1;
      margin-bottom: 4px;
    }
    .metric span {
      font-size: 11px;
      color: var(--live-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .workflow {
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .workflow h2 {
      margin: 0 0 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .workflow-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 16px;
    }
    .workflow p, .workflow li {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .workflow ul, .workflow ol {
      margin: 0;
      padding-left: 18px;
    }
    .note {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 4px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(0,0,0,0.08);
      font-size: 12px;
      line-height: 1.45;
    }
    .note.is-warning {
      background: rgba(245,166,35,0.16);
      border-color: rgba(180,120,0,0.24);
    }
    .note.is-matrix {
      background: rgba(79,185,143,0.14);
      border-color: rgba(79,185,143,0.24);
    }
    .note a {
      color: #1f4c73;
      font-weight: 700;
      text-decoration: none;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 12px;
    }
    .launcher-card {
      padding: 14px;
      display: grid;
      gap: 12px;
    }
    .accent-grid { border-left: 4px solid #8b7dff; }
    .accent-report { border-left: 4px solid var(--live-orange); }
    .accent-flow { border-left: 4px solid #6ba7ff; }
    .accent-git { border-left: 4px solid var(--live-cyan); }
    .accent-kanban { border-left: 4px solid var(--live-magenta); }
    .accent-raw { border-left: 4px solid #6e6e6e; }
    .accent-matrix { border-left: 4px solid var(--matrix); }
    .card-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: start;
    }
    .card-head h2 {
      margin: 0 0 4px;
      font-size: 16px;
      line-height: 1.2;
    }
    .card-head p {
      margin: 0;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .card-summary {
      flex: 0 0 auto;
      font-size: 10px;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--live-muted);
      padding: 7px 8px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 4px;
      white-space: nowrap;
    }
    .artifact-list {
      display: grid;
      gap: 8px;
    }
    .artifact-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding: 9px 10px;
      border: 1px solid rgba(0,0,0,0.08);
      background: rgba(255,255,255,0.14);
      border-radius: 4px;
    }
    .artifact-meta {
      min-width: 0;
      display: grid;
      gap: 2px;
    }
    .artifact-meta strong {
      font-size: 12px;
      line-height: 1.25;
    }
    .artifact-meta span,
    .artifact-meta small {
      font-size: 11px;
      color: var(--live-muted);
      line-height: 1.35;
      word-break: break-word;
    }
    .artifact-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 8px;
      border-radius: 999px;
      font-size: 10px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid rgba(0,0,0,0.12);
      background: rgba(255,255,255,0.14);
    }
    .status-current { color: #1f4d1f; background: rgba(76,141,76,0.2); }
    .status-outdated { color: #8a5600; background: rgba(198,134,25,0.2); }
    .status-missing { color: #6f5645; background: rgba(139,111,95,0.18); }
    .artifact-button {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1px solid #8b8b8b;
      background: linear-gradient(180deg, #eeeeee, #cfcfcf);
      color: #1a1a1a;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
    }
    .artifact-button.is-warning {
      background: linear-gradient(180deg, #ffd48a, #eab255);
      border-color: #a97000;
    }
    .artifact-button.is-disabled {
      opacity: 0.5;
      background: linear-gradient(180deg, #dddddd, #c4c4c4);
      color: #6a6a6a;
      cursor: default;
    }
    .card-footnote {
      margin: 0;
      color: var(--live-muted);
      font-size: 11px;
      line-height: 1.45;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      margin-top: 12px;
      padding: 12px 4px 0;
      color: var(--live-muted);
      font-size: 11px;
    }
    .footer a {
      color: var(--live-muted);
      text-decoration: none;
    }
    .footer a:hover {
      color: var(--live-orange-dark);
    }
    @media (max-width: 980px) {
      .hero, .workflow-grid { grid-template-columns: 1fr; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .artifact-row,
      .card-head,
      .footer {
        display: grid;
        grid-template-columns: 1fr;
      }
      .artifact-actions { justify-content: start; }
      .metrics { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Session Mapper / External Launcher</p>
        <h1>Session Mapper</h1>
        <p class="subtitle">Live-like external launcher aligned with the integrated modal. Mermaid HTML views are refreshed on export. Heavy SVG/PNG renders stay optional.</p>
      </div>
      <aside class="hero-side">
        <div>
          <p class="meta-label">Set</p>
          <p class="meta-value">${escapeHtml(projectName)}</p>
        </div>
        <div>
          <p class="meta-label">Export date</p>
          <p class="meta-value">${escapeHtml(formatExportDate(sessionMap.exportedAt))}</p>
        </div>
        <div>
          <p class="meta-label">Mode</p>
          <p class="meta-value">${escapeHtml(sessionMap.scan?.mode ?? "unknown")}</p>
        </div>
        <div>
          <p class="meta-label">Last export</p>
          <p class="meta-value">${escapeHtml(relativeJsonPath)}</p>
        </div>
      </aside>
    </section>

    <section class="metrics" aria-label="Session metrics">
      ${buildMetricsHtml(sessionMap)}
    </section>

    <section class="workflow">
      <h2>Recommended workflow</h2>
      <div class="workflow-grid">
        <div>
          <ol>
            <li>Depuis Live : <strong>Export Session Map</strong></li>
            <li>La modale intégrée s’ouvre</li>
            <li>Le launcher externe donne accès aux vues HTML à jour</li>
          </ol>
        </div>
        <div>
          <ul>
            <li><strong>HTML views:</strong> generated on export</li>
            <li><strong>SVG/PNG:</strong> render manually with <strong>npm run export:diagram:all</strong></li>
            <li><strong>SDK Matrix:</strong> refresh from Live with <strong>ENABLE_CAPABILITY_MATRIX=true</strong></li>
          </ul>
        </div>
      </div>
      ${hasOutdatedDiagrams ? `<div class="note is-warning">Some diagram renders are older than the latest export.</div>` : ""}
      ${hasOutdatedSdkMatrix ? `<div class="note is-matrix">SDK Capability Matrix is a separate diagnostic report and may be older than the latest export.</div>` : ""}
      <div class="note">
        <strong>Open without CORS issues</strong><br>
        If Mermaid HTML does not render from <code>file://</code>: run <strong>npm run serve:exports</strong> then open
        <a href="${localhostLauncherUrl}">${localhostLauncherUrl}</a>
      </div>
    </section>

    <section class="cards" aria-label="Visualization launcher">
      ${cards.map((card) => buildCard(card)).join("\n")}
    </section>

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
