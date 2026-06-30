import type { SessionMap } from "../types.js";

export interface InternalViewerFileLink {
  key: string;
  label: string;
  exists: boolean;
}

export interface InternalViewerModel {
  setName: string | null;
  exportedAt: string | null;
  statusMessage: string;
  metrics: {
    tracks: number;
    returns: number;
    devices: number;
    racks: number;
    sends: number;
  };
  links: InternalViewerFileLink[];
  hasExport: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function formatExportDate(value: string | null): string {
  if (!value) return "No export available yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR");
}

function linkButton(link: InternalViewerFileLink): string {
  const disabledAttr = link.exists ? "" : " disabled";
  const availability = link.exists
    ? ""
    : `<span class="link-status">Not generated yet</span>`;
  return `<button class="link-button" type="button" data-link-key="${escapeHtml(link.key)}"${disabledAttr}>${escapeHtml(link.label)}</button>${availability}`;
}

export function createInternalViewerHtml(model: InternalViewerModel): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Mapper</title>
  <script>
    const viewerModel = ${safeJsonForScript(model)};
    const isWebKit = window.webkit?.messageHandlers?.live;
    const isWebView2 = window.chrome?.webview;

    function sendMessage(message) {
      if (isWebKit) {
        window.webkit.messageHandlers.live.postMessage(message);
      } else if (isWebView2) {
        window.chrome.webview.postMessage(message);
      }
    }

    function closeWithResult(result) {
      sendMessage({
        method: "close_and_send",
        params: [JSON.stringify(result)],
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-link-key]").forEach((button) => {
        button.addEventListener("click", () => {
          const key = button.getAttribute("data-link-key");
          closeWithResult({ action: "open-link", key });
        });
      });

      document.getElementById("close-viewer")?.addEventListener("click", () => {
        closeWithResult({ action: "close" });
      });

      document.getElementById("cancel-viewer")?.addEventListener("click", () => {
        closeWithResult({ action: "cancel" });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeWithResult({ action: "cancel" });
        }
      });
    });
  </script>
  <style>
    :root {
      color-scheme: dark;
      --bg: #1b1b1b;
      --panel: #2a2a2a;
      --panel-2: #252525;
      --border: #0f0f0f;
      --text: #ededed;
      --muted: #a8a8a8;
      --accent: #f5a623;
      --accent-2: #7ec7ff;
    }
    * { box-sizing: border-box; }
    html {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 11.5px;
      font-weight: 500;
      -webkit-font-smoothing: antialiased;
    }
    body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at top right, rgba(245,166,35,0.12), transparent 30%),
        linear-gradient(180deg, #313131, #222);
      padding: 14px;
      display: flex;
      align-items: stretch;
      justify-content: center;
    }
    .shell {
      width: 100%;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 10px;
    }
    .hero, .metrics, .links, .footer {
      background: rgba(37,37,37,0.92);
      border: 1px solid var(--border);
      border-radius: 14px;
    }
    .hero {
      padding: 12px 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .eyebrow {
      margin: 0 0 6px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--accent);
      font-size: 10px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .subline {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 12px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 1px;
      padding: 1px;
      background: var(--border);
    }
    .metric {
      background: var(--panel);
      padding: 10px 8px;
      text-align: center;
    }
    .metric strong {
      display: block;
      font-size: 18px;
      margin-bottom: 2px;
    }
    .metric span {
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .links {
      padding: 12px;
      display: grid;
      gap: 8px;
      align-content: start;
    }
    .links-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }
    .links-header h2 {
      margin: 0;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }
    .links-header p {
      margin: 0;
      color: var(--muted);
      font-size: 11px;
    }
    .link-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .link-button, .close-button, .cancel-button {
      height: 28px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, #3a3a3a, #313131);
      color: var(--text);
      padding: 0 12px;
      cursor: pointer;
      white-space: nowrap;
    }
    .link-button:hover, .close-button:hover, .cancel-button:hover {
      background: linear-gradient(180deg, #454545, #363636);
    }
    .link-button:active, .close-button:active, .cancel-button:active {
      background: var(--accent);
      color: #111;
    }
    .link-button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
      background: #2d2d2d;
      color: #8b8b8b;
    }
    .link-status {
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .empty-note {
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;
      padding: 4px 2px 0;
    }
    .status-note {
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;
      padding: 4px 2px 0;
    }
    .cta-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .cancel-button {
      background: linear-gradient(180deg, #2f2f2f, #292929);
      color: var(--muted);
    }
    .footer {
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .footer small {
      color: var(--muted);
      font-size: 10px;
      line-height: 1.45;
    }
    .footer a {
      color: #7c8799;
      text-decoration: none;
      font-size: 10px;
    }
    .footer a:hover {
      color: var(--accent);
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <p class="eyebrow">Experimental Internal Viewer</p>
      <h1>Session Mapper</h1>
      <p class="subline">Export date: ${escapeHtml(formatExportDate(model.exportedAt))}<br>Set: ${escapeHtml(model.setName ?? "Untitled Set")}</p>
    </section>

    <section class="metrics" aria-label="Session metrics">
      <article class="metric"><strong>${model.metrics.tracks}</strong><span>Tracks</span></article>
      <article class="metric"><strong>${model.metrics.returns}</strong><span>Returns</span></article>
      <article class="metric"><strong>${model.metrics.devices}</strong><span>Devices</span></article>
      <article class="metric"><strong>${model.metrics.racks}</strong><span>Racks</span></article>
      <article class="metric"><strong>${model.metrics.sends}</strong><span>Sends</span></article>
    </section>

    <section class="links">
      <div class="links-header">
        <h2>Open external files</h2>
        <p>Ultra-safe: no Mermaid rendered inside Live</p>
      </div>
      <p class="status-note">${escapeHtml(model.statusMessage)}</p>
      ${
        model.hasExport
          ? model.links
              .map((link) => `<div class="link-row">${linkButton(link)}</div>`)
              .join("")
          : `<div class="empty-note">
              <div>No export generated yet.</div>
              <div class="cta-row">
                <button class="link-button" type="button" disabled>Run Export Session Map first</button>
                <span class="link-status">Then reopen this experimental viewer</span>
              </div>
            </div>`
      }
    </section>

    <section class="footer">
      <small>Recommended mode remains the external launcher. This internal viewer is intentionally minimal and experimental.</small>
      <div>
        <button id="cancel-viewer" class="cancel-button" type="button">Cancel</button>
        <button id="close-viewer" class="close-button" type="button">Close</button>
      </div>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </section>
  </div>
</body>
</html>`;
}

export function createInternalViewerModel(sessionMap: SessionMap | null, links: InternalViewerFileLink[]): InternalViewerModel {
  const allTracks = sessionMap
    ? [...sessionMap.tracks, ...sessionMap.returnTracks, ...(sessionMap.masterTrack ? [sessionMap.masterTrack] : [])]
    : [];
  const devices = allTracks.reduce((sum, track) => sum + track.devices.length, 0);
  const racks = allTracks.reduce(
    (sum, track) =>
      sum +
      track.devices.filter(
        (device) =>
          device.type.toLowerCase().includes("rack") ||
          Boolean(device.chainsSummary?.count) ||
          Boolean(device.padsSummary?.count),
      ).length,
    0,
  );
  const sends = allTracks.reduce((sum, track) => sum + track.sends.length, 0);

  return {
    setName: sessionMap?.set.name ?? null,
    exportedAt: sessionMap?.exportedAt ?? null,
    statusMessage: sessionMap
      ? "Latest export metadata loaded. Use these buttons to open external views."
      : "No export metadata available yet. The recommended path is still the external launcher after Export Session Map.",
    metrics: {
      tracks: sessionMap?.tracks.length ?? 0,
      returns: sessionMap?.returnTracks.length ?? 0,
      devices,
      racks,
      sends,
    },
    links,
    hasExport: Boolean(sessionMap),
  };
}
