export interface InternalViewerQuickLink {
  key: string;
  label: string;
  exists: boolean;
}

export interface InternalViewerOutputRow {
  index: number;
  name: string;
  kind: string;
  midiFrom: string;
  midiTo: string;
  audioFrom: string;
  audioTo: string;
  monitor: string;
  source: string;
  sends: string;
  sectionType: "track" | "return" | "master";
}

export interface InternalViewerConnectionRow {
  from: string;
  to: string;
  type: string;
  label: string;
}

export interface InternalViewerSidechainRow {
  targetTrack: string;
  targetDevice: string;
  sourceTrack: string;
  enabled: string;
  notes: string;
}

export interface InternalViewerDeviceTrack {
  index: number;
  name: string;
  kind: string;
  deviceCount: number;
  rackCount: number;
  deviceSummary: string[];
  rackSummary: string[];
  sectionType: "track" | "return" | "master";
}

export interface InternalViewerSessionPreviewDeviceCard {
  name: string;
  summary: string;
  isRack: boolean;
}

export interface InternalViewerSessionPreviewColumn {
  index: number;
  name: string;
  kind: string;
  sectionType: "track" | "return" | "master";
  deviceCount: number;
  sendCount: number;
  rackCount: number;
  deviceCards: InternalViewerSessionPreviewDeviceCard[];
}

export interface InternalViewerFileEntry {
  key: string;
  label: string;
  fileName: string;
  exists: boolean;
  group: string;
}

