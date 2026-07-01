import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { writeDiagramsIndex } from "../launcher/diagramsIndexTemplate.js";
import { buildMetroModel, renderMetroHtml, renderMetroSvg, type MetroSessionMap } from "../metro/generateMetroView.js";

const execFileAsync = promisify(execFile);

type MermaidProfile = "flow" | "git" | "kanban";

type TrackKind = "audio" | "midi" | "group" | "return" | "master" | "unknown";

interface DeviceInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  chainsSummary?: { count: number } | null;
  padsSummary?: { count: number } | null;
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
}

interface RenderPaths {
  latestMmdPath: string;
  archiveMmdPath: string;
  latestSvgPath: string;
  archiveSvgPath: string;
  latestPngPath: string;
  archivePngPath: string;
  latestHtmlPath: string;
}

const mermaidDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(mermaidDirectory, "..");

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const profile = (argumentValue("--profile") as MermaidProfile | undefined) ?? "flow";
const profileFileSuffix = argumentValue("--file-suffix") ?? "";
const latestMmdPath = resolve(
  argumentValue("--input") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.mmd"
        : profile === "kanban"
          ? "exports/session-map-kanban.mmd"
          : "exports/session-map.mmd",
    ),
);
const latestSvgPath = resolve(
  argumentValue("--svg") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.svg"
        : profile === "kanban"
          ? "exports/session-map-kanban.svg"
          : "exports/session-map.svg",
    ),
);
const latestPngPath = resolve(
  argumentValue("--png") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.png"
        : profile === "kanban"
          ? "exports/session-map-kanban.png"
          : "exports/session-map.png",
    ),
);
const latestHtmlPath = resolve(
  argumentValue("--html") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-mermaid-git.html"
        : profile === "kanban"
          ? "exports/session-map-mermaid-kanban.html"
          : "exports/session-map-mermaid.html",
    ),
);
const mermaidCliPath = resolve(rootDirectory, "node_modules/@mermaid-js/mermaid-cli/src/cli.js");
const mermaidConfigPath = resolve(rootDirectory, "mermaid/mermaid.config.json");
const rsvgConvertPath = "/opt/homebrew/bin/rsvg-convert";
const sipsPath = "/usr/bin/sips";
const logPrefix = profileFileSuffix
  ? `[mermaid:${profileFileSuffix}]`
  : profile === "flow"
    ? "[mermaid]"
    : `[mermaid:${profile}]`;

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

async function deriveArchiveMmdPath(outputDirectory: string): Promise<string> {
  const latestMermaid = await readFile(latestMmdPath, "utf8");
  const entries = await readdir(outputDirectory);
  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".mmd") && entry !== basename(latestMmdPath))
      .map(async (entry) => {
        const fullPath = join(outputDirectory, entry);
        const metadata = await stat(fullPath);
        return { fullPath, mtimeMs: metadata.mtimeMs };
      }),
  );

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const candidate of candidates) {
    const archivedMermaid = await readFile(candidate.fullPath, "utf8");
    if (archivedMermaid === latestMermaid) {
      return candidate.fullPath;
    }
  }

  throw new Error(
    `Unable to match ${logPath(latestMmdPath)} to an archived .mmd export. Run the corresponding generate:mermaid command first.`,
  );
}

async function resolveRenderPaths(): Promise<RenderPaths> {
  const outputDirectory = dirname(latestMmdPath);
  await mkdir(outputDirectory, { recursive: true });
  const archiveMmdPath = await deriveArchiveMmdPath(outputDirectory);
  const archiveStem = archiveMmdPath.replace(/\.mmd$/i, "");

  return {
    latestMmdPath,
    archiveMmdPath,
    latestSvgPath,
    archiveSvgPath: `${archiveStem}.svg`,
    latestPngPath,
    archivePngPath: `${archiveStem}.png`,
    latestHtmlPath,
  };
}

