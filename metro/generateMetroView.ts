type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";

export interface MetroDeviceInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  chainsSummary?: { count: number } | null;
  padsSummary?: { count: number } | null;
  category?: string | null;
}

export interface MetroSendInfo {
  id: string;
  index: number;
  name: string;
  value: number | null;
}

export interface MetroTrackInfo {
  id: string;
  index: number;
  name: string;
  kind: TrackKind;
  devices: MetroDeviceInfo[];
  sends: MetroSendInfo[];
}

export interface MetroSessionMap {
  version: string;
  exportedAt: string;
  set: {
    name: string | null;
    tempo: number | null;
  };
  tracks: MetroTrackInfo[];
  returnTracks: MetroTrackInfo[];
  masterTrack: MetroTrackInfo | null;
}

export interface MetroRow {
  track: MetroTrackInfo;
  y: number;
  color: string;
  kindLabel: string;
  label: string;
  summary: string;
  rackCount: number;
}

export interface MetroModel {
  sessionMap: MetroSessionMap;
  rows: MetroRow[];
  width: number;
  height: number;
  startY: number;
  rowHeight: number;
  labelWidth: number;
  lineStartX: number;
  lineEndX: number;
  sinkX: number;
  masterY: number;
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function truncateLabel(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function compactTrackName(track: MetroTrackInfo): string {
  const primaryName = (track.name || `Track ${track.index + 1}`).split("|")[0]?.trim()
    || track.name
    || `Track ${track.index + 1}`;
  return truncateLabel(primaryName.replace(/\s+/g, " ").trim(), 24);
}

function compactDeviceName(device: MetroDeviceInfo): string {
  return truncateLabel(
    (device.name || `Device ${device.index + 1}`)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    18,
  );
}

function isRackDevice(device: MetroDeviceInfo): boolean {
  return (
    device.type.toLowerCase().includes("rack") ||
    Boolean(device.chainsSummary?.count) ||
    Boolean(device.padsSummary?.count)
  );
}

function returnTrackAliases(track: MetroTrackInfo): string[] {
  const aliases = new Set<string>();
  const rawName = (track.name || `Return ${track.index + 1}`).trim();
  const primaryName = rawName.split("|")[0]?.trim() || rawName;
  const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

  aliases.add(normalized(rawName));
  aliases.add(normalized(primaryName));

  const letterMatch = primaryName.match(/^([A-Za-z])\s*[-|]/);
  const letter = letterMatch?.[1];
  if (letter) {
    aliases.add(letter.toLowerCase());
    aliases.add(normalized(`${letter} send`));
    aliases.add(normalized(`send ${letter}`));
  }

  return [...aliases].filter(Boolean);
}

function kindLabel(kind: TrackKind): string {
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
      return "Main";
    default:
      return "Track";
  }
}

function rowColor(kind: TrackKind, index: number): string {
  switch (kind) {
    case "midi":
      return ["#8a7dff", "#b08cff", "#73a9ff", "#7d8fff"][index % 4]!;
    case "audio":
      return ["#66b4ff", "#63d3cf", "#6da2ff", "#59c0ff"][index % 4]!;
    case "return":
      return index % 2 === 0 ? "#3fc2d7" : "#5bc7d8";
    case "master":
      return "#f5a623";
    case "group":
      return "#b78cff";
    default:
      return "#9aa3b2";
  }
}

function deviceBadge(device: MetroDeviceInfo): string | null {
  const category = (device.category ?? "").trim().toUpperCase();
  if (category) {
    return truncateLabel(category, 10);
  }
  if (isRackDevice(device)) return "RACK";
  return null;
}

export function buildMetroModel(sessionMap: MetroSessionMap): MetroModel {
  const orderedTracks: MetroTrackInfo[] = [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];

  const rowHeight = 72;
  const startY = 84;
  const labelWidth = 180;
  const lineStartX = labelWidth + 72;
  const maxDevices = Math.max(1, ...orderedTracks.map((track) => track.devices.length));
  const stationSpacing = 110;
  const lineEndX = lineStartX + 220 + Math.max(0, maxDevices - 1) * stationSpacing;
  const sinkX = lineEndX + 68;
  const width = sinkX + 120;
  const height = Math.max(420, startY + orderedTracks.length * rowHeight + 72);
  const masterY = startY + (orderedTracks.length - 1) * rowHeight;

  const rows = orderedTracks.map((track, index) => {
    const rackCount = track.devices.filter((device) => isRackDevice(device)).length;
    const y = startY + index * rowHeight;
    const summary = `dev:${track.devices.length}${rackCount > 0 ? ` · racks:${rackCount}` : ""}`;

    return {
      track,
      y,
      color: rowColor(track.kind, index),
      kindLabel: kindLabel(track.kind),
      label: compactTrackName(track),
      summary,
      rackCount,
    };
  });

  return {
    sessionMap,
    rows,
    width,
    height,
    startY,
    rowHeight,
    labelWidth,
    lineStartX,
    lineEndX,
    sinkX,
    masterY,
  };
}

export function renderMetroSvg(model: MetroModel): string {
  const returnTargets = new Map<string, { y: number; x: number }>();
  const sendLinks: string[] = [];
  const rows: string[] = [];

  model.rows.forEach((row) => {
    if (row.track.kind !== "return") return;
    const targetX = model.lineStartX + 48;
    returnTrackAliases(row.track).forEach((alias) => {
      returnTargets.set(alias, { y: row.y, x: targetX });
    });
  });

  model.rows.forEach((row) => {
    const { track, y, color } = row;
    const isMaster = track.kind === "master";
    const strokeWidth = isMaster ? 6 : track.kind === "return" ? 4.5 : 4;
    const endCircleRadius = isMaster ? 9 : 6;
    const lineLength = model.lineEndX - model.lineStartX;

    rows.push(`
      <g class="metro-row metro-row-${escapeHtml(track.kind)}">
        <text x="28" y="${y - 8}" class="track-name" fill="#f3f5f8">${escapeHtml(row.label)}</text>
        <text x="28" y="${y + 14}" class="track-meta" fill="#95a1b3">${escapeHtml(`${row.kindLabel} · ${row.summary}`)}</text>
        <line x1="${model.lineStartX}" y1="${y}" x2="${model.lineEndX}" y2="${y}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />
        <circle cx="${model.lineStartX}" cy="${y}" r="${isMaster ? 5 : 4}" fill="${color}" />
    `);

    const summaryStopX = model.lineStartX + 54;

    const deviceStep = track.devices.length > 0 ? Math.min(110, lineLength / (track.devices.length + 2)) : 110;
    track.devices.forEach((device, deviceIndex) => {
      const x = model.lineStartX + 140 + deviceIndex * deviceStep;
      const ringColor = isRackDevice(device) ? "#f2c26a" : "#f5f7fa";
      const badge = deviceBadge(device);
      rows.push(`
        <g class="metro-stop metro-device">
          <circle cx="${x}" cy="${y}" r="8" fill="#0f1318" stroke="${ringColor}" stroke-width="2.1" />
          <text x="${x}" y="${y - 14}" class="stop-caption" fill="#dbe3ed">${escapeHtml(compactDeviceName(device))}</text>
          ${badge ? `<text x="${x}" y="${y + 24}" class="device-badge" fill="${escapeHtml(ringColor)}">${escapeHtml(badge)}</text>` : ""}
        </g>
      `);
    });

    rows.push(`
        <circle cx="${model.lineEndX}" cy="${y}" r="${endCircleRadius}" fill="${color}" />
      </g>
    `);

    if (!isMaster) {
      const trunkStroke = track.kind === "return" ? 2.2 : 2;
      rows.push(`
        <path d="M ${model.lineEndX} ${y} L ${model.sinkX} ${y} L ${model.sinkX} ${model.masterY}" fill="none" stroke="${color}" stroke-width="${trunkStroke}" stroke-linecap="round" stroke-opacity="${track.kind === "return" ? "0.9" : "0.5"}" />
      `);
    } else {
      rows.push(`
        <line x1="${model.lineEndX}" y1="${y}" x2="${model.sinkX}" y2="${y}" stroke="${color}" stroke-width="6" stroke-linecap="round" />
        <circle cx="${model.sinkX}" cy="${y}" r="11" fill="#0f1318" stroke="${color}" stroke-width="4" />
        <text x="${model.sinkX - 6}" y="${y - 18}" class="stop-caption stop-caption-main" fill="#ffd18c">Main sink</text>
      `);
    }

    if (track.kind !== "return" && track.kind !== "master") {
      const sendSourceX = summaryStopX;
      track.sends
        .filter((send) => typeof send.value === "number" && send.value > 0)
        .forEach((send, sendIndex) => {
          const normalized = send.name.trim().toLowerCase().replace(/\s+/g, " ");
          const target =
            returnTargets.get(normalized) ??
            returnTargets.get(normalized.split(" ")[0] ?? "") ??
            null;
          if (!target) return;

          const midX = sendSourceX + 120 + sendIndex * 22;
          const controlY = (y + target.y) / 2;
          sendLinks.push(`
            <path d="M ${sendSourceX} ${y} Q ${midX} ${controlY}, ${target.x} ${target.y}" fill="none" stroke="#7de2f0" stroke-width="1.5" stroke-dasharray="6 5" stroke-linecap="round" stroke-opacity="0.82" />
          `);
        });
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" width="${model.width}" height="${model.height}" role="img" aria-label="Git Metro custom session map">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <style>
        .track-name { font: 700 15px "Avenir Next", "Segoe UI", sans-serif; }
        .track-meta, .stop-caption, .send-label { font: 500 11px "Avenir Next", "Segoe UI", sans-serif; }
        .stop-caption-main { font: 700 12px "Avenir Next", "Segoe UI", sans-serif; }
        .device-badge { font: 700 10px "Avenir Next", "Segoe UI", sans-serif; letter-spacing: 0.08em; text-anchor: middle; }
        .stop-caption, .send-label { text-anchor: middle; }
      </style>
    </defs>
    <rect x="0" y="0" width="${model.width}" height="${model.height}" fill="#0f1318" rx="8" />
    <line x1="${model.sinkX}" y1="${model.startY}" x2="${model.sinkX}" y2="${model.masterY}" stroke="#f5a623" stroke-width="2.5" stroke-opacity="0.35" filter="url(#glow)" />
    ${sendLinks.join("\n")}
    ${rows.join("\n")}
  </svg>`;
}

export function renderMetroHtml(model: MetroModel, paths: {
  mmdFileName: string;
  svgFileName: string;
  pngFileName: string;
}): string {
  const diagramMarkup = renderMetroSvg(model);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ableton Session Mapper — Git / Metro</title>
  <style>
    :root {
      color-scheme: dark;
      --live-bg: #b7b7b7;
      --live-panel: #cbcbcb;
      --live-border: #8f8f8f;
      --live-text: #202020;
      --live-muted: #5e5e5e;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.16), transparent 22%),
        repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 24px),
        var(--live-bg);
      color: var(--live-text);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
    }
    .shell { max-width: 1520px; margin: 0 auto; padding: 18px; }
    .panel {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      margin-bottom: 12px;
      padding: 14px;
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
    h1 { margin: 0; font-size: 22px; line-height: 1.1; }
    .subline {
      margin: 6px 0 0;
      color: var(--live-muted);
      font-size: 13px;
      line-height: 1.45;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    a {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1px solid #8d8d8d;
      background: linear-gradient(180deg, #ededed, #cfcfcf);
      color: #1d1d1d;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .links a:first-child {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-dark));
      border-color: #9a6200;
      color: #111;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .legend, .support { padding: 12px 14px; }
    .legend h2, .support strong {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .legend ul {
      margin: 0;
      padding-left: 18px;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.5;
    }
    .support p {
      margin: 0;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .diagram {
      overflow: auto;
      border: 1px solid #6d6d6d;
      border-radius: 6px;
      background: #0f1318;
      padding: 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .diagram svg {
      width: max-content;
      min-width: 100%;
      height: auto;
      display: block;
    }
    .caption {
      margin-top: 10px;
      color: var(--live-muted);
      font-size: 11px;
    }
    footer { margin-top: 10px; text-align: right; }
    footer a {
      font-size: 11px;
      color: var(--live-muted);
      background: transparent;
      border: 0;
      padding: 0;
      min-height: unset;
      box-shadow: none;
    }
    @media (max-width: 980px) {
      .toolbar, .meta-grid { grid-template-columns: 1fr; }
      .links { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="toolbar panel">
      <div>
        <p class="eyebrow">Session Mapper / Custom Metro</p>
        <h1>Git / Metro</h1>
        <p class="subline">Custom metro-style track/device map.</p>
      </div>
      <div class="links">
        <a href="${escapeHtml(paths.svgFileName)}">Open Custom Metro SVG</a>
        <a href="${escapeHtml(paths.pngFileName)}">Open Custom Metro PNG</a>
        <a href="${escapeHtml(paths.mmdFileName)}">Open Mermaid gitGraph source</a>
      </div>
    </div>

    <section class="meta-grid">
      <article class="legend panel">
        <h2>Reading guide</h2>
        <ul>
          <li>Regular tracks stay above returns, with Main as the final line at the bottom.</li>
          <li>Returns also flow toward Main.</li>
          <li>Git / Metro focuses on tracks and devices. Detailed routing/sends are available in Outputs.</li>
        </ul>
      </article>
      <article class="support panel">
        <strong>Canonical Git / Metro view</strong>
        <p>This custom Metro view is generated from session-map.json.</p>
        <p>The Mermaid .mmd file remains available as a secondary gitGraph export with Mermaid layout limitations.</p>
      </article>
    </section>

    <div class="diagram">
${diagramMarkup}
    </div>
    <p class="caption">This custom Metro view is generated from session-map.json. The Mermaid .mmd file remains available as a secondary gitGraph export with Mermaid layout limitations.</p>
    <footer>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`;
}