export interface InternalViewerModel {
  setName: string | null;
  exportedAt: string | null;
  statusMessage: string;
  warningMessage: string | null;
  scanMode: string;
  metrics: {
    tracks: number;
    returns: number;
    devices: number;
    racks: number;
    sends: number;
  };
  quickLinks: InternalViewerQuickLink[];
  sessionPreviewColumns: InternalViewerSessionPreviewColumn[];
  outputs: InternalViewerOutputRow[];
  connections: InternalViewerConnectionRow[];
  manualRoutingStatus: string;
  manualRoutingWarnings: string[];
  routingOverridesPath: string;
  routingOverridesExists: boolean;
  sidechains: InternalViewerSidechainRow[];
  deviceTracks: InternalViewerDeviceTrack[];
  files: InternalViewerFileEntry[];
  hasExport: boolean;
  hasMissingRoutingData: boolean;
  internalVisualPreviewEnabled: boolean;
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

function truncateLabel(value: string, max = 18): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function renderQuickOpenButton(link: InternalViewerQuickLink): string {
  const disabledAttr = link.exists ? "" : " disabled";
  return `<button class="action-button" type="button" data-link-key="${escapeHtml(link.key)}"${disabledAttr}>${escapeHtml(link.label)}</button>`;
}

function renderFileEntry(file: InternalViewerFileEntry): string {
  const disabledAttr = file.exists ? "" : " disabled";
  return `<div class="file-row">
    <div class="file-meta">
      <strong>${escapeHtml(file.label)}</strong>
      <span>${escapeHtml(file.fileName)}</span>
    </div>
    <div class="file-actions">
      <span class="file-status ${file.exists ? "is-available" : "is-missing"}">${file.exists ? "available" : "missing"}</span>
      <button class="mini-button" type="button" data-link-key="${escapeHtml(file.key)}"${disabledAttr}>Open</button>
    </div>
  </div>`;
}

function renderOverview(model: InternalViewerModel): string {
  const warningBlock = model.warningMessage
    ? `<div class="notice warning">${escapeHtml(model.warningMessage)}</div>`
    : "";

  return `<div class="overview-grid">
      <article class="overview-card">
        <span class="label">Set</span>
        <strong>${escapeHtml(model.setName ?? "Untitled Set")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Export date</span>
        <strong>${escapeHtml(formatExportDate(model.exportedAt))}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Mode</span>
        <strong>${escapeHtml(model.scanMode)}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Status</span>
        <strong>${escapeHtml(model.hasExport ? "Ready" : "Waiting for export")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Routing overrides</span>
        <strong>${escapeHtml(model.manualRoutingStatus.toUpperCase())}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Warnings</span>
        <strong>${escapeHtml(String(model.manualRoutingWarnings.length))}</strong>
      </article>
    </div>
    <div class="notice">${escapeHtml(model.statusMessage)}</div>
    ${warningBlock}
    <div class="quick-open">
      <div class="section-header">
        <h3>Quick Open</h3>
        <p>External launcher remains available for full diagrams</p>
      </div>
      <div class="button-grid">
        ${model.quickLinks.map((link) => renderQuickOpenButton(link)).join("")}
      </div>
    </div>`;
}

function renderSessionPreview(model: InternalViewerModel): string {
  if (!model.internalVisualPreviewEnabled) {
    return `<div class="empty-state">
      <strong>Internal visual preview disabled.</strong>
      <span>The experimental viewer is currently limited to metadata tabs.</span>
    </div>`;
  }

  if (!model.hasExport || model.sessionPreviewColumns.length === 0) {
    return `<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`;
  }

  return `<div class="notice">
      Internal preview uses exported JSON. For full diagrams, open the external launcher.
    </div>
    <div class="preview-metrics-inline">
      <span>tracks:${model.metrics.tracks}</span>
      <span>returns:${model.metrics.returns}</span>
      <span>devices:${model.metrics.devices}</span>
      <span>racks:${model.metrics.racks}</span>
      <span>sends:${model.metrics.sends}</span>
    </div>
    <div class="session-preview-scroll">
      <div class="session-preview-grid">
        ${model.sessionPreviewColumns
          .map(
            (column) => `<section class="session-column session-column-${escapeHtml(column.sectionType)} session-kind-${escapeHtml(column.kind)}">
              <header class="session-column-header">
                <div class="session-column-title">
                  <strong>${escapeHtml(column.name)}</strong>
                  <span class="kind-badge kind-${escapeHtml(column.sectionType)}">${escapeHtml(column.kind)}</span>
                </div>
                <p>${column.sectionType === "master" ? "★" : column.index + 1} · dev:${column.deviceCount} · sends:${column.sendCount} · racks:${column.rackCount}</p>
              </header>
              <div class="session-device-stack">
                ${
                  column.deviceCards.length > 0
                    ? column.deviceCards
                        .map(
                          (device) => `<article class="session-device-card ${device.isRack ? "is-rack" : ""}">
                            <strong>${escapeHtml(device.name)}</strong>
                            <span>${escapeHtml(device.summary)}</span>
                          </article>`,
                        )
                        .join("")
                    : `<div class="session-empty-card">No devices</div>`
                }
              </div>
            </section>`,
          )
          .join("")}
      </div>
    </div>`;
}

function renderKanbanPreview(model: InternalViewerModel): string {
  if (!model.internalVisualPreviewEnabled) {
    return `<div class="empty-state">
      <strong>Internal visual preview disabled.</strong>
      <span>The experimental viewer is currently limited to metadata tabs.</span>
    </div>`;
  }

  if (!model.hasExport || model.sessionPreviewColumns.length === 0) {
    return `<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`;
  }

  return `<div class="notice">
      Kanban preview is rendered directly inside Live from exported JSON. Mermaid remains external.
    </div>
    <div class="kanban-scroll">
      <div class="kanban-grid">
        ${model.sessionPreviewColumns
          .map(
            (column) => `<section class="kanban-column session-column-${escapeHtml(column.sectionType)} session-kind-${escapeHtml(column.kind)}">
              <header class="kanban-column-header">
                <strong>${escapeHtml(column.name)}</strong>
                <span class="kind-badge kind-${escapeHtml(column.sectionType)}">${escapeHtml(column.kind)}</span>
              </header>
              <div class="kanban-column-body">
                <article class="kanban-card kanban-summary-card">
                  <strong>${escapeHtml(column.name)} · ${escapeHtml(column.kind.toUpperCase())}</strong>
                  <span>dev:${column.deviceCount} · sends:${column.sendCount} · racks:${column.rackCount}</span>
                </article>
                ${
                  column.deviceCards.length > 0
                    ? column.deviceCards
                        .map(
                          (device) => `<article class="kanban-card ${device.isRack ? "is-rack" : ""}">
                            <strong>${escapeHtml(truncateLabel(device.name, 20))}</strong>
                            <span>${escapeHtml(device.summary)}</span>
                          </article>`,
                        )
                        .join("")
                    : `<article class="kanban-card kanban-empty-card"><span>No devices</span></article>`
                }
              </div>
            </section>`,
          )
          .join("")}
      </div>
    </div>`;
}

function renderMetroPreview(model: InternalViewerModel): string {
  if (!model.internalVisualPreviewEnabled) {
    return `<div class="empty-state">
      <strong>Internal visual preview disabled.</strong>
      <span>The experimental viewer is currently limited to metadata tabs.</span>
    </div>`;
  }

  if (!model.hasExport || model.sessionPreviewColumns.length === 0) {
    return `<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`;
  }

  return `<div class="notice">
      Metro preview is native HTML/CSS inside Live. Full Git / Metro Mermaid remains external.
    </div>
    <div class="metro-list">
      ${model.sessionPreviewColumns
        .map(
          (column) => `<section class="metro-row session-column-${escapeHtml(column.sectionType)} session-kind-${escapeHtml(column.kind)}">
            <div class="metro-track-name">
              <strong>${escapeHtml(column.name)}</strong>
              <span>${escapeHtml(column.kind)} · dev:${column.deviceCount}</span>
            </div>
            <div class="metro-line-shell">
              <div class="metro-line">
                <article class="metro-stop is-track">
                  <span class="metro-dot"></span>
                  <strong>${escapeHtml(truncateLabel(column.name, 18))}</strong>
                  <small>${escapeHtml(column.kind)}</small>
                </article>
                ${column.deviceCards
                  .map(
                    (device) => `<article class="metro-stop ${device.isRack ? "is-rack" : ""}">
                      <span class="metro-dot"></span>
                      <strong>${escapeHtml(truncateLabel(device.name, 18))}</strong>
                      <small>${escapeHtml(truncateLabel(device.summary, 24))}</small>
                    </article>`,
                  )
                  .join("")}
                ${
                  column.deviceCards.length === 0
                    ? `<article class="metro-stop is-empty">
                        <span class="metro-dot"></span>
                        <strong>No devices</strong>
                        <small>empty track</small>
                      </article>`
                    : ""
                }
              </div>
            </div>
          </section>`,
        )
        .join("")}
    </div>`;
}

function renderOutputs(model: InternalViewerModel): string {
  if (!model.hasExport || model.outputs.length === 0) {
    return `<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`;
  }

  return `<div class="notice">
      Routing I/O may be unavailable in the current SDK scan. Manual routing-overrides.json can fill the missing data.
    </div>
    <div class="notice">Manual routing status: ${escapeHtml(model.manualRoutingStatus.toUpperCase())}${model.manualRoutingWarnings.length ? ` · ${escapeHtml(model.manualRoutingWarnings.join(" · "))}` : ""}</div>
    ${
      model.hasMissingRoutingData
        ? `<div class="notice warning">Routing I/O non disponible dans cette version du SDK.</div>`
        : ""
    }
    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Track</th>
            <th>Kind</th>
            <th>MIDI From</th>
            <th>MIDI To</th>
            <th>Audio From</th>
            <th>Audio To</th>
            <th>Monitor</th>
            <th>Source</th>
            <th>Sends</th>
          </tr>
        </thead>
        <tbody>
          ${model.outputs
            .map(
              (row) => `<tr>
                <td>${row.sectionType === "master" ? "★" : row.index + 1}</td>
                <td>${escapeHtml(row.name)}</td>
                <td><span class="kind-badge kind-${escapeHtml(row.sectionType)}">${escapeHtml(row.kind)}</span></td>
                <td>${escapeHtml(row.midiFrom)}</td>
                <td>${escapeHtml(row.midiTo)}</td>
                <td>${escapeHtml(row.audioFrom)}</td>
                <td>${escapeHtml(row.audioTo)}</td>
                <td>${escapeHtml(row.monitor)}</td>
                <td>${escapeHtml(row.source)}</td>
                <td>${escapeHtml(row.sends)}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${
      model.connections.length
        ? `<div class="file-group">
            <div class="section-header">
              <h3>Manual Connections</h3>
              <p>${model.connections.length} links</p>
            </div>
            <div class="file-group-list">
              ${model.connections
                .map(
                  (connection) => `<div class="file-row">
                    <div class="file-meta">
                      <strong>${escapeHtml(connection.from)} → ${escapeHtml(connection.to)}</strong>
                      <span>${escapeHtml(connection.type)}${connection.label ? ` · ${escapeHtml(connection.label)}` : ""}</span>
                    </div>
                  </div>`,
                )
                .join("")}
            </div>
          </div>`
        : ""
    }`;
}

function renderRouting(model: InternalViewerModel): string {
  if (!model.hasExport) {
    return `<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`;
  }

  const status = model.manualRoutingStatus.toUpperCase();
  const warningRows = model.manualRoutingWarnings.length
    ? `<div class="file-group">
        <div class="section-header">
          <h3>Warnings</h3>
          <p>${model.manualRoutingWarnings.length}</p>
        </div>
        <div class="chip-group">${model.manualRoutingWarnings
          .map((warning) => `<span class="chip chip-warning">${escapeHtml(warning)}</span>`)
          .join("")}</div>
      </div>`
    : "";

  const connectionsBlock = model.connections.length
    ? `<section class="file-group">
        <div class="section-header">
          <h3>Manual Connections</h3>
          <p>${model.connections.length} links</p>
        </div>
        <div class="file-group-list">
          ${model.connections
            .map(
              (connection) => `<div class="file-row">
                <div class="file-meta">
                  <strong>${escapeHtml(connection.from)} → ${escapeHtml(connection.to)}</strong>
                  <span>${escapeHtml(connection.type)}${connection.label ? ` · ${escapeHtml(connection.label)}` : ""} · source MANUAL</span>
                </div>
              </div>`,
            )
            .join("")}
        </div>
      </section>`
    : `<div class="notice">No manual connections listed.</div>`;

  const sidechainsBlock = model.sidechains.length
    ? `<section class="file-group">
        <div class="section-header">
          <h3>Sidechains</h3>
          <p>${model.sidechains.length}</p>
        </div>
        <div class="file-group-list">
          ${model.sidechains
            .map(
              (sidechain) => `<div class="file-row">
                <div class="file-meta">
                  <strong>${escapeHtml(sidechain.sourceTrack)} → ${escapeHtml(sidechain.targetTrack)}</strong>
                  <span>${escapeHtml(sidechain.targetDevice || "Unknown device")} · ${escapeHtml(sidechain.enabled)}${sidechain.notes ? ` · ${escapeHtml(sidechain.notes)}` : ""}</span>
                </div>
              </div>`,
            )
            .join("")}
        </div>
      </section>`
    : `<div class="notice">No sidechains declared in routing-overrides.json.</div>`;

  let statusNotice = "Routing overrides loaded.";
  if (model.manualRoutingStatus === "missing") {
    statusNotice = "No routing-overrides.json found. Run npm run create:routing-overrides.";
  } else if (model.manualRoutingStatus === "invalid") {
    statusNotice = "routing-overrides.json is invalid. Check warnings below.";
  }

  return `<div class="overview-grid">
      <article class="overview-card">
        <span class="label">Routing status</span>
        <strong>${escapeHtml(status)}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Overrides file</span>
        <strong>${escapeHtml(model.routingOverridesExists ? "Found" : "Missing")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Warnings</span>
        <strong>${escapeHtml(String(model.manualRoutingWarnings.length))}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Manual connections</span>
        <strong>${escapeHtml(String(model.connections.length))}</strong>
      </article>
    </div>
    <div class="notice">${escapeHtml(statusNotice)}</div>
    <div class="notice">Path: ${escapeHtml(model.routingOverridesPath)}</div>
    ${warningRows}
    ${connectionsBlock}
    ${sidechainsBlock}`;
}

function renderDevices(model: InternalViewerModel): string {
  if (!model.hasExport || model.deviceTracks.length === 0) {
    return `<div class="empty-state">
      <strong>No devices to display yet.</strong>
      <span>The internal viewer only reflects the latest exported JSON.</span>
    </div>`;
  }

  return `<div class="device-list">
    ${model.deviceTracks
      .map(
        (track) => `<article class="device-card">
          <header class="device-card-header">
            <div>
              <h3>${escapeHtml(track.name)}</h3>
              <p>${escapeHtml(track.kind)} · dev:${track.deviceCount} · racks:${track.rackCount}</p>
            </div>
            <span class="kind-badge kind-${escapeHtml(track.sectionType)}">${escapeHtml(track.kind)}</span>
          </header>
          <div class="chip-group">
            ${
              track.deviceSummary.length > 0
                ? track.deviceSummary.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")
                : `<span class="empty-inline">No devices</span>`
            }
          </div>
          ${
            track.rackSummary.length > 0
              ? `<div class="rack-summary">
                  <span class="label">Racks</span>
                  <div class="chip-group">${track.rackSummary
                    .map((item) => `<span class="chip chip-rack">${escapeHtml(item)}</span>`)
                    .join("")}</div>
                </div>`
              : ""
          }
        </article>`,
      )
      .join("")}
  </div>`;
}

function renderFiles(model: InternalViewerModel): string {
  const groups = Array.from(new Set(model.files.map((file) => file.group)));

  return groups
    .map((group) => {
      const items = model.files.filter((file) => file.group === group);
      return `<section class="file-group">
        <div class="section-header">
          <h3>${escapeHtml(group)}</h3>
          <p>${items.filter((item) => item.exists).length}/${items.length} available</p>
        </div>
        <div class="file-group-list">
          ${items.map((item) => renderFileEntry(item)).join("")}
        </div>
      </section>`;
    })
    .join("");
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
          if (button.hasAttribute("disabled")) return;
          const key = button.getAttribute("data-link-key");
          closeWithResult({ action: "open-link", key });
        });
      });

      document.getElementById("refresh-viewer")?.addEventListener("click", () => {
        closeWithResult({ action: "refresh" });
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
      --bg: #171717;
      --panel: #242424;
      --panel-2: #1f1f1f;
      --panel-3: #2e2e2e;
      --border: rgba(255,255,255,0.08);
      --text: #ece9e2;
      --muted: #aaa59c;
      --accent: #f5a623;
      --accent-2: #7ec7ff;
      --danger: #ffb26b;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 12px;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background:
        radial-gradient(circle at top right, rgba(245,166,35,0.11), transparent 28%),
        linear-gradient(180deg, #2a2a2a 0%, #191919 100%);
      padding: 14px;
    }
    .shell {
      height: calc(100vh - 28px);
      max-width: 95vw;
      max-height: 92vh;
      display: grid;
      grid-template-rows: auto auto auto minmax(0, 1fr) auto;
      gap: 10px;
    }
    .hero, .metrics, .tab-bar, .panel-shell, .footer {
      background: rgba(31,31,31,0.94);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .hero {
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
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
      font-size: 28px;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .subline {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.45;
      font-size: 12px;
    }
    .hero-meta {
      text-align: right;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 1px;
      padding: 1px;
      background: rgba(255,255,255,0.04);
    }
    .metric {
      background: var(--panel);
      padding: 11px 8px;
      text-align: center;
    }
    .metric strong {
      display: block;
      font-size: 20px;
      margin-bottom: 4px;
    }
    .metric span {
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .tab-toggle {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
    }
    .tab-bar {
      display: flex;
      gap: 8px;
      padding: 8px;
      flex-wrap: wrap;
    }
    .tab-label, .action-button, .mini-button, .close-button, .cancel-button {
      border-radius: 999px;
      border: 1px solid var(--border);
      color: var(--text);
      background: linear-gradient(180deg, #383838, #2f2f2f);
      cursor: pointer;
      transition: background 120ms ease, transform 120ms ease;
    }
    .tab-label:hover, .action-button:hover, .mini-button:hover, .close-button:hover, .cancel-button:hover {
      background: linear-gradient(180deg, #444, #353535);
    }
    .tab-label {
      min-height: 32px;
      padding: 0 14px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
    }
    #internal-tab-session:checked ~ .tab-bar label[for="internal-tab-session"],
    #internal-tab-kanban:checked ~ .tab-bar label[for="internal-tab-kanban"],
    #internal-tab-metro:checked ~ .tab-bar label[for="internal-tab-metro"],
    #internal-tab-outputs:checked ~ .tab-bar label[for="internal-tab-outputs"],
    #internal-tab-routing:checked ~ .tab-bar label[for="internal-tab-routing"],
    #internal-tab-devices:checked ~ .tab-bar label[for="internal-tab-devices"],
    #internal-tab-files:checked ~ .tab-bar label[for="internal-tab-files"],
    #internal-tab-overview:checked ~ .tab-bar label[for="internal-tab-overview"] {
      background: linear-gradient(180deg, #f5a623, #cf8615);
      color: #141414;
      border-color: rgba(245,166,35,0.45);
    }
    .panel-shell {
      min-height: 0;
      padding: 12px;
      overflow: auto;
    }
    .panel {
      display: none;
      gap: 12px;
      align-content: start;
    }
    #internal-tab-session:checked ~ .panel-shell .panel-session,
    #internal-tab-kanban:checked ~ .panel-shell .panel-kanban,
    #internal-tab-metro:checked ~ .panel-shell .panel-metro,
    #internal-tab-outputs:checked ~ .panel-shell .panel-outputs,
    #internal-tab-routing:checked ~ .panel-shell .panel-routing,
    #internal-tab-devices:checked ~ .panel-shell .panel-devices,
    #internal-tab-files:checked ~ .panel-shell .panel-files,
    #internal-tab-overview:checked ~ .panel-shell .panel-overview {
      display: grid;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
    }
    .overview-card, .device-card, .notice, .empty-state, .file-group {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
    }
    .overview-card {
      padding: 12px;
    }
    .overview-card .label, .rack-summary .label {
      display: block;
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .overview-card strong {
      display: block;
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;
    }
    .notice {
      padding: 11px 12px;
      line-height: 1.5;
      color: var(--muted);
    }
    .notice.warning {
      color: var(--danger);
      border-color: rgba(245,166,35,0.22);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .section-header h3 {
      margin: 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }
    .section-header p {
      margin: 0;
      color: var(--muted);
      font-size: 11px;
    }
    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }
    .action-button {
      min-height: 34px;
      padding: 0 12px;
      text-align: left;
    }
    .action-button:disabled, .mini-button:disabled {
      cursor: not-allowed;
      opacity: 0.42;
      background: #2b2b2b;
      color: #8f8f8f;
    }
    .table-shell {
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: var(--panel);
    }
    .preview-metrics-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      color: var(--muted);
      font-size: 11px;
    }
    .preview-metrics-inline span {
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--panel);
      border: 1px solid var(--border);
    }
    .session-preview-scroll {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 4px;
    }
    .session-preview-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(180px, 220px);
      gap: 12px;
      align-items: start;
      min-height: 0;
    }
    .session-column {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      min-height: 220px;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .session-kind-midi .session-column-header {
      background: linear-gradient(180deg, rgba(119,92,186,0.36), rgba(56,50,76,0.66));
    }
    .session-kind-audio .session-column-header {
      background: linear-gradient(180deg, rgba(81,112,146,0.34), rgba(49,55,66,0.66));
    }
    .session-column-return .session-column-header {
      background: linear-gradient(180deg, rgba(65,146,178,0.36), rgba(46,55,62,0.6));
    }
    .session-column-master .session-column-header {
      background: linear-gradient(180deg, rgba(245,166,35,0.32), rgba(70,56,35,0.62));
    }
    .session-kind-group .session-column-header,
    .session-kind-unknown .session-column-header {
      background: linear-gradient(180deg, rgba(108,108,108,0.28), rgba(54,54,54,0.66));
    }
    .session-column-header {
      padding: 12px 12px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .session-column-title {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: start;
    }
    .session-column-title strong {
      display: block;
      font-size: 13px;
      line-height: 1.3;
      word-break: break-word;
    }
    .session-column-header p {
      margin: 8px 0 0;
      font-size: 11px;
      color: var(--muted);
      line-height: 1.4;
    }
    .session-device-stack {
      display: grid;
      gap: 8px;
      padding: 10px;
      align-content: start;
      max-height: 560px;
      overflow-y: auto;
    }
    .session-device-card, .session-empty-card {
      background: var(--panel-2);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 10px;
      display: grid;
      gap: 4px;
      line-height: 1.35;
    }
    .session-device-card.is-rack {
      background: rgba(245,166,35,0.08);
      border-color: rgba(245,166,35,0.18);
    }
    .session-device-card strong {
      font-size: 12px;
    }
    .session-device-card span, .session-empty-card {
      color: var(--muted);
      font-size: 11px;
    }
    .kanban-scroll {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 4px;
    }
    .kanban-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(190px, 220px);
      gap: 12px;
      align-items: start;
    }
    .kanban-column {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      min-height: 260px;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .kanban-column-header {
      padding: 12px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: start;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .kanban-column-header strong {
      font-size: 13px;
      line-height: 1.3;
      word-break: break-word;
    }
    .kanban-column-body {
      display: grid;
      gap: 8px;
      padding: 10px;
      align-content: start;
      max-height: 580px;
      overflow-y: auto;
    }
    .kanban-card {
      background: var(--panel-2);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 10px;
      display: grid;
      gap: 4px;
    }
    .kanban-card strong {
      font-size: 12px;
      line-height: 1.35;
    }
    .kanban-card span {
      color: var(--muted);
      font-size: 11px;
      line-height: 1.35;
    }
    .kanban-summary-card {
      background: rgba(255,255,255,0.03);
    }
    .kanban-card.is-rack {
      background: rgba(245,166,35,0.08);
      border-color: rgba(245,166,35,0.18);
    }
    .metro-list {
      display: grid;
      gap: 12px;
    }
    .metro-row {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
    }
    .metro-track-name strong {
      display: block;
      font-size: 13px;
      line-height: 1.3;
      margin-bottom: 4px;
    }
    .metro-track-name span {
      color: var(--muted);
      font-size: 11px;
    }
    .metro-line-shell {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 4px;
    }
    .metro-line {
      display: flex;
      gap: 18px;
      align-items: center;
      min-width: max-content;
      padding: 6px 0;
    }
    .metro-stop {
      position: relative;
      min-width: 120px;
      max-width: 160px;
      padding-top: 14px;
      display: grid;
      gap: 4px;
      color: var(--text);
    }
    .metro-stop::before {
      content: "";
      position: absolute;
      top: 6px;
      left: 0;
      right: -18px;
      height: 3px;
      background: rgba(126,199,255,0.36);
      z-index: 0;
    }
    .metro-stop:last-child::before {
      right: 0;
    }
    .metro-stop strong, .metro-stop small, .metro-dot {
      position: relative;
      z-index: 1;
    }
    .metro-stop strong {
      font-size: 12px;
      line-height: 1.3;
    }
    .metro-stop small {
      color: var(--muted);
      font-size: 10px;
      line-height: 1.3;
    }
    .metro-dot {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: var(--accent-2);
      border: 2px solid #141414;
      box-shadow: 0 0 0 2px rgba(126,199,255,0.22);
    }
    .metro-stop.is-rack .metro-dot {
      background: var(--accent);
      box-shadow: 0 0 0 2px rgba(245,166,35,0.22);
    }
    .metro-stop.is-track .metro-dot {
      background: #f1f1f1;
      box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
    }
    .metro-stop.is-empty .metro-dot {
      background: #777;
      box-shadow: 0 0 0 2px rgba(255,255,255,0.08);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }
    thead th {
      position: sticky;
      top: 0;
      background: var(--panel-3);
      color: var(--accent-2);
      text-align: left;
      padding: 10px 12px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--border);
    }
    tbody td {
      padding: 10px 12px;
      border-top: 1px solid rgba(255,255,255,0.05);
      vertical-align: top;
      line-height: 1.45;
    }
    tbody tr:hover td {
      background: rgba(255,255,255,0.02);
    }
    .kind-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid var(--border);
      background: #303030;
    }
    .kind-return { border-color: rgba(126,199,255,0.4); color: var(--accent-2); }
    .kind-master { border-color: rgba(245,166,35,0.4); color: var(--accent); }
    .kind-track { border-color: rgba(255,255,255,0.14); }
    .device-list {
      display: grid;
      gap: 10px;
    }
    .device-card {
      padding: 12px;
    }
    .device-card-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: start;
      margin-bottom: 10px;
    }
    .device-card-header h3 {
      margin: 0;
      font-size: 14px;
    }
    .device-card-header p {
      margin: 4px 0 0;
      color: var(--muted);
    }
    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      padding: 4px 8px;
      border-radius: 999px;
      background: #303030;
      border: 1px solid var(--border);
      line-height: 1.35;
    }
    .chip-rack {
      background: rgba(245,166,35,0.12);
      border-color: rgba(245,166,35,0.22);
    }
    .chip-warning {
      background: rgba(255,178,107,0.1);
      border-color: rgba(255,178,107,0.22);
      color: #ffd0a6;
    }
    .rack-summary {
      margin-top: 10px;
    }
    .empty-inline {
      color: var(--muted);
    }
    .file-group {
      padding: 12px;
    }
    .file-group-list {
      display: grid;
      gap: 8px;
    }
    .file-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--panel-2);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .file-meta {
      min-width: 0;
    }
    .file-meta strong {
      display: block;
      font-size: 12px;
      margin-bottom: 2px;
    }
    .file-meta span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      overflow-wrap: anywhere;
    }
    .file-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .file-status {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .file-status.is-available { color: #8ad49b; }
    .file-status.is-missing { color: #d0a18a; }
    .mini-button {
      min-height: 28px;
      padding: 0 12px;
    }
    .empty-state {
      padding: 18px 16px;
      display: grid;
      gap: 6px;
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
      max-width: 60%;
    }
    .footer-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .close-button, .cancel-button {
      min-height: 30px;
      padding: 0 12px;
    }
    .cancel-button {
      color: var(--muted);
      background: linear-gradient(180deg, #2f2f2f, #292929);
    }
    .footer a {
      color: #7c8799;
      text-decoration: none;
      font-size: 10px;
      white-space: nowrap;
    }
    .footer a:hover {
      color: var(--accent);
    }
    @media (max-width: 860px) {
      .overview-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .hero {
        flex-direction: column;
        align-items: start;
      }
      .hero-meta, .footer small {
        max-width: none;
        text-align: left;
      }
      .footer {
        flex-direction: column;
        align-items: start;
      }
      .metro-row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Integrated Viewer · beta</p>
        <h1>Session Mapper</h1>
        <p class="subline">Lightweight internal hub for the latest Live Set export. External launcher remains available for full diagrams.</p>
      </div>
      <div class="hero-meta">
        <div>Set: ${escapeHtml(model.setName ?? "Untitled Set")}</div>
        <div>Export: ${escapeHtml(formatExportDate(model.exportedAt))}</div>
        <div>Mode: ${escapeHtml(model.scanMode)}</div>
      </div>
    </section>

    <section class="metrics" aria-label="Session metrics">
      <article class="metric"><strong>${model.metrics.tracks}</strong><span>Tracks</span></article>
      <article class="metric"><strong>${model.metrics.returns}</strong><span>Returns</span></article>
      <article class="metric"><strong>${model.metrics.devices}</strong><span>Devices</span></article>
      <article class="metric"><strong>${model.metrics.racks}</strong><span>Racks</span></article>
      <article class="metric"><strong>${model.metrics.sends}</strong><span>Sends</span></article>
    </section>

    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-session" checked>
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-kanban">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-metro">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-outputs">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-routing">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-devices">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-files">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-overview">

    <nav class="tab-bar" aria-label="Internal viewer tabs">
      <label class="tab-label" for="internal-tab-session">Session</label>
      <label class="tab-label" for="internal-tab-kanban">Kanban</label>
      <label class="tab-label" for="internal-tab-metro">Git / Metro</label>
      <label class="tab-label" for="internal-tab-outputs">Outputs</label>
      <label class="tab-label" for="internal-tab-routing">Routing</label>
      <label class="tab-label" for="internal-tab-devices">Devices</label>
      <label class="tab-label" for="internal-tab-files">Files</label>
      <label class="tab-label" for="internal-tab-overview">Overview</label>
    </nav>

    <section class="panel-shell">
      <div class="panel panel-session">
        ${renderSessionPreview(model)}
      </div>
      <div class="panel panel-kanban">
        ${renderKanbanPreview(model)}
      </div>
      <div class="panel panel-metro">
        ${renderMetroPreview(model)}
      </div>
      <div class="panel panel-overview">
        ${renderOverview(model)}
      </div>
      <div class="panel panel-outputs">
        ${renderOutputs(model)}
      </div>
      <div class="panel panel-routing">
        ${renderRouting(model)}
      </div>
      <div class="panel panel-devices">
        ${renderDevices(model)}
      </div>
      <div class="panel panel-files">
        ${renderFiles(model)}
      </div>
    </section>

    <section class="footer">
      <small>This integrated viewer stays intentionally lightweight: no Mermaid runtime, no embedded SVG, no heavy report rendering inside Live. Use the external launcher for full diagrams.</small>
      <div class="footer-actions">
        <button id="refresh-viewer" class="cancel-button" type="button">Refresh Metadata</button>
        <button id="cancel-viewer" class="cancel-button" type="button">Cancel</button>
        <button id="close-viewer" class="close-button" type="button">Close</button>
      </div>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </section>
  </div>
</body>
</html>`;
}
