import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";

interface RoutingInfo {
  type: string | null;
  channel: string | null;
}

interface TrackRoutingInfo {
  source: "sdk" | "manual" | "none";
  audioFrom: string | null;
  audioTo: string | null;
  midiFrom: string | null;
  midiTo: string | null;
  monitor: string | null;
  group: string | null;
  notes: string;
}

interface ManualRoutingConnection {
  from: string;
  to: string;
  type: "audio" | "midi" | "sidechain" | "unknown";
  label: string;
}

interface ManualRoutingState {
  status: "missing" | "loaded" | "invalid";
  sourcePath: string;
  warnings: string[];
  tracks: Record<string, unknown>;
  sidechains: Array<unknown>;
  connections: ManualRoutingConnection[];
}

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
  enabled?: boolean | null;
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
  color?: string | null;
  input?: RoutingInfo | null;
  output?: RoutingInfo | null;
  routing?: TrackRoutingInfo;
  devices: DeviceInfo[];
  sends: SendInfo[];
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
  manualRouting?: ManualRoutingState;
}

interface OutputPaths {
  latestPath: string;
  archivePath: string;
}

const gridDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(gridDirectory, "..");

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const jsonPath = resolve(argumentValue("--json") ?? resolve(rootDirectory, "exports/session-map.json"));
const latestOutputPath = resolve(
  argumentValue("--output") ?? resolve(rootDirectory, "exports/session-map-session-grid.html"),
);
const logPrefix = "[session-grid]";