async function ensureRendererInstalled(): Promise<void> {
  if (profile === "git") {
    if ((await pathExists(rsvgConvertPath)) || (await pathExists(sipsPath))) {
      return;
    }
    throw new Error(
      "Custom Metro PNG conversion is unavailable. Install librsvg (`rsvg-convert`) or use macOS `sips`.",
    );
  }

  if (!(await pathExists(mermaidCliPath))) {
    throw new Error(
      "Mermaid CLI is not installed. Run `npm install` at the project root, then retry the render command.",
    );
  }
  if (!(await pathExists(mermaidConfigPath))) {
    throw new Error(
      "Missing Mermaid config file at mermaid/mermaid.config.json.",
    );
  }
}

async function renderSvgToPng(inputPath: string, outputPath: string): Promise<void> {
  if (await pathExists(rsvgConvertPath)) {
    await execFileAsync(
      rsvgConvertPath,
      ["--format", "png", "--output", outputPath, inputPath],
      { cwd: rootDirectory },
    );
    return;
  }

  if (await pathExists(sipsPath)) {
    await execFileAsync(
      sipsPath,
      ["-s", "format", "png", inputPath, "--out", outputPath],
      { cwd: rootDirectory },
    );
    return;
  }

  throw new Error("No SVG to PNG converter available for the custom Metro renderer.");
}

async function renderWithMermaidCli(
  inputPath: string,
  outputPath: string,
  format: "svg" | "png",
): Promise<void> {
  const width = profile === "kanban" ? "4200" : profile === "git" ? "4400" : "3200";
  const height = profile === "kanban" ? "2400" : profile === "git" ? "2800" : "2200";
  const scale = profile === "kanban" ? "3.2" : profile === "git" ? "3.4" : "3";
  await execFileAsync(
    process.execPath,
    [
      mermaidCliPath,
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--outputFormat",
      format,
      "--configFile",
      mermaidConfigPath,
      "--backgroundColor",
      "#0b0f17",
      "--width",
      width,
      "--height",
      height,
      "--scale",
      scale,
      "--quiet",
    ],
    { cwd: rootDirectory },
  );
}

function htmlTitle(): string {
  return profileFileSuffix
    ? `Ableton Session Mapper — Mermaid ${profileFileSuffix.toUpperCase()}`
    : profile === "git"
      ? "Ableton Session Mapper — Mermaid Git"
      : profile === "kanban"
        ? "Ableton Session Mapper — Mermaid Kanban"
        : "Ableton Session Mapper — Mermaid Diagram";
}

