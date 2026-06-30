import { access, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";

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
  tracks: TrackInfo[];
  returnTracks: TrackInfo[];
  masterTrack: TrackInfo | null;
}

interface FileAction {
  label: string;
  fileName: string;
  exists: boolean;
}

interface LauncherCard {
  title: string;
  description: string;
  accentClass: string;
  actions: FileAction[];
  missingHint?: string;
}

export interface GenerateDiagramsIndexOptions {
  jsonPath: string;
  outputPath: string;
  rootDirectory: string;
}

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

function buildActionButton(action: FileAction): string {
  if (!action.exists) {
    return `<span class="action-link is-disabled">${escapeHtml(action.label)}</span>`;
  }

  return `<a class="action-link" href="${escapeHtml(action.fileName)}">${escapeHtml(action.label)}</a>`;
}

function buildMissingState(actions: FileAction[], hint?: string): string {
  const missing = actions.filter((action) => !action.exists);
  if (missing.length === 0) return `<p class="card-status ok">Available now</p>`;

  return `<div class="missing-state">
    <p class="card-status warn">Not generated yet</p>
    <ul>
      ${missing.map((action) => `<li>${escapeHtml(action.label)} not generated yet.</li>`).join("")}
    </ul>
    ${hint ? `<code>${escapeHtml(hint)}</code>` : ""}
  </div>`;
}

function buildCard(card: LauncherCard): string {
  return `<section class="launcher-card ${escapeHtml(card.accentClass)}">
    <div class="card-head">
      <h2>${escapeHtml(card.title)}</h2>
      <p>${escapeHtml(card.description)}</p>
    </div>
    <div class="card-actions">
      ${card.actions.map(buildActionButton).join("")}
    </div>
    ${buildMissingState(card.actions, card.missingHint)}
  </section>`;
}

