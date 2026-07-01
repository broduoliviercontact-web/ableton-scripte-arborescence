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

interface LauncherCard {
  title: string;
  description: string;
  accentClass: string;
  summary: string;
  artifacts: ArtifactEntry[];
  footerNote?: string;
}

interface LauncherSection {
  title: string;
  description: string;
  cards: LauncherCard[];
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

function statusLabel(artifact: ArtifactEntry): string {
  if (artifact.role === "render") {
    switch (artifact.status) {
      case "current":
        return "Rendered";
      case "outdated":
        return "Older render";
      default:
        return "Optional";
    }
  }

  switch (artifact.status) {
    case "current":
      return "Current";
    case "outdated":
      return artifact.role === "data" ? "Older" : "Needs refresh";
    default:
      return "Missing";
  }
}

function statusNote(artifact: ArtifactEntry): string | undefined {
  if (artifact.role === "render") {
    if (artifact.status === "outdated") {
      return "Manual SVG/PNG render older than the latest export.";
    }
    if (artifact.status === "missing") {
      return "Optional manual render. Use npm run export:diagram:all.";
    }
    return "Optional manual render generated for sharing or print.";
  }

  if (artifact.role === "data" && artifact.fileName.startsWith("sdk-capability-matrix")) {
    if (artifact.status === "outdated") {
      return "Separate Live diagnostic, not refreshed by diagram exports.";
    }
    if (artifact.status === "missing") {
      return "Generate from Live with ENABLE_CAPABILITY_MATRIX=true.";
    }
    return "Separate SDK diagnostic snapshot.";
  }

  if (artifact.status === "outdated") {
    return "Older than the latest session-map export.";
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

function buildCardSummary(artifacts: ArtifactEntry[]): string {
  const primaryArtifacts = artifacts.filter((artifact) => artifact.role === "primary");
  const renderArtifacts = artifacts.filter((artifact) => artifact.role === "render");
  const dataArtifacts = artifacts.filter((artifact) => artifact.role === "data");

  if (primaryArtifacts.length > 0) {
    const outdatedPrimary = primaryArtifacts.filter((artifact) => artifact.status === "outdated").length;
    const missingPrimary = primaryArtifacts.filter((artifact) => artifact.status === "missing").length;
    const olderRenders = renderArtifacts.filter((artifact) => artifact.status === "outdated").length;
    const missingRenders = renderArtifacts.filter((artifact) => artifact.status === "missing").length;

    if (outdatedPrimary > 0) {
      return outdatedPrimary === 1 ? "Primary view needs refresh" : `${outdatedPrimary} primary views need refresh`;
    }
    if (missingPrimary > 0) {
      return missingPrimary === 1 ? "Primary view missing" : `${missingPrimary} primary views missing`;
    }
    if (olderRenders > 0) {
      return olderRenders === 1 ? "Primary views current · 1 older render" : `Primary views current · ${olderRenders} older renders`;
    }
    if (missingRenders > 0) {
      return missingRenders === 1 ? "Primary views current · 1 optional render" : `Primary views current · ${missingRenders} optional renders`;
    }
    return "Primary views current";
  }

  const current = dataArtifacts.filter((artifact) => artifact.status === "current").length;
  const outdated = dataArtifacts.filter((artifact) => artifact.status === "outdated").length;
  const missing = dataArtifacts.filter((artifact) => artifact.status === "missing").length;
  return `${current} current · ${outdated} older · ${missing} missing`;
}

function choosePrimaryArtifact(artifacts: ArtifactEntry[]): ArtifactEntry | null {
  return (
    artifacts.find((artifact) => artifact.role === "primary" && artifact.status !== "missing") ??
    artifacts.find((artifact) => artifact.role === "primary") ??
    artifacts.find((artifact) => artifact.status !== "missing") ??
    artifacts[0] ??
    null
  );
}

function buildPrimaryButton(artifact: ArtifactEntry | null): string {
  if (!artifact) return "";
  if (artifact.status === "missing") {
    return `<span class="primary-button is-disabled">${escapeHtml(artifact.label)}</span>`;
  }

  return `<a class="primary-button" href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a>`;
}

function buildSecondaryButton(artifact: ArtifactEntry): string {
  if (artifact.status === "missing") {
    return `<span class="secondary-button is-disabled">${escapeHtml(artifact.label)}</span>`;
  }

  const warningClass = artifact.status === "outdated" && artifact.role !== "render" ? " is-warning" : "";
  return `<a class="secondary-button${warningClass}" href="${escapeHtml(artifact.href)}">${escapeHtml(artifact.label)}</a>`;
}

function buildArtifactRow(artifact: ArtifactEntry): string {
  return `<div class="artifact-row">
    <div class="artifact-meta">
      <strong>${escapeHtml(artifact.label)}</strong>
      <span>${escapeHtml(artifact.fileName)}</span>
      ${artifact.note ? `<small>${escapeHtml(artifact.note)}</small>` : ""}
    </div>
    <div class="artifact-actions">
      <span class="status-pill status-${artifact.status} role-${artifact.role}">${escapeHtml(statusLabel(artifact))}</span>
      ${buildSecondaryButton(artifact)}
    </div>
  </div>`;
}

function buildCard(card: LauncherCard): string {
  const primaryArtifact = choosePrimaryArtifact(card.artifacts);
  const secondaryArtifacts = card.artifacts.filter((artifact) => artifact !== primaryArtifact);

  return `<section class="launcher-card ${escapeHtml(card.accentClass)}">
    <div class="card-head">
      <div>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.description)}</p>
      </div>
      <span class="card-summary">${escapeHtml(card.summary)}</span>
    </div>

    ${primaryArtifact ? `<div class="primary-action">
      <div class="primary-copy">
        <span class="primary-label">Primary view</span>
        <strong>${escapeHtml(primaryArtifact.label)}</strong>
        <small>${escapeHtml(primaryArtifact.note ?? primaryArtifact.fileName)}</small>
      </div>
      <div class="primary-actions">
        <span class="status-pill status-${primaryArtifact.status} role-${primaryArtifact.role}">${escapeHtml(statusLabel(primaryArtifact))}</span>
        ${buildPrimaryButton(primaryArtifact)}
      </div>
    </div>` : ""}

    ${secondaryArtifacts.length > 0 ? `<div class="artifact-list">
      ${secondaryArtifacts.map((artifact) => buildArtifactRow(artifact)).join("")}
    </div>` : ""}
    ${card.footerNote ? `<p class="card-footnote">${escapeHtml(card.footerNote)}</p>` : ""}
  </section>`;
}

function buildSection(section: LauncherSection): string {
  return `<section class="launcher-section">
    <div class="section-head">
      <div>
        <p class="section-kicker">${escapeHtml(section.title)}</p>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <p>${escapeHtml(section.description)}</p>
    </div>
    <div class="cards">
      ${section.cards.map((card) => buildCard(card)).join("\n")}
    </div>
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

  const coreCards: LauncherCard[] = [
    {
      title: "Session Grid",
      description: "Session-style overview with tracks kept in Live order.",
      accentClass: "accent-grid",
      artifacts: [
        buildArtifact("session-map-session-grid.html", "Open Session Grid", metadataMap, jsonMtimeMs, "primary"),
      ],
      footerNote: "Generated on export. Best quick read when you want a Session View feel.",
      summary: buildCardSummary([
        buildArtifact("session-map-session-grid.html", "Open Session Grid", metadataMap, jsonMtimeMs, "primary"),
      ]),
    },
    {
      title: "HTML Report",
      description: "Detailed report with tracks, devices, sends and rack summaries.",
      accentClass: "accent-report",
      artifacts: [
        buildArtifact("session-map.html", "Open HTML Report", metadataMap, jsonMtimeMs, "primary"),
      ],
      footerNote: "Generated on export. Best when you want the full readable report.",
      summary: buildCardSummary([
        buildArtifact("session-map.html", "Open HTML Report", metadataMap, jsonMtimeMs, "primary"),
      ]),
    },
  ];

  const mermaidCards: LauncherCard[] = [
    {
      title: "Flow",
      description: "Technical tree of tracks, devices and rack summaries.",
      accentClass: "accent-flow",
      artifacts: [
        buildArtifact("session-map-mermaid-flow.html", "Open Flow HTML", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-flow.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-flow.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-flow.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
      ],
      footerNote: "HTML + .mmd stay current on export. SVG/PNG remain optional manual renders.",
      summary: buildCardSummary([
        buildArtifact("session-map-mermaid-flow.html", "Open Flow HTML", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-flow.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-flow.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-flow.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
      ]),
    },
    {
      title: "Git / Metro",
      description: "Metro-style track/device map.",
      accentClass: "accent-git",
      artifacts: [
        buildArtifact("session-map-mermaid-git.html", "Open Git / Metro HTML", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-git.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-git.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-git.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
      ],
      footerNote: "Stylized metro view of tracks and devices, not an exact audio routing graph.",
      summary: buildCardSummary([
        buildArtifact("session-map-mermaid-git.html", "Open Git / Metro HTML", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-git.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-git.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-git.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
      ]),
    },
    {
      title: "Kanban",
      description: "Session-order columns with devices under each track. External only.",
      accentClass: "accent-kanban",
      artifacts: [
        buildArtifact("session-map-mermaid-kanban.html", "Open Kanban HTML", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-kanban.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-kanban.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-kanban.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
      ],
      footerNote: "Kanban stays fully external and keeps the exact Session View track order.",
      summary: buildCardSummary([
        buildArtifact("session-map-mermaid-kanban.html", "Open Kanban HTML", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-kanban.mmd", "Open .mmd", metadataMap, jsonMtimeMs, "primary"),
        buildArtifact("session-map-kanban.svg", "Open SVG", metadataMap, jsonMtimeMs, "render"),
        buildArtifact("session-map-kanban.png", "Open PNG", metadataMap, jsonMtimeMs, "render"),
      ]),
    },
  ];

  const dataCards: LauncherCard[] = [
    {
      title: "Raw Data",
      description: "Latest JSON export plus direct access to the exports folder.",
      accentClass: "accent-raw",
      artifacts: [
        buildArtifact("session-map.json", "Open session-map.json", metadataMap, jsonMtimeMs, "data"),
        {
          label: "Open exports folder",
          fileName: "exports/",
          href: `file://${exportsDirectory}`,
          status: "current",
          role: "data",
          note: "Open latest files and archives directly from Finder.",
        },
      ],
      footerNote: "Best when you need raw data or archived exports.",
      summary: buildCardSummary([
        buildArtifact("session-map.json", "Open session-map.json", metadataMap, jsonMtimeMs, "data"),
      ]),
    },
    {
      title: "SDK Capability Matrix",
      description: "Separate Live diagnostic about what the SDK exposes.",
      accentClass: "accent-matrix",
      artifacts: [
        buildArtifact("sdk-capability-matrix.html", "Open HTML", metadataMap, jsonMtimeMs, "data"),
        buildArtifact("sdk-capability-matrix.json", "Open JSON", metadataMap, jsonMtimeMs, "data"),
        buildArtifact("sdk-capability-matrix.md", "Open Markdown", metadataMap, jsonMtimeMs, "data"),
      ],
      footerNote: "Refresh from Live with ENABLE_CAPABILITY_MATRIX=true.",
      summary: buildCardSummary([
        buildArtifact("sdk-capability-matrix.html", "Open HTML", metadataMap, jsonMtimeMs, "data"),
        buildArtifact("sdk-capability-matrix.json", "Open JSON", metadataMap, jsonMtimeMs, "data"),
        buildArtifact("sdk-capability-matrix.md", "Open Markdown", metadataMap, jsonMtimeMs, "data"),
      ]),
    },
  ];

  const sections: LauncherSection[] = [
    {
      title: "Core Views",
      description: "The fastest readable views refreshed directly by the Live export workflow.",
      cards: coreCards,
    },
    {
      title: "Mermaid Views",
      description: "Diagram profiles generated from the same stable session-map export.",
      cards: mermaidCards,
    },
    {
      title: "Data / Diagnostics",
      description: "Raw files and SDK diagnostics kept separate from the visual views.",
      cards: dataCards,
    },
  ];

  const allPrimaryArtifacts = [...coreCards, ...mermaidCards]
    .flatMap((card) => card.artifacts)
    .filter((artifact) => artifact.role === "primary");
  const allRenderArtifacts = mermaidCards
    .flatMap((card) => card.artifacts)
    .filter((artifact) => artifact.role === "render");
  const sdkArtifacts = dataCards[1]?.artifacts ?? [];

  const hasOutdatedPrimaryViews = allPrimaryArtifacts.some((artifact) => artifact.status === "outdated");
  const hasMissingPrimaryViews = allPrimaryArtifacts.some((artifact) => artifact.status === "missing");
  const hasOlderManualRenders = allRenderArtifacts.some((artifact) => artifact.status === "outdated");
  const hasMissingManualRenders = allRenderArtifacts.some((artifact) => artifact.status === "missing");
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
      --live-panel: #cdcdcd;
      --live-panel-light: #d8d8d8;
      --live-border: #8f8f8f;
      --live-border-soft: rgba(0,0,0,0.1);
      --live-grid: rgba(0,0,0,0.035);
      --live-text: #202020;
      --live-muted: #5e5e5e;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
      --live-cyan: #3fc2d7;
      --live-magenta: #cb67ba;
      --ok: #407a40;
      --warn: #b67814;
      --neutral: #676767;
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
      padding: 18px;
    }
    .hero, .metrics, .workflow, .launcher-card, .launcher-section {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
      gap: 14px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .eyebrow, .section-kicker {
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
      max-width: 52rem;
      color: var(--live-muted);
      font-size: 13px;
      line-height: 1.55;
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
      line-height: 1.55;
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
      line-height: 1.5;
    }
    .note.is-warning {
      background: rgba(245,166,35,0.14);
      border-color: rgba(182,120,20,0.24);
    }
    .note.is-neutral {
      background: rgba(255,255,255,0.18);
      border-color: rgba(0,0,0,0.08);
    }
    .note.is-matrix {
      background: rgba(73,169,127,0.12);
      border-color: rgba(73,169,127,0.24);
    }
    .note a {
      color: #1f4c73;
      font-weight: 700;
      text-decoration: none;
    }
    .launcher-section {
      margin-top: 12px;
      padding: 14px;
    }
    .section-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(260px, 0.9fr);
      gap: 12px;
      align-items: start;
      margin-bottom: 12px;
    }
    .section-head h2 {
      margin: 0;
      font-size: 18px;
      line-height: 1.15;
    }
    .section-head p {
      margin: 0;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.5;
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
      background: var(--live-panel-light);
    }
    .accent-grid { border-left: 4px solid #8477ff; }
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
    .card-head h3 {
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
      background: rgba(255,255,255,0.22);
      border: 1px solid var(--live-border-soft);
      border-radius: 4px;
      white-space: nowrap;
    }
    .primary-action {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding: 11px 12px;
      border: 1px solid var(--live-border-soft);
      border-radius: 4px;
      background: rgba(255,255,255,0.2);
    }
    .primary-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .primary-copy strong {
      font-size: 13px;
      line-height: 1.25;
    }
    .primary-copy small,
    .primary-label {
      font-size: 11px;
      line-height: 1.4;
      color: var(--live-muted);
    }
    .primary-label {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
    .primary-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: wrap;
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
      border: 1px solid var(--live-border-soft);
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
    .status-current.role-primary,
    .status-current.role-data { color: #1f4d1f; background: rgba(76,141,76,0.18); }
    .status-outdated.role-primary,
    .status-outdated.role-data { color: #8a5600; background: rgba(198,134,25,0.18); }
    .status-missing.role-primary,
    .status-missing.role-data { color: #6f5645; background: rgba(139,111,95,0.18); }
    .status-current.role-render { color: #1e4667; background: rgba(63,194,215,0.16); }
    .status-outdated.role-render { color: #705216; background: rgba(233,195,117,0.18); }
    .status-missing.role-render { color: #676767; background: rgba(120,120,120,0.12); }
    .primary-button,
    .secondary-button {
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
    .primary-button {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-dark));
      border-color: #9a6200;
      color: #181204;
    }
    .secondary-button.is-warning {
      background: linear-gradient(180deg, #ffd48a, #eab255);
      border-color: #a97000;
    }
    .primary-button.is-disabled,
    .secondary-button.is-disabled {
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
      .hero,
      .workflow-grid,
      .section-head {
        grid-template-columns: 1fr;
      }
      .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 720px) {
      .artifact-row,
      .card-head,
      .primary-action,
      .footer {
        display: grid;
        grid-template-columns: 1fr;
      }
      .artifact-actions,
      .primary-actions {
        justify-content: start;
      }
      .metrics {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Session Mapper / External Launcher</p>
        <h1>Session Mapper</h1>
        <p class="subtitle">Live-like external launcher aligned with the integrated modal. HTML and Mermaid source files stay current on export. SVG/PNG remain optional manual renders for sharing, print or static review.</p>
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
          <p class="meta-label">Latest JSON</p>
          <p class="meta-value">${escapeHtml(relativeJsonPath)}</p>
        </div>
      </aside>
    </section>

    <section class="metrics" aria-label="Session metrics">
      ${buildMetricsHtml(sessionMap)}
    </section>

    <section class="workflow">
      <h2>Stable workflow</h2>
      <div class="workflow-grid">
        <div>
          <ol>
            <li>Dans Live : <strong>Export Session Map</strong></li>
            <li>Les vues HTML et Mermaid source sont remises à jour</li>
            <li>Utilise ce launcher pour ouvrir la vue adaptée</li>
          </ol>
        </div>
        <div>
          <ul>
            <li><strong>Current on export:</strong> HTML Report, Session Grid, Mermaid HTML, .mmd</li>
            <li><strong>Manual renders:</strong> SVG/PNG with <strong>npm run export:diagram:all</strong></li>
            <li><strong>SDK Matrix:</strong> separate Live diagnostic, refreshed independently</li>
          </ul>
        </div>
      </div>
      ${hasOutdatedPrimaryViews ? `<div class="note is-warning">Some primary views are older than the latest export and should be refreshed.</div>` : ""}
      ${!hasOutdatedPrimaryViews && !hasMissingPrimaryViews && hasOlderManualRenders ? `<div class="note is-neutral">Primary views are current. Some SVG/PNG files are older manual renders, which is fine unless you need fresh static renders.</div>` : ""}
      ${!hasOutdatedPrimaryViews && !hasMissingPrimaryViews && !hasOlderManualRenders && hasMissingManualRenders ? `<div class="note is-neutral">Primary views are current. Missing SVG/PNG files are optional and can be rendered manually later.</div>` : ""}
      ${hasOutdatedSdkMatrix ? `<div class="note is-matrix">SDK Capability Matrix is a separate diagnostic report and may be older than the latest export. Refresh it from Live with ENABLE_CAPABILITY_MATRIX=true.</div>` : ""}
      <div class="note">
        <strong>Open without CORS issues</strong><br>
        If a Mermaid HTML page does not render from <code>file://</code>: run <strong>npm run serve:exports</strong> then open
        <a href="${localhostLauncherUrl}">${localhostLauncherUrl}</a>
      </div>
    </section>

    ${sections.map((section) => buildSection(section)).join("\n")}

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