function relativeName(path: string): string {
  return basename(path);
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

function compactTrackName(track: TrackInfo): string {
  const primaryName = (track.name || `Track ${track.index + 1}`).split("|")[0]?.trim()
    || track.name
    || `Track ${track.index + 1}`;
  return truncateLabel(primaryName.replace(/\s+/g, " ").trim(), 24);
}

function compactDeviceName(device: DeviceInfo): string {
  return truncateLabel(
    (device.name || `Device ${device.index + 1}`)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
    18,
  );
}

function isRackDevice(device: DeviceInfo): boolean {
  return (
    device.type.toLowerCase().includes("rack") ||
    Boolean(device.chainsSummary?.count) ||
    Boolean(device.padsSummary?.count)
  );
}

function returnTrackAliases(track: TrackInfo): string[] {
  const aliases = new Set<string>();
  const rawName = (track.name || `Return ${track.index + 1}`).trim();
  const primaryName = rawName.split("|")[0]?.trim() || rawName;
  const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

  aliases.add(normalized(rawName));
  aliases.add(normalized(primaryName));

  const letterMatch = primaryName.match(/^([A-Za-z])\s*[-|]/);
  if (letterMatch) {
    aliases.add(letterMatch[1].toLowerCase());
    aliases.add(normalized(`${letterMatch[1]} send`));
    aliases.add(normalized(`send ${letterMatch[1]}`));
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

function profileDescription(): string {
  switch (profile) {
    case "git":
      return "Metro-style track/device map generated from the latest session-map.json.";
    case "kanban":
      return "Session-style kanban generated from the latest session-map.json.";
    default:
      return "Technical flow generated from the latest session-map.json.";
  }
}

function profileLegendTitle(): string {
  switch (profile) {
    case "git":
      return "Reading guide";
    default:
      return "Reading guide";
  }
}

function profileLegendItems(): string[] {
  switch (profile) {
    case "git":
      return [
        "Git / Metro is a stylized track/device map, not an exact audio routing graph.",
        "Each branch acts like a metro line for one track or return.",
        "Devices appear as stations along the line, with short summary stops like sends or racks when useful.",
      ];
    case "kanban":
      return [
        "Columns follow the exact Session View track order.",
        "Devices stay under their owning track.",
        "Returns come after regular tracks, then Main.",
      ];
    default:
      return [
        "Tracks, devices and rack summaries are shown as a technical tree.",
        "Chains and pads stay summarized to preserve the ultra-safe export.",
      ];
  }
}

function buildProfileEnhancerScript(): string {
  if (profile !== "kanban") {
    return "";
  }

  return `
    <script>
      (() => {
        const styleMap = {
          "track-midi": { fill: "#1d2436", stroke: "#8b7dff", text: "#eef2ff" },
          "track-audio": { fill: "#1d2630", stroke: "#6ba7ff", text: "#f3f7ff" },
          "track-return": { fill: "#10252c", stroke: "#47c8f0", text: "#e6fbff" },
          "track-master": { fill: "#2c1b14", stroke: "#f5a623", text: "#fff5e9" },
          "track-group": { fill: "#262132", stroke: "#b493ff", text: "#f5f0ff" },
          "device-rack": { fill: "#2b2216", stroke: "#d8a24a", text: "#fff5df" },
          "device-standard": { fill: "#1b1f28", stroke: "#7b8598", text: "#f3f4f6" }
        };

        const classifyCard = (text) => {
          const value = String(text || "").trim();
          if (value.startsWith("MIDI ")) return "track-midi";
          if (value.startsWith("AUD ")) return "track-audio";
          if (value.startsWith("RET ")) return "track-return";
          if (value.startsWith("MAIN ")) return "track-master";
          if (value.startsWith("GRP ")) return "track-group";
          if (value.startsWith("RACK ")) return "device-rack";
          if (value.startsWith("DEV ")) return "device-standard";
          return null;
        };

        const applyStyle = (node, styleKey) => {
          const style = styleMap[styleKey];
          if (!style) return;
          node.classList.add(styleKey);
          node.querySelectorAll("rect, polygon").forEach((shape) => {
            shape.setAttribute("fill", style.fill);
            shape.setAttribute("stroke", style.stroke);
            shape.setAttribute("stroke-width", "1.4");
          });
          node.querySelectorAll("text").forEach((textNode) => {
            textNode.setAttribute("fill", style.text);
          });
          node.querySelectorAll("foreignObject div, foreignObject span, foreignObject p").forEach((label) => {
            label.style.color = style.text;
          });
        };

        const enhanceKanban = () => {
          const svg = document.querySelector(".diagram svg");
          if (!svg) return;
          svg.querySelectorAll("g.node").forEach((node) => {
            const styleKey = classifyCard(node.textContent || "");
            if (styleKey) applyStyle(node, styleKey);
          });
        };

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", enhanceKanban, { once: true });
        } else {
          enhanceKanban();
        }
      })();
    </script>`;
}

function buildGitMetroDiagram(sessionMap: SessionMap): string {
  const orderedTracks: TrackInfo[] = [
    ...sessionMap.tracks,
    ...sessionMap.returnTracks,
    ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : []),
  ];

  const hasMaster = Boolean(sessionMap.masterTrack);
  const rowSpacing = 86;
  const startY = 84;
  const labelX = 28;
  const lineStartX = 260;
  const sinkX = 1360;
  const lineEndX = sinkX - 42;
  const width = 1480;
  const height = Math.max(420, startY + orderedTracks.length * rowSpacing + 60);
  const masterIndex = hasMaster ? orderedTracks.length - 1 : -1;
  const masterY = masterIndex >= 0 ? startY + masterIndex * rowSpacing : startY + orderedTracks.length * rowSpacing;

  const returnTargets = new Map<string, { y: number; x: number; track: TrackInfo }>();
  const sendLinks: string[] = [];
  const rows: string[] = [];

  orderedTracks.forEach((track, index) => {
    if (track.kind !== "return") return;
    const y = startY + index * rowSpacing;
    const targetX = lineStartX + 48;
    returnTrackAliases(track).forEach((alias) => {
      returnTargets.set(alias, { y, x: targetX, track });
    });
  });

  orderedTracks.forEach((track, index) => {
    const y = startY + index * rowSpacing;
    const color = rowColor(track.kind, index);
    const isMaster = track.kind === "master";
    const strokeWidth = isMaster ? 6 : track.kind === "return" ? 4.5 : 4;
    const endCircleRadius = isMaster ? 9 : 6;
    const lineLength = lineEndX - lineStartX;
    const trackLabel = compactTrackName(track);
    const typeLabel = kindLabel(track.kind);
    const summaryLabel = `dev:${track.devices.length}${track.sends.length > 0 ? ` · sends:${track.sends.length}` : ""}`;
    const rackCount = track.devices.filter((device) => isRackDevice(device)).length;
    const summaryExtra = rackCount > 0 ? ` · racks:${rackCount}` : "";

    rows.push(`
      <g class="metro-row metro-row-${escapeHtml(track.kind)}">
        <text x="${labelX}" y="${y - 8}" class="track-name" fill="#f3f5f8">${escapeHtml(trackLabel)}</text>
        <text x="${labelX}" y="${y + 14}" class="track-meta" fill="#95a1b3">${escapeHtml(typeLabel)} · ${escapeHtml(summaryLabel + summaryExtra)}</text>
        <line x1="${lineStartX}" y1="${y}" x2="${lineEndX}" y2="${y}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />
        <circle cx="${lineStartX}" cy="${y}" r="${isMaster ? 5 : 4}" fill="${color}" />
    `);

    const summaryStopX = lineStartX + 54;
    if (track.sends.length > 0 || rackCount > 0) {
      rows.push(`
        <g class="metro-stop metro-summary">
          <circle cx="${summaryStopX}" cy="${y}" r="7" fill="#0f1318" stroke="${color}" stroke-width="2.25" />
          <text x="${summaryStopX}" y="${y - 13}" class="stop-caption" fill="#aeb9c7">${escapeHtml(track.sends.length > 0 ? `sends:${track.sends.length}` : `racks:${rackCount}`)}</text>
        </g>
      `);
    }

    const deviceStep = track.devices.length > 0 ? Math.min(132, lineLength / (track.devices.length + 2)) : 132;
    track.devices.forEach((device, deviceIndex) => {
      const x = lineStartX + 140 + deviceIndex * deviceStep;
      const ringColor = isRackDevice(device) ? "#f2c26a" : "#f5f7fa";
      rows.push(`
        <g class="metro-stop metro-device">
          <circle cx="${x}" cy="${y}" r="8" fill="#0f1318" stroke="${ringColor}" stroke-width="2.1" />
          <text x="${x}" y="${y - 14}" class="stop-caption" fill="#dbe3ed">${escapeHtml(compactDeviceName(device))}</text>
        </g>
      `);
    });

    rows.push(`
        <circle cx="${lineEndX}" cy="${y}" r="${endCircleRadius}" fill="${color}" />
      </g>
    `);

    if (!isMaster) {
      const trunkStroke = track.kind === "return" ? 2.2 : 2;
      rows.push(`
        <path d="M ${lineEndX} ${y} L ${sinkX} ${y} L ${sinkX} ${masterY}" fill="none" stroke="${color}" stroke-width="${trunkStroke}" stroke-linecap="round" stroke-opacity="${track.kind === "return" ? "0.9" : "0.5"}" />
      `);
    } else {
      rows.push(`
        <line x1="${lineEndX}" y1="${y}" x2="${sinkX}" y2="${y}" stroke="${color}" stroke-width="6" stroke-linecap="round" />
        <circle cx="${sinkX}" cy="${y}" r="11" fill="#0f1318" stroke="${color}" stroke-width="4" />
        <text x="${sinkX - 6}" y="${y - 18}" class="stop-caption stop-caption-main" fill="#ffd18c">Main sink</text>
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
            <text x="${midX - 12}" y="${controlY - 8}" class="send-label" fill="#9fe9f5">${escapeHtml(`send ${send.name}`)}</text>
          `);
        });
    }
  });

  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Git Metro custom session map">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="#0f1318" rx="8" />
    <line x1="${sinkX}" y1="${startY}" x2="${sinkX}" y2="${masterY}" stroke="#f5a623" stroke-width="2.5" stroke-opacity="0.35" filter="url(#glow)" />
    ${sendLinks.join("\n")}
    ${rows.join("\n")}
  </svg>`;
}

function buildGitMetroHtmlPage(sessionMap: SessionMap): string {
  const legendItems = profileLegendItems().map((item) => `<li>${item}</li>`).join("");
  const diagramMarkup = buildGitMetroDiagram(sessionMap);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlTitle()}</title>
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
    .track-name { font-size: 15px; font-weight: 700; }
    .track-meta, .stop-caption, .send-label { font-size: 11px; font-weight: 500; }
    .stop-caption-main { font-size: 12px; font-weight: 700; }
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
        <p class="eyebrow">Session Mapper / Mermaid Render</p>
        <h1>${htmlTitle()}</h1>
        <p class="subline">${profileDescription()} SVG/PNG remain optional manual renders alongside the latest HTML and .mmd views.</p>
      </div>
      <div class="links">
        <a href="${relativeName(latestMmdPath)}">Open .mmd</a>
        <a href="${relativeName(latestSvgPath)}">Open SVG</a>
        <a href="${relativeName(latestPngPath)}">Open PNG</a>
      </div>
    </div>

    <section class="meta-grid">
      <article class="legend panel">
        <h2>${profileLegendTitle()}</h2>
        <ul>${legendItems}</ul>
      </article>
      <article class="support panel">
        <strong>External render</strong>
        <p>This page stays fully external. No Ableton WebView is used.</p>
        <p>Use it for larger static review, sharing, or export snapshots.</p>
      </article>
    </section>

    <div class="diagram">
${diagramMarkup}
    </div>
    <p class="caption">Metro view is a stylized track/device map. Main is shown as the final destination line. Send links to returns are secondary visual hints, not exact audio routing.</p>
    <footer>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`;
}