async function buildCards(rootDirectory: string): Promise<string> {
  const exportsDirectory = resolve(rootDirectory, "exports");
  const allPaths = [
    "session-map-session-grid.html",
    "session-map.html",
    "session-map-mermaid-flow.html",
    "session-map-flow.svg",
    "session-map-flow.png",
    "session-map-flow.mmd",
    "session-map-mermaid-git.html",
    "session-map-git.svg",
    "session-map-git.png",
    "session-map-git.mmd",
    "session-map-mermaid-kanban.html",
    "session-map-kanban.svg",
    "session-map-kanban.png",
    "session-map-kanban.mmd",
    "session-map.json",
    "sdk-capability-matrix.html",
    "sdk-capability-matrix.json",
    "sdk-capability-matrix.md",
  ];

  const existence = new Map<string, boolean>();
  await Promise.all(
    allPaths.map(async (fileName) => {
      existence.set(fileName, await pathExists(resolve(exportsDirectory, fileName)));
    }),
  );

  const cards: LauncherCard[] = [
    {
      title: "Session Grid",
      description: "Vue proche de la Session View Ableton.",
      accentClass: "accent-grid",
      actions: [
        { label: "Open Session Grid", fileName: "session-map-session-grid.html", exists: existence.get("session-map-session-grid.html") === true },
      ],
    },
    {
      title: "HTML Report",
      description: "Rapport détaillé avec pistes, devices, sends et racks.",
      accentClass: "accent-report",
      actions: [
        { label: "Open Report", fileName: "session-map.html", exists: existence.get("session-map.html") === true },
      ],
    },
    {
      title: "Flow",
      description: "Arborescence technique du Live Set.",
      accentClass: "accent-flow",
      actions: [
        { label: "Open HTML", fileName: "session-map-mermaid-flow.html", exists: existence.get("session-map-mermaid-flow.html") === true },
        { label: "Open SVG", fileName: "session-map-flow.svg", exists: existence.get("session-map-flow.svg") === true },
        { label: "Open PNG", fileName: "session-map-flow.png", exists: existence.get("session-map-flow.png") === true },
        { label: "Open .mmd", fileName: "session-map-flow.mmd", exists: existence.get("session-map-flow.mmd") === true },
      ],
      missingHint: "npm run export:diagram:flow",
    },
    {
      title: "Git / Metro",
      description: "Vue métro stylisée des pistes.",
      accentClass: "accent-git",
      actions: [
        { label: "Open HTML", fileName: "session-map-mermaid-git.html", exists: existence.get("session-map-mermaid-git.html") === true },
        { label: "Open SVG", fileName: "session-map-git.svg", exists: existence.get("session-map-git.svg") === true },
        { label: "Open PNG", fileName: "session-map-git.png", exists: existence.get("session-map-git.png") === true },
        { label: "Open .mmd", fileName: "session-map-git.mmd", exists: existence.get("session-map-git.mmd") === true },
      ],
      missingHint: "npm run export:diagram:git",
    },
    {
      title: "Kanban",
      description: "Pistes en colonnes, devices dessous.",
      accentClass: "accent-kanban",
      actions: [
        { label: "Open HTML", fileName: "session-map-mermaid-kanban.html", exists: existence.get("session-map-mermaid-kanban.html") === true },
        { label: "Open SVG", fileName: "session-map-kanban.svg", exists: existence.get("session-map-kanban.svg") === true },
        { label: "Open PNG", fileName: "session-map-kanban.png", exists: existence.get("session-map-kanban.png") === true },
        { label: "Open .mmd", fileName: "session-map-kanban.mmd", exists: existence.get("session-map-kanban.mmd") === true },
      ],
      missingHint: "npm run export:diagram:kanban",
    },
    {
      title: "Raw Data",
      description: "Données exportées et accès rapide au dossier exports.",
      accentClass: "accent-raw",
      actions: [
        { label: "Open JSON", fileName: "session-map.json", exists: existence.get("session-map.json") === true },
        { label: "Open exports folder", fileName: `file://${exportsDirectory}`, exists: true },
      ],
      missingHint: "npm run export:diagram:all",
    },
    {
      title: "SDK Capability Matrix",
      description: "Diagnostic dev des capacités réellement exposées par le SDK.",
      accentClass: "accent-report",
      actions: [
        { label: "Open HTML", fileName: "sdk-capability-matrix.html", exists: existence.get("sdk-capability-matrix.html") === true },
        { label: "Open JSON", fileName: "sdk-capability-matrix.json", exists: existence.get("sdk-capability-matrix.json") === true },
        { label: "Open Markdown", fileName: "sdk-capability-matrix.md", exists: existence.get("sdk-capability-matrix.md") === true },
      ],
      missingHint: "ENABLE_CAPABILITY_MATRIX=true npm start",
    },
  ];

  return cards.map(buildCard).join("\n");
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
  const cards = await buildCards(options.rootDirectory);
  const metrics = buildMetricsHtml(sessionMap);
  const outputDirectory = dirname(options.outputPath);
  const exportsDirectory = resolve(options.rootDirectory, "exports");
  const relativeJsonPath = relative(outputDirectory, options.jsonPath) || basename(options.jsonPath);
  const projectName = sessionMap.set.name?.trim() || "Ableton Live Set";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Ableton Session Mapper — Visual Launcher</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #090d12;
      --panel: rgba(18, 24, 32, 0.92);
      --panel-2: rgba(14, 18, 24, 0.88);
      --line: rgba(255,255,255,0.08);
      --text: #f5f7fa;
      --muted: #8e99aa;
      --accent: #f5a623;
      --accent-blue: #5aa4ff;
      --accent-cyan: #46d7ff;
      --accent-violet: #9181ff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        radial-gradient(circle at top left, rgba(245,166,35,0.14), transparent 30%),
        radial-gradient(circle at top right, rgba(90,164,255,0.12), transparent 28%),
        linear-gradient(180deg, #0d1219, #090d12 28%, #070a0e);
      font-family: "Avenir Next", "SF Pro Display", "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 1320px;
      margin: 0 auto;
      padding: 28px 20px 40px;
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
      gap: 18px;
      align-items: stretch;
      margin-bottom: 18px;
    }
    .hero-main,
    .hero-side,
    .workflow,
    .launcher-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: 0 20px 48px rgba(0,0,0,0.26);
    }
    .hero-main {
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    .hero-main::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(120deg, rgba(245,166,35,0.14), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,0.03), transparent 60%);
      pointer-events: none;
    }
    .eyebrow {
      margin: 0 0 10px;
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
    }
    h1 {
      margin: 0;
      font-size: clamp(34px, 6vw, 58px);
      line-height: 0.95;
      letter-spacing: -0.04em;
    }
    .subtitle {
      margin: 14px 0 0;
      max-width: 38rem;
      color: #d1d8e2;
      font-size: 17px;
      line-height: 1.55;
    }
    .hero-side {
      padding: 20px;
      background: var(--panel-2);
      display: grid;
      gap: 14px;
      align-content: start;
    }
    .meta-label {
      margin: 0 0 5px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .meta-value {
      margin: 0;
      font-size: 15px;
      line-height: 1.45;
      color: var(--text);
      word-break: break-word;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .metric {
      padding: 16px;
      border-radius: 18px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.03);
    }
    .metric strong {
      display: block;
      margin-bottom: 4px;
      font-size: 28px;
      line-height: 1;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    .workflow {
      margin-bottom: 18px;
      padding: 20px 22px;
      background:
        linear-gradient(90deg, rgba(245,166,35,0.12), rgba(255,255,255,0.02));
    }
    .workflow h2 {
      margin: 0 0 10px;
      font-size: 18px;
    }
    .workflow ol {
      margin: 0;
      padding-left: 18px;
      color: #e2e8f0;
      line-height: 1.8;
    }
    .workflow code,
    .missing-state code {
      display: inline-block;
      margin-top: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      color: #f8fafc;
      font-family: "SFMono-Regular", "JetBrains Mono", monospace;
      font-size: 12px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .launcher-card {
      padding: 18px;
      position: relative;
      overflow: hidden;
    }
    .launcher-card::before {
      content: "";
      position: absolute;
      inset: 0;
      opacity: 0.8;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(255,255,255,0.05), transparent 36%);
    }
    .accent-grid { box-shadow: inset 0 0 0 1px rgba(145,129,255,0.14), 0 20px 48px rgba(0,0,0,0.26); }
    .accent-report { box-shadow: inset 0 0 0 1px rgba(245,166,35,0.14), 0 20px 48px rgba(0,0,0,0.26); }
    .accent-flow { box-shadow: inset 0 0 0 1px rgba(90,164,255,0.14), 0 20px 48px rgba(0,0,0,0.26); }
    .accent-git { box-shadow: inset 0 0 0 1px rgba(70,215,255,0.14), 0 20px 48px rgba(0,0,0,0.26); }
    .accent-kanban { box-shadow: inset 0 0 0 1px rgba(145,129,255,0.14), 0 20px 48px rgba(0,0,0,0.26); }
    .accent-raw { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 20px 48px rgba(0,0,0,0.26); }
    .card-head h2 {
      margin: 0 0 8px;
      font-size: 20px;
    }
    .card-head p {
      margin: 0;
      color: #c5ced9;
      line-height: 1.55;
      min-height: 48px;
    }
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
      margin-bottom: 14px;
      position: relative;
      z-index: 1;
    }
    .action-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid rgba(245,166,35,0.24);
      background: rgba(245,166,35,0.08);
      color: #f5f7fa;
      text-decoration: none;
      font-size: 14px;
      transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
    }
    .action-link:hover {
      transform: translateY(-1px);
      background: rgba(245,166,35,0.15);
      border-color: rgba(245,166,35,0.42);
    }
    .action-link.is-disabled {
      opacity: 0.42;
      cursor: not-allowed;
      background: rgba(255,255,255,0.04);
      border-color: rgba(255,255,255,0.08);
    }
    .card-status {
      margin: 0;
      font-size: 13px;
      letter-spacing: 0.03em;
    }
    .card-status.ok { color: #97f0b2; }
    .card-status.warn { color: #ffd389; }
    .missing-state ul {
      margin: 8px 0 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.7;
      font-size: 13px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-top: 22px;
      color: var(--muted);
      font-size: 12px;
    }
    .footer a {
      color: #7f8da3;
      text-decoration: none;
    }
    .footer a:hover {
      color: var(--accent);
    }
    @media (max-width: 960px) {
      .hero {
        grid-template-columns: 1fr;
      }
      .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 640px) {
      .shell {
        padding-inline: 14px;
      }
      .metrics {
        grid-template-columns: 1fr 1fr;
      }
      .footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div class="hero-main">
        <p class="eyebrow">Ableton Session Mapper / v0.7.4</p>
        <h1>Ableton Session Mapper</h1>
        <p class="subtitle">Choose a visualization. This launcher stays external to Ableton, keeps the stable export path, and gives you a clean entry point to Session Grid, Report, Flow, Git / Metro, Kanban, and raw data.</p>
      </div>
      <aside class="hero-side">
        <div>
          <p class="meta-label">Set name</p>
          <p class="meta-value">${escapeHtml(projectName)}</p>
        </div>
        <div>
          <p class="meta-label">Exported at</p>
          <p class="meta-value">${escapeHtml(formatExportDate(sessionMap.exportedAt))}</p>
        </div>
        <div>
          <p class="meta-label">Tempo</p>
          <p class="meta-value">${sessionMap.set.tempo !== null ? `${escapeHtml(String(sessionMap.set.tempo))} BPM` : "Unavailable"}</p>
        </div>
        <div>
          <p class="meta-label">Current JSON</p>
          <p class="meta-value">${escapeHtml(relativeJsonPath)}</p>
        </div>
      </aside>
    </section>

    <section class="metrics" aria-label="Session metrics">
      ${metrics}
    </section>

    <section class="workflow">
      <h2>Recommended workflow</h2>
      <ol>
        <li>Depuis Ableton : <strong>Export Session Map</strong></li>
        <li>Pour générer les diagrammes : <strong>npm run export:diagram:all</strong></li>
        <li>Pour rouvrir ce launcher : <strong>npm run open:diagrams</strong></li>
      </ol>
    </section>

    <section class="cards" aria-label="Visualization launcher">
      ${cards}
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