function logPath(path: string): string {
  const rel = relative(rootDirectory, path);
  return rel && !rel.startsWith("..") ? rel : path;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
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

function buildArchiveBaseName(sessionMap: SessionMap): string {
  const setName = sanitizeFileToken(sessionMap.set.name);
  return setName ? `${setName}_Session-Grid` : "Ableton-Session-Grid";
}

async function resolveOutputPaths(sessionMap: SessionMap): Promise<OutputPaths> {
  const outputDirectory = dirname(latestOutputPath);
  await mkdir(outputDirectory, { recursive: true });

  const baseName = buildArchiveBaseName(sessionMap);
  const minuteStamp = formatArchiveTimestamp(sessionMap.exportedAt, false);
  const secondStamp = formatArchiveTimestamp(sessionMap.exportedAt, true);
  const candidates = [`${baseName}_${minuteStamp}`, `${baseName}_${secondStamp}`];

  for (const candidate of candidates) {
    const archivePath = join(outputDirectory, `${candidate}.html`);
    if (!(await pathExists(archivePath))) {
      return { latestPath: latestOutputPath, archivePath };
    }
  }

  let suffix = 2;
  while (suffix < 10_000) {
    const archivePath = join(outputDirectory, `${baseName}_${secondStamp}-${suffix}.html`);
    if (!(await pathExists(archivePath))) {
      return { latestPath: latestOutputPath, archivePath };
    }
    suffix += 1;
  }

  throw new Error("Unable to reserve a unique session-grid archive filename.");
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function truncate(value: string, maxLength: number): string {
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}

function shortTrackTitle(track: TrackInfo): string {
  const rawName = track.name?.trim() || `Track ${track.index + 1}`;
  const primary = rawName.split("|")[0]?.trim() || rawName;
  return truncate(primary, 22);
}

function trackKindLabel(kind: TrackKind): string {
  switch (kind) {
    case "midi":
      return "MIDI";
    case "audio":
      return "Audio";
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

function trackPillLabel(kind: TrackKind): string {
  switch (kind) {
    case "midi":
      return "MIDI Track";
    case "audio":
      return "Audio Track";
    case "group":
      return "Group Track";
    case "return":
      return "Return";
    case "master":
      return "Master";
    default:
      return "Track";
  }
}

function trackClassName(kind: TrackKind): string {
  switch (kind) {
    case "midi":
      return "kind-midi";
    case "audio":
      return "kind-audio";
    case "group":
      return "kind-group";
    case "return":
      return "kind-return";
    case "master":
      return "kind-master";
    default:
      return "kind-unknown";
  }
}

function routingText(routing: RoutingInfo | null | undefined): string {
  const parts = [routing?.type, routing?.channel].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Routing I/O non disponible dans cette version du SDK";
}

function manualRoutingText(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value.trim() : "—";
}

function isRackLike(device: DeviceInfo): boolean {
  return (
    device.type.toLowerCase().includes("rack") ||
    Boolean(device.chainsSummary?.count) ||
    Boolean(device.padsSummary?.count)
  );
}

function deviceLabel(device: DeviceInfo): string {
  return escapeHtml(device.name?.trim() || `Device ${device.index + 1}`);
}

function sectionMarker(track: TrackInfo): string {
  if (track.kind === "return") return `<span class="section-marker">RETURNS</span>`;
  if (track.kind === "master") return `<span class="section-marker">MASTER</span>`;
  return "";
}

function accentStyle(track: TrackInfo): string {
  const raw = track.color?.trim();
  const hex = raw && /^#?[0-9a-fA-F]{6}$/.test(raw) ? (raw.startsWith("#") ? raw : `#${raw}`) : null;
  return hex ? ` style="--track-accent:${escapeHtml(hex)}"` : "";
}

function renderStructureSummary(label: "chains" | "pads", summary: StructureSummary | null | undefined): string {
  if (!summary || summary.count <= 0) return "";
  const items = summary.items.slice(0, 6).map((item) => {
    const note = item.receivingNote ?? item.note;
    const meta = [
      note !== null ? `note ${note}` : null,
      item.deviceCount !== null ? `dev:${item.deviceCount}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return `<li><span>${escapeHtml(item.name || `${label} ${item.index + 1}`)}</span>${meta ? `<small>${escapeHtml(meta)}</small>` : ""}</li>`;
  });
  const extra = summary.count > summary.items.length ? `<li><span>+${summary.count - summary.items.length} more</span></li>` : "";
  return `<div class="device-structure">
    <div class="structure-title">${label === "chains" ? "Chains" : "Pads"} · ${summary.count}</div>
    <ul>${items.join("")}${extra}</ul>
  </div>`;
}

function renderDevice(device: DeviceInfo): string {
  const rackLike = isRackLike(device);
  const status = device.enabled === false ? "disabled" : "active";
  const chips = [
    `<span>${escapeHtml(rackLike ? "Rack" : device.type || "Device")}</span>`,
    device.chainsSummary?.count ? `<span>chains:${device.chainsSummary.count}</span>` : "",
    device.padsSummary?.count ? `<span>pads:${device.padsSummary.count}</span>` : "",
    device.enabled === false ? `<span>disabled</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<article class="device-card ${rackLike ? "is-rack" : "is-device"} ${status}">
    <div class="device-head">
      <h3 title="${escapeHtml(device.name || "")}">${deviceLabel(device)}</h3>
      <div class="device-chips">${chips}</div>
    </div>
    ${renderStructureSummary("chains", device.chainsSummary)}
    ${renderStructureSummary("pads", device.padsSummary)}
  </article>`;
}

function renderTrack(track: TrackInfo, sessionMap: SessionMap): string {
  const rackCount = track.devices.filter((device) => isRackLike(device)).length;
  const manualRouting = track.routing;
  const manualConnections = (sessionMap.manualRouting?.connections ?? []).filter(
    (connection) => connection.from === track.name || connection.to === track.name,
  );
  const deviceCards = track.devices.length
    ? track.devices.map(renderDevice).join("")
    : `<div class="empty-state">No devices on this track.</div>`;

  return `<section class="track-column ${trackClassName(track.kind)}"${accentStyle(track)}>
    <div class="track-header">
      <div class="track-header-top">
        ${sectionMarker(track)}
        <span class="track-pill">${escapeHtml(trackPillLabel(track.kind))}</span>
      </div>
      <h2 title="${escapeHtml(track.name || "")}">${escapeHtml(shortTrackTitle(track))}</h2>
      <p class="track-subtitle">${escapeHtml(track.name || `Track ${track.index + 1}`)}</p>
      <div class="track-stats">
        <span>#${track.index + 1}</span>
        <span>${escapeHtml(trackKindLabel(track.kind))}</span>
        <span>dev:${track.devices.length}</span>
        <span>sends:${track.sends.length}</span>
        ${rackCount > 0 ? `<span>racks:${rackCount}</span>` : ""}
        ${manualRouting?.source === "manual" ? `<span>MANUAL</span>` : ""}
      </div>
    </div>
    <div class="track-routing">
      <div><strong>In</strong><span>${escapeHtml(routingText(track.input))}</span></div>
      <div><strong>Out</strong><span>${escapeHtml(routingText(track.output))}</span></div>
    </div>
    ${
      manualRouting?.source === "manual"
        ? `<div class="track-routing manual-routing">
            <div><strong>MIDI From</strong><span>${escapeHtml(manualRoutingText(manualRouting.midiFrom))}</span></div>
            <div><strong>MIDI To</strong><span>${escapeHtml(manualRoutingText(manualRouting.midiTo))}</span></div>
            <div><strong>Audio From</strong><span>${escapeHtml(manualRoutingText(manualRouting.audioFrom))}</span></div>
            <div><strong>Audio To</strong><span>${escapeHtml(manualRoutingText(manualRouting.audioTo))}</span></div>
            <div><strong>Monitor</strong><span>${escapeHtml(manualRoutingText(manualRouting.monitor))}</span></div>
            <div><strong>Source</strong><span>MANUAL</span></div>
          </div>`
        : ""
    }
    <div class="device-stack">
      ${deviceCards}
    </div>
    <div class="track-footer">
      <div class="footer-row"><strong>Sends</strong><span>${track.sends.length ? escapeHtml(track.sends.map((send) => send.name).join(", ")) : "None"}</span></div>
      ${
        manualConnections.length
          ? `<div class="footer-row"><strong>Manual Connections</strong><span>${escapeHtml(manualConnections.map((connection) => `${connection.from} → ${connection.to}${connection.label ? ` · ${connection.label}` : ""}`).join(" | "))}</span></div>`
          : ""
      }
    </div>
  </section>`;
}

function renderTemplate(sessionMap: SessionMap): string {
  const orderedTracks: TrackInfo[] = [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];
  const deviceCount = orderedTracks.reduce((sum, track) => sum + track.devices.length, 0);
  const sendCount = orderedTracks.reduce((sum, track) => sum + track.sends.length, 0);
  const columns = orderedTracks.map((track) => renderTrack(track, sessionMap)).join("\n");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Ableton Session Mapper — Session Grid</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b0f14;
      --panel: #11161d;
      --panel-2: #171d26;
      --text: #f3f5f7;
      --muted: #94a3b8;
      --line: rgba(255,255,255,0.09);
      --accent: #f5a623;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(245,166,35,0.06), transparent 18%),
        radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 40%),
        var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .shell {
      max-width: 100%;
      padding: 24px 20px 28px;
    }
    .masthead {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 18px;
    }
    .eyebrow {
      margin: 0 0 6px;
      color: var(--accent);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-size: 12px;
    }
    h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.05;
    }
    .meta {
      color: var(--muted);
      font-size: 14px;
      text-align: right;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .metric {
      background: rgba(17, 22, 29, 0.88);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
      margin-bottom: 4px;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: rgba(12, 16, 22, 0.88);
      padding: 16px;
      overflow-x: auto;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .session-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(250px, 280px);
      gap: 14px;
      align-items: start;
      min-width: max-content;
    }
    .track-column {
      --track-accent: #667085;
      background: linear-gradient(180deg, color-mix(in srgb, var(--track-accent) 18%, #10151c 82%), rgba(16, 21, 28, 0.96));
      border: 1px solid color-mix(in srgb, var(--track-accent) 45%, rgba(255,255,255,0.12));
      border-radius: 18px;
      padding: 12px;
      min-height: 520px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 14px 32px rgba(0,0,0,0.22);
    }
    .kind-midi { --track-accent: #8b7dff; }
    .kind-audio { --track-accent: #5f96ff; }
    .kind-group { --track-accent: #ad7fff; }
    .kind-return { --track-accent: #35c9f2; }
    .kind-master { --track-accent: #f5a623; }
    .kind-unknown { --track-accent: #7b8598; }
    .track-header {
      border-radius: 14px;
      padding: 12px;
      background: rgba(255,255,255,0.035);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .track-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .section-marker,
    .track-pill,
    .track-stats span,
    .device-chips span,
    .structure-title {
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
    }
    .section-marker,
    .track-pill {
      padding: 4px 8px;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .section-marker {
      color: var(--accent);
      border-color: rgba(245,166,35,0.28);
      background: rgba(245,166,35,0.10);
    }
    .track-pill {
      color: #e5e7eb;
    }
    .track-header h2 {
      margin: 0;
      font-size: 21px;
      line-height: 1.05;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .track-subtitle {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 13px;
      min-height: 18px;
    }
    .track-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
    }
    .track-stats span,
    .device-chips span,
    .structure-title {
      padding: 4px 8px;
      font-size: 11px;
      color: #e5e7eb;
    }
    .track-routing,
    .track-footer,
    .device-card {
      border-radius: 14px;
      background: rgba(9, 13, 19, 0.68);
      border: 1px solid rgba(255,255,255,0.07);
    }
    .track-routing {
      padding: 10px 12px;
      display: grid;
      gap: 10px;
    }
    .manual-routing {
      border-color: rgba(245,166,35,0.18);
      background: rgba(245,166,35,0.06);
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .track-routing div,
    .footer-row {
      display: grid;
      gap: 4px;
    }
    .track-routing strong,
    .footer-row strong {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .track-routing span,
    .footer-row span {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }
    .device-stack {
      display: grid;
      gap: 10px;
      flex: 1 1 auto;
    }
    .device-card {
      padding: 12px;
    }
    .device-card.is-rack {
      border-color: rgba(245,166,35,0.22);
      background: linear-gradient(180deg, rgba(245,166,35,0.08), rgba(9,13,19,0.75));
    }
    .device-card.disabled {
      opacity: 0.65;
    }
    .device-head h3 {
      margin: 0 0 10px;
      font-size: 15px;
      line-height: 1.3;
    }
    .device-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .device-structure {
      margin-top: 10px;
    }
    .device-structure ul {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: grid;
      gap: 7px;
    }
    .device-structure li {
      padding: 8px 9px;
      border-radius: 10px;
      background: rgba(255,255,255,0.035);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .device-structure li span {
      display: block;
      font-size: 13px;
      line-height: 1.3;
    }
    .device-structure li small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 11px;
    }
    .track-footer {
      padding: 10px 12px;
    }
    .empty-state {
      min-height: 96px;
      display: grid;
      place-items: center;
      text-align: center;
      color: var(--muted);
      border-radius: 14px;
      border: 1px dashed rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.025);
      padding: 16px;
    }
    footer {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      color: var(--muted);
      font-size: 12px;
    }
    footer a {
      color: #7c8799;
      text-decoration: none;
    }
    footer a:hover {
      color: var(--accent);
    }
    @media (max-width: 900px) {
      .metrics {
        grid-template-columns: repeat(2, minmax(120px, 1fr));
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="masthead">
      <div>
        <p class="eyebrow">Ableton Session Mapper / Session Grid</p>
        <h1>${escapeHtml(sessionMap.set.name || "Ableton Live Set")}</h1>
      </div>
      <div class="meta">
        <div>JSON ${escapeHtml(sessionMap.version)}</div>
        <div>${sessionMap.set.tempo !== null ? `${escapeHtml(String(sessionMap.set.tempo))} BPM` : "Tempo unavailable"}</div>
        <div>${escapeHtml(new Date(sessionMap.exportedAt).toLocaleString("fr-FR"))}</div>
      </div>
    </header>

    <section class="metrics" aria-label="Session summary">
      <article class="metric"><strong>${orderedTracks.length}</strong><span>Total tracks shown</span></article>
      <article class="metric"><strong>${sessionMap.tracks.length}</strong><span>Main tracks in set order</span></article>
      <article class="metric"><strong>${deviceCount}</strong><span>Devices</span></article>
      <article class="metric"><strong>${sendCount}</strong><span>Sends</span></article>
    </section>

    <section class="frame" aria-label="Ableton-like session grid">
      <div class="session-grid">
        ${columns}
      </div>
    </section>

    <footer>
      <span>External HTML only. No Ableton WebView used.</span>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`;
}

async function main(): Promise<void> {
  console.log(`${logPrefix} Read JSON started: ${logPath(jsonPath)}`);
  const json = await readFile(jsonPath, "utf8");
  console.log(`${logPrefix} Read JSON completed`);
  const sessionMap = JSON.parse(json) as SessionMap;
  const outputPaths = await resolveOutputPaths(sessionMap);

  console.log(`${logPrefix} Generate Session Grid started`);
  const html = renderTemplate(sessionMap);
  await writeFile(outputPaths.latestPath, html, "utf8");
  await writeFile(outputPaths.archivePath, html, "utf8");
  console.log(`${logPrefix} Write Session Grid latest completed: ${logPath(outputPaths.latestPath)}`);
  console.log(`${logPrefix} Write Session Grid archive completed: ${logPath(outputPaths.archivePath)}`);
  console.log(`${logPrefix} Generate Session Grid completed`);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`${logPrefix} Generation failed: ${detail}`);
  process.exitCode = 1;
});