function buildHtmlPage(svgMarkup: string): string {
  const legendItems = profileLegendItems().map((item) => `<li>${item}</li>`).join("");
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlTitle()}</title>
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
    .shell {
      max-width: 1520px;
      margin: 0 auto;
      padding: 18px;
    }
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
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.1;
    }
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
    .legend,
    .support {
      padding: 12px 14px;
    }
    .legend h2,
    .support strong {
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
    footer {
      margin-top: 10px;
      text-align: right;
    }
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
      .toolbar,
      .meta-grid {
        grid-template-columns: 1fr;
      }
      .links { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="toolbar panel">
      <div>
        <p class="eyebrow">Session Mapper / Mermaid Render</p>
        <h1>${htmlTitle()}</h1>
        <p class="subline">${profileDescription()} SVG/PNG remain optional manual renders alongside the latest HTML and .mmd views.</p>
      </div>
      <div class="links">
        <a href="${relativeName(latestMmdPath)}">Open .mmd</a>
        <a href="${relativeName(latestSvgPath)}">Open SVG</a>
        <a href="${relativeName(latestPngPath)}">Open PNG</a>
      </div>
    </div>

    <section class="meta-grid">
      <article class="legend panel">
        <h2>${profileLegendTitle()}</h2>
        <ul>${legendItems}</ul>
      </article>
      <article class="support panel">
        <strong>External render</strong>
        <p>This page stays fully external. No Ableton WebView is used.</p>
        <p>Use it for larger static review, sharing, or export snapshots.</p>
      </article>
    </section>

    <div class="diagram">
${svgMarkup}
    </div>
    <p class="caption">Rendered externally from Mermaid. Main views stay current on export; SVG/PNG are optional manual renders.</p>
    <footer>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
  ${buildProfileEnhancerScript()}
</body>
</html>
`;
}

async function main(): Promise<void> {
  await ensureRendererInstalled();
  const paths = await resolveRenderPaths();

  console.log(`${logPrefix} Render Mermaid started`);

  if (profile === "git") {
    const sessionMap = JSON.parse(
      await readFile(resolve(rootDirectory, "exports/session-map.json"), "utf8"),
    ) as MetroSessionMap;
    const metroModel = buildMetroModel(sessionMap);

    console.log(`${logPrefix} Render SVG started`);
    const customSvg = renderMetroSvg(metroModel);
    await writeFile(paths.latestSvgPath, customSvg, "utf8");
    await writeFile(paths.archiveSvgPath, customSvg, "utf8");
    console.log(`${logPrefix} Render SVG completed: ${logPath(paths.latestSvgPath)}`);
    console.log(`${logPrefix} SVG archive completed: ${logPath(paths.archiveSvgPath)}`);

    console.log(`${logPrefix} Render PNG started`);
    await renderSvgToPng(paths.latestSvgPath, paths.latestPngPath);
    const latestPng = await readFile(paths.latestPngPath);
    await writeFile(paths.archivePngPath, latestPng);
    console.log(`${logPrefix} Render PNG completed: ${logPath(paths.latestPngPath)}`);
    console.log(`${logPrefix} PNG archive completed: ${logPath(paths.archivePngPath)}`);

    const html = renderMetroHtml(metroModel, {
      mmdFileName: relativeName(paths.latestMmdPath),
      svgFileName: relativeName(paths.latestSvgPath),
      pngFileName: relativeName(paths.latestPngPath),
    });
    await writeFile(paths.latestHtmlPath, html, "utf8");
    console.log(`${logPrefix} Mermaid HTML completed: ${logPath(paths.latestHtmlPath)}`);

    const indexHtmlPath = resolve(rootDirectory, "exports/session-map-diagrams.html");
    await writeDiagramsIndex({
      jsonPath: resolve(rootDirectory, "exports/session-map.json"),
      outputPath: indexHtmlPath,
      rootDirectory,
    });
    console.log(`${logPrefix} Diagram index completed: ${logPath(indexHtmlPath)}`);
    console.log(`${logPrefix} Render Mermaid completed`);
    return;
  }

  console.log(`${logPrefix} Render SVG started`);
  await renderWithMermaidCli(paths.latestMmdPath, paths.latestSvgPath, "svg");
  const latestSvg = await readFile(paths.latestSvgPath, "utf8");
  await writeFile(paths.archiveSvgPath, latestSvg, "utf8");
  console.log(`${logPrefix} Render SVG completed: ${logPath(paths.latestSvgPath)}`);
  console.log(`${logPrefix} SVG archive completed: ${logPath(paths.archiveSvgPath)}`);

  console.log(`${logPrefix} Render PNG started`);
  await renderWithMermaidCli(paths.latestMmdPath, paths.latestPngPath, "png");
  const latestPng = await readFile(paths.latestPngPath);
  await writeFile(paths.archivePngPath, latestPng);
  console.log(`${logPrefix} Render PNG completed: ${logPath(paths.latestPngPath)}`);
  console.log(`${logPrefix} PNG archive completed: ${logPath(paths.archivePngPath)}`);

  const html = buildHtmlPage(latestSvg);
  await writeFile(paths.latestHtmlPath, html, "utf8");
  console.log(`${logPrefix} Mermaid HTML completed: ${logPath(paths.latestHtmlPath)}`);
  const indexHtmlPath = resolve(rootDirectory, "exports/session-map-diagrams.html");
  await writeDiagramsIndex({
    jsonPath: resolve(rootDirectory, "exports/session-map.json"),
    outputPath: indexHtmlPath,
    rootDirectory,
  });
  console.log(`${logPrefix} Diagram index completed: ${logPath(indexHtmlPath)}`);
  console.log(`${logPrefix} Render Mermaid completed`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${logPrefix} Render Mermaid failed: ${message}`);
  console.error(
    `${logPrefix} The .mmd export is still available. If the renderer is missing or broken, run \`npm install\` and retry the render command.`,
  );
  process.exitCode = 1;
});
