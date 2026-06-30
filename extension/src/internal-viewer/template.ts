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
  deviceItems: InternalViewerDeviceDescriptor[];
  rackItems: InternalViewerDeviceDescriptor[];
  sectionType: "track" | "return" | "master";
}

export type InternalViewerDeviceCategory =
  | "instrument"
  | "midi-effect"
  | "audio-effect"
  | "max-for-live"
  | "rack"
  | "unknown";

export interface InternalViewerDeviceDescriptor {
  name: string;
  summary: string;
  isRack: boolean;
  category: InternalViewerDeviceCategory;
  categoryLabel: string;
  categoryBadge: string;
  categorySource: "sdk" | "inferred" | "manual" | "unknown";
  categoryConfidence: "high" | "medium" | "low";
  m4lKind?: "midi" | "audio" | "instrument" | "unknown";
}

export interface InternalViewerSessionPreviewDeviceCard extends InternalViewerDeviceDescriptor {}

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
  manualRoutingStale: boolean;
  manualRoutingSetMatch: boolean;
  manualRoutingWarnings: string[];
  routingOverridesPath: string;
  routingOverridesExists: boolean;
  routingOverridesModifiedAt: string | null;
  sessionExportComparedAt: string | null;
  missingFromCurrent: string[];
  missingFromOverrides: string[];
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

function renderDeviceBadge(device: InternalViewerDeviceDescriptor): string {
  const sourceTitle = device.categorySource === "inferred"
    ? ` title="Category inferred from device name/track context"`
    : "";
  const sourceTag =
    device.categorySource === "manual" || device.categorySource === "unknown"
      ? `<span class="device-source device-source-${escapeHtml(device.categorySource)}" title="Device category source: ${escapeHtml(device.categorySource)}">${escapeHtml(device.categorySource)}</span>`
      : "";

  return `<div class="device-badge-row"${sourceTitle}>
    <span class="device-type-badge device-type-${escapeHtml(device.category)}">${escapeHtml(device.categoryBadge)}</span>
    ${sourceTag}
  </div>`;
}

function renderDeviceLegend(): string {
  return `<div class="device-legend">
    <span class="legend-title">Legend</span>
    <span class="device-type-badge device-type-instrument">INST</span>
    <span class="device-type-badge device-type-midi-effect">MIDI FX</span>
    <span class="device-type-badge device-type-audio-effect">AUDIO FX</span>
    <span class="device-type-badge device-type-max-for-live">M4L / M4L MIDI</span>
    <span class="device-type-badge device-type-rack">RACK</span>
    <span class="device-type-badge device-type-unknown">?</span>
    <small>Device categories may be inferred or manually overridden when the SDK does not expose a stable device class.</small>
  </div>`;
}

function renderQuickOpenButton(link: InternalViewerQuickLink): string {
  const disabledAttr = link.exists ? "" : " disabled";
  const toneClass = link.key === "launcher" ? " is-primary" : "";
  return `<button class="action-button${toneClass}" type="button" data-link-key="${escapeHtml(link.key)}"${disabledAttr}>${escapeHtml(link.label)}</button>`;
}

function renderFileEntry(file: InternalViewerFileEntry): string {
  const disabledAttr = file.exists ? "" : " disabled";
  const toneClass = file.key === "launcher" ? " is-primary" : "";
  return `<div class="file-row">
    <div class="file-meta">
      <strong>${escapeHtml(file.label)}</strong>
      <span>${escapeHtml(file.fileName)}</span>
    </div>
    <div class="file-actions">
      <span class="file-status ${file.exists ? "is-available" : "is-missing"}">${file.exists ? "available" : "missing"}</span>
      <button class="mini-button${toneClass}" type="button" data-link-key="${escapeHtml(file.key)}"${disabledAttr}>Open</button>
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
        <span class="label">Viewer</span>
        <strong>${escapeHtml(model.internalVisualPreviewEnabled ? "Internal preview enabled" : "Metadata only")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Device types</span>
        <strong>INST / MIDI FX / AUDIO FX / M4L / RACK / ?</strong>
      </article>
    </div>
    <div class="notice">${escapeHtml(model.statusMessage)}</div>
    ${renderDeviceLegend()}
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
    ${renderDeviceLegend()}
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
                          (device) => `<article class="session-device-card ${device.isRack ? "is-rack" : ""} device-tone-${escapeHtml(device.category)}">
                            ${renderDeviceBadge(device)}
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
    <div class="empty-state">
      <strong>Kanban preview moved to external diagrams.</strong>
      <span>Use the external launcher to open Mermaid Kanban exports.</span>
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
    ${renderDeviceLegend()}
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
                    (device) => `<article class="metro-stop ${device.isRack ? "is-rack" : ""} metro-${escapeHtml(device.category)}">
                      <span class="metro-dot metro-dot-${escapeHtml(device.category)}"></span>
                      <strong>${escapeHtml(truncateLabel(device.name, 18))}</strong>
                      <small>${escapeHtml(device.categoryBadge)} · ${escapeHtml(truncateLabel(device.summary, 22))}</small>
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
      Routing I/O not exposed by current SDK version.
    </div>
    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Track</th>
            <th>Kind</th>
            <th>Input</th>
            <th>Output</th>
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
                <td>${escapeHtml(row.audioFrom)}</td>
                <td>${escapeHtml(row.audioTo)}</td>
                <td>${escapeHtml(row.sends)}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${
      model.hasMissingRoutingData
        ? `<div class="notice warning">Routing I/O non disponible dans cette version du SDK.</div>`
        : ""
    }`;
}

function renderDevices(model: InternalViewerModel): string {
  if (!model.hasExport || model.deviceTracks.length === 0) {
    return `<div class="empty-state">
      <strong>No devices to display yet.</strong>
      <span>The internal viewer only reflects the latest exported JSON.</span>
    </div>`;
  }

  return `<div class="device-list">
    ${renderDeviceLegend()}
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
          <div class="chip-group chip-group-devices">
            ${
              track.deviceItems.length > 0
                ? track.deviceItems.map((item) => `<span class="chip chip-device device-tone-${escapeHtml(item.category)}">
                    ${renderDeviceBadge(item)}
                    <strong>${escapeHtml(truncateLabel(item.name, 24))}</strong>
                    <em>${escapeHtml(truncateLabel(item.summary, 34))}</em>
                  </span>`).join("")
                : `<span class="empty-inline">No devices</span>`
            }
          </div>
          ${
            track.rackItems.length > 0
              ? `<div class="rack-summary">
                  <span class="label">Racks</span>
                  <div class="chip-group chip-group-devices">${track.rackItems
                    .map((item) => `<span class="chip chip-device chip-rack device-tone-rack">
                      ${renderDeviceBadge(item)}
                      <strong>${escapeHtml(truncateLabel(item.name, 24))}</strong>
                      <em>${escapeHtml(truncateLabel(item.summary, 34))}</em>
                    </span>`)
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
      color-scheme: light dark;
      --live-bg: #8f8f8f;
      --live-panel: #b7b7b7;
      --live-panel-light: #c7c7c7;
      --live-panel-dark: #727272;
      --live-panel-deep: #616161;
      --live-border: #5e5e5e;
      --live-text: #111111;
      --live-muted: #383838;
      --live-orange: #f5a000;
      --live-orange-deep: #db8f00;
      --live-cyan: #00cfe8;
      --live-magenta: #d26ecf;
      --live-purple: #9384ff;
      --track-midi: #9bb4e8;
      --device-instrument: #f5a623;
      --device-midi-fx: #7755cc;
      --device-audio-fx: #00bcd4;
      --device-m4l: #ff4fd8;
      --device-rack: #d48a00;
      --device-unknown: #777777;
      --live-grid: rgba(0, 0, 0, 0.18);
      --live-shadow: rgba(0, 0, 0, 0.14);
      --live-slot: #d0d0d0;
      --live-slot-muted: #d7d7d7;
      --live-rack: #f3d099;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      background: var(--live-bg);
      color: var(--live-text);
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 12px;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background:
        linear-gradient(180deg, #9c9c9c 0%, #898989 100%);
      padding: 10px;
    }
    .shell {
      height: calc(100vh - 20px);
      max-width: 95vw;
      max-height: 92vh;
      display: grid;
      grid-template-rows: auto auto auto minmax(0, 1fr) auto;
      gap: 8px;
    }
    .hero, .metrics, .tab-bar, .panel-shell, .footer {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 4px var(--live-shadow);
    }
    .hero {
      padding: 9px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background: linear-gradient(180deg, #7a7a7a, #6f6f6f);
      color: #101010;
    }
    .eyebrow {
      margin: 0 0 3px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(17,17,17,0.7);
      font-size: 9px;
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: 18px;
      line-height: 1;
      letter-spacing: -0.02em;
      font-weight: 700;
    }
    .subline {
      margin: 4px 0 0;
      color: rgba(17,17,17,0.76);
      line-height: 1.35;
      font-size: 11px;
      max-width: 60ch;
    }
    .hero-meta {
      display: grid;
      grid-auto-flow: column;
      gap: 14px;
      align-items: center;
      color: rgba(17,17,17,0.76);
      font-size: 10px;
      line-height: 1.3;
      text-align: left;
    }
    .hero-meta div {
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 6px;
      padding: 6px;
      background: var(--live-panel-dark);
    }
    .metric {
      background: linear-gradient(180deg, #c9c9c9, #b8b8b8);
      border: 1px solid var(--live-border);
      padding: 8px 6px;
      text-align: center;
      border-radius: 3px;
      transition: border-color 120ms ease, background 120ms ease;
    }
    .metric:hover {
      border-color: var(--live-orange);
      background: linear-gradient(180deg, #d3d3d3, #c1c1c1);
    }
    .metric strong {
      display: block;
      font-size: 19px;
      margin-bottom: 2px;
      color: var(--live-text);
      line-height: 1;
    }
    .metric span {
      color: var(--live-muted);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
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
      gap: 6px;
      padding: 6px;
      flex-wrap: wrap;
      background: linear-gradient(180deg, #7c7c7c, #6e6e6e);
    }
    .tab-label, .action-button, .mini-button, .close-button, .cancel-button {
      border-radius: 4px;
      border: 1px solid var(--live-border);
      color: var(--live-text);
      background: linear-gradient(180deg, #909090, #7d7d7d);
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
      font-family: inherit;
    }
    .tab-label:hover, .action-button:hover, .mini-button:hover, .close-button:hover, .cancel-button:hover {
      background: linear-gradient(180deg, #a1a1a1, #8a8a8a);
      border-color: #4f4f4f;
    }
    .tab-label {
      min-height: 28px;
      padding: 0 12px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      font-weight: 700;
    }
    #internal-tab-session:checked ~ .tab-bar label[for="internal-tab-session"],
    #internal-tab-metro:checked ~ .tab-bar label[for="internal-tab-metro"],
    #internal-tab-outputs:checked ~ .tab-bar label[for="internal-tab-outputs"],
    #internal-tab-devices:checked ~ .tab-bar label[for="internal-tab-devices"],
    #internal-tab-files:checked ~ .tab-bar label[for="internal-tab-files"],
    #internal-tab-overview:checked ~ .tab-bar label[for="internal-tab-overview"] {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-deep));
      color: #111;
      border-color: #865100;
    }
    .panel-shell {
      min-height: 0;
      padding: 8px;
      overflow: auto;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.08), transparent 30%),
        linear-gradient(180deg, #bdbdbd, #b5b5b5);
    }
    .panel {
      display: none;
      gap: 8px;
      align-content: start;
    }
    #internal-tab-session:checked ~ .panel-shell .panel-session,
    #internal-tab-metro:checked ~ .panel-shell .panel-metro,
    #internal-tab-outputs:checked ~ .panel-shell .panel-outputs,
    #internal-tab-devices:checked ~ .panel-shell .panel-devices,
    #internal-tab-files:checked ~ .panel-shell .panel-files,
    #internal-tab-overview:checked ~ .panel-shell .panel-overview {
      display: grid;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
    .overview-card, .device-card, .notice, .empty-state, .file-group {
      background: var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-radius: 4px;
    }
    .overview-card {
      padding: 10px;
    }
    .overview-card .label, .rack-summary .label {
      display: block;
      color: var(--live-muted);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .overview-card strong {
      display: block;
      font-size: 12px;
      line-height: 1.35;
      word-break: break-word;
    }
    .notice {
      padding: 9px 10px;
      line-height: 1.45;
      color: var(--live-muted);
      background: #c5c5c5;
    }
    .notice.warning {
      color: #5a3200;
      border-color: #a87d37;
      background: #d8c29c;
    }
    .device-legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border: 1px solid var(--live-border);
      border-radius: 4px;
      background: #d1d1d1;
      color: var(--live-muted);
      font-size: 10px;
    }
    .legend-title {
      font-weight: 700;
      color: var(--live-text);
      margin-right: 4px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .device-legend small {
      color: var(--live-muted);
      line-height: 1.3;
    }
    .device-badge-row {
      display: flex;
      align-items: center;
      gap: 5px;
      min-height: 14px;
    }
    .device-type-badge {
      display: inline-flex;
      align-items: center;
      min-height: 16px;
      padding: 0 5px;
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.22);
      font-size: 8px;
      line-height: 1;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #111;
    }
    .device-type-instrument {
      background: rgba(245,166,35,0.42);
      border-color: rgba(153,102,0,0.55);
    }
    .device-type-midi-effect {
      background: rgba(122,140,255,0.34);
      border-color: rgba(70,79,155,0.5);
    }
    .device-type-audio-effect {
      background: rgba(0,188,212,0.28);
      border-color: rgba(0,106,120,0.5);
    }
    .device-type-max-for-live {
      background: rgba(255,79,216,0.28);
      border-color: rgba(148,28,118,0.5);
    }
    .device-type-rack {
      background: rgba(212,138,0,0.3);
      border-color: rgba(130,84,0,0.56);
    }
    .device-type-unknown {
      background: rgba(119,119,119,0.24);
      border-color: rgba(79,79,79,0.48);
    }
    .device-source {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: rgba(17,17,17,0.56);
    }
    .device-source-manual {
      color: rgba(120, 38, 102, 0.88);
    }
    .device-source-sdk {
      color: rgba(17,17,17,0.68);
    }
    .device-source-unknown {
      color: rgba(17,17,17,0.42);
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
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--live-text);
    }
    .section-header p {
      margin: 0;
      color: var(--live-muted);
      font-size: 10px;
    }
    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }
    .action-button {
      min-height: 32px;
      padding: 0 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
    }
    .action-button.is-primary,
    .mini-button.is-primary,
    .close-button {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-deep));
      border-color: #865100;
      color: #111;
    }
    .action-button.is-primary:hover,
    .mini-button.is-primary:hover,
    .close-button:hover {
      background: linear-gradient(180deg, #ffb019, #e39500);
    }
    .action-button:disabled, .mini-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
      background: #a5a5a5;
      color: #5f5f5f;
      border-color: #7d7d7d;
    }
    .table-shell {
      overflow: auto;
      border: 1px solid var(--live-border);
      border-radius: 4px;
      background: #cbcbcb;
    }
    .preview-metrics-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      color: var(--live-muted);
      font-size: 10px;
    }
    .preview-metrics-inline span {
      padding: 3px 7px;
      border-radius: 3px;
      background: #cfcfcf;
      border: 1px solid var(--live-border);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }
    .session-preview-scroll,
    .kanban-scroll,
    .metro-line-shell {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 2px;
    }
    .session-preview-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(176px, 210px);
      gap: 8px;
      align-items: start;
      min-height: 0;
    }
    .session-column,
    .kanban-column {
      background:
        repeating-linear-gradient(
          to bottom,
          rgba(0,0,0,0.02) 0,
          rgba(0,0,0,0.02) 27px,
          rgba(0,0,0,0.08) 28px
        ),
        var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-radius: 3px;
      overflow: hidden;
      min-height: 250px;
      display: grid;
      grid-template-rows: auto 1fr;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .session-column:hover,
    .kanban-column:hover {
      border-color: var(--live-orange);
      box-shadow: inset 0 0 0 1px rgba(245,160,0,0.38);
    }
    .session-kind-midi .session-column-header,
    .session-kind-midi .kanban-column-header {
      background: linear-gradient(180deg, #adc2f0, var(--track-midi));
    }
    .session-kind-audio .session-column-header,
    .session-kind-audio .kanban-column-header {
      background: linear-gradient(180deg, #c5cf8d, #b0ba78);
    }
    .session-column-return .session-column-header,
    .session-column-return .kanban-column-header {
      background: linear-gradient(180deg, #8de0ec, #72cad5);
    }
    .session-column-master .session-column-header,
    .session-column-master .kanban-column-header {
      background: linear-gradient(180deg, #dca1ce, #c989ba);
    }
    .session-kind-group .session-column-header,
    .session-kind-group .kanban-column-header,
    .session-kind-unknown .session-column-header,
    .session-kind-unknown .kanban-column-header {
      background: linear-gradient(180deg, #cacaca, #b7b7b7);
    }
    .session-column-header,
    .kanban-column-header {
      padding: 8px 8px 7px;
      border-bottom: 1px solid rgba(0,0,0,0.22);
    }
    .session-column-title {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      align-items: start;
    }
    .session-column-title strong,
    .kanban-column-header strong {
      display: block;
      font-size: 12px;
      line-height: 1.25;
      word-break: break-word;
    }
    .session-column-header p {
      margin: 5px 0 0;
      font-size: 10px;
      color: rgba(17,17,17,0.72);
      line-height: 1.35;
      font-weight: 600;
    }
    .session-device-stack,
    .kanban-column-body {
      display: grid;
      gap: 6px;
      padding: 8px;
      align-content: start;
      max-height: 590px;
      overflow-y: auto;
    }
    .session-device-card,
    .session-empty-card,
    .kanban-card {
      background: var(--live-slot);
      border: 1px solid rgba(0,0,0,0.2);
      border-radius: 2px;
      padding: 8px;
      display: grid;
      gap: 3px;
      line-height: 1.28;
      min-height: 46px;
    }
    .device-tone-instrument {
      background: linear-gradient(180deg, rgba(245,166,35,0.22), rgba(208,208,208,0.96));
    }
    .device-tone-midi-effect {
      background: linear-gradient(180deg, rgba(122,140,255,0.2), rgba(208,208,208,0.96));
    }
    .device-tone-audio-effect {
      background: linear-gradient(180deg, rgba(0,188,212,0.18), rgba(208,208,208,0.96));
    }
    .device-tone-max-for-live {
      background: linear-gradient(180deg, rgba(255,79,216,0.2), rgba(208,208,208,0.96));
    }
    .device-tone-rack {
      background: linear-gradient(180deg, rgba(212,138,0,0.24), rgba(243,208,153,0.96));
      border-color: #b77900;
      box-shadow: inset 0 0 0 1px rgba(245,160,0,0.16);
    }
    .device-tone-unknown {
      background: linear-gradient(180deg, rgba(119,119,119,0.16), rgba(208,208,208,0.96));
    }
    .session-device-card.is-rack,
    .kanban-card.is-rack {
      background: var(--live-rack);
      border-color: #b77900;
      box-shadow: inset 0 0 0 1px rgba(245,160,0,0.16);
    }
    .session-device-card strong,
    .kanban-card strong {
      font-size: 11px;
      color: var(--live-text);
    }
    .session-device-card span,
    .kanban-card span,
    .session-empty-card {
      color: var(--live-muted);
      font-size: 10px;
    }
    .kanban-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(185px, 216px);
      gap: 8px;
      align-items: start;
    }
    .kanban-summary-card {
      background: #d6d6d6;
    }
    .metro-list {
      display: grid;
      gap: 8px;
    }
    .metro-row {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.09), transparent 34%),
        var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-radius: 4px;
      padding: 10px;
      display: grid;
      grid-template-columns: 168px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .metro-track-name strong {
      display: block;
      font-size: 12px;
      line-height: 1.25;
      margin-bottom: 3px;
    }
    .metro-track-name span {
      color: var(--live-muted);
      font-size: 10px;
    }
    .metro-line {
      display: flex;
      gap: 16px;
      align-items: center;
      min-width: max-content;
      padding: 8px 0 4px;
    }
    .metro-stop {
      position: relative;
      min-width: 116px;
      max-width: 156px;
      padding-top: 14px;
      display: grid;
      gap: 3px;
      color: var(--live-text);
    }
    .metro-stop::before {
      content: "";
      position: absolute;
      top: 5px;
      left: 0;
      right: -16px;
      height: 2px;
      background: rgba(0, 0, 0, 0.26);
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
      font-size: 11px;
      line-height: 1.2;
    }
    .metro-stop small {
      color: var(--live-muted);
      font-size: 9px;
      line-height: 1.25;
    }
    .metro-dot {
      width: 11px;
      height: 11px;
      border-radius: 999px;
      background: var(--live-cyan);
      border: 1px solid rgba(17,17,17,0.6);
      box-shadow: 0 0 0 2px rgba(0,0,0,0.12);
    }
    .metro-stop.is-rack .metro-dot {
      background: var(--live-orange);
    }
    .metro-dot-instrument {
      background: var(--device-instrument);
    }
    .metro-dot-midi-effect {
      background: var(--device-midi-fx);
    }
    .metro-dot-audio-effect {
      background: var(--device-audio-fx);
    }
    .metro-dot-max-for-live {
      background: var(--device-m4l);
    }
    .metro-dot-rack {
      background: var(--device-rack);
      box-shadow: 0 0 0 2px rgba(212,138,0,0.18);
    }
    .metro-dot-unknown {
      background: var(--device-unknown);
    }
    .metro-stop.is-track .metro-dot {
      background: #f3f3f3;
    }
    .metro-stop.is-empty .metro-dot {
      background: #8d8d8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
      color: var(--live-text);
    }
    thead th {
      position: sticky;
      top: 0;
      background: var(--live-panel-deep);
      color: #f2f2f2;
      text-align: left;
      padding: 9px 10px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--live-border);
    }
    tbody td {
      padding: 8px 10px;
      border-top: 1px solid rgba(0,0,0,0.12);
      vertical-align: top;
      line-height: 1.4;
      background: rgba(255,255,255,0.06);
    }
    tbody tr:nth-child(even) td {
      background: rgba(0,0,0,0.03);
    }
    tbody tr:hover td {
      background: rgba(245,160,0,0.1);
    }
    .kind-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid rgba(0,0,0,0.22);
      background: rgba(255,255,255,0.34);
      font-weight: 700;
      color: var(--live-text);
    }
    .kind-return { border-color: rgba(0, 122, 140, 0.42); background: rgba(0, 207, 232, 0.16); }
    .kind-master { border-color: rgba(150, 65, 135, 0.42); background: rgba(210, 110, 207, 0.16); }
    .kind-track { border-color: rgba(0,0,0,0.18); }
    .device-list {
      display: grid;
      gap: 8px;
    }
    .device-card {
      padding: 10px;
      background: #c3c3c3;
    }
    .device-card-header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: start;
      margin-bottom: 8px;
    }
    .device-card-header h3 {
      margin: 0;
      font-size: 12px;
      line-height: 1.2;
    }
    .device-card-header p {
      margin: 3px 0 0;
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.25;
    }
    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip-group-devices {
      gap: 8px;
    }
    .chip {
      padding: 5px 8px;
      border-radius: 2px;
      background: #d5d5d5;
      border: 1px solid rgba(0,0,0,0.18);
      line-height: 1.25;
      font-size: 10px;
      min-height: 24px;
      display: inline-flex;
      align-items: center;
    }
    .chip-device {
      display: grid;
      align-content: start;
      gap: 4px;
      min-width: 148px;
      max-width: 220px;
      background: #d6d6d6;
      padding: 7px 8px;
    }
    .chip-device strong {
      font-size: 10px;
      line-height: 1.2;
      color: var(--live-text);
    }
    .chip-device em {
      font-style: normal;
      font-size: 9px;
      line-height: 1.25;
      color: var(--live-muted);
    }
    .chip-rack {
      background: var(--live-rack);
      border-color: #b77900;
    }
    .rack-summary {
      margin-top: 8px;
    }
    .empty-inline {
      color: var(--live-muted);
      font-size: 10px;
    }
    .file-group {
      padding: 10px;
      background: #c2c2c2;
    }
    .file-group-list {
      display: grid;
      gap: 6px;
    }
    .file-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 3px;
      background: #d3d3d3;
      border: 1px solid rgba(0,0,0,0.14);
    }
    .file-meta {
      min-width: 0;
    }
    .file-meta strong {
      display: block;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .file-meta span {
      display: block;
      color: var(--live-muted);
      font-size: 10px;
      overflow-wrap: anywhere;
    }
    .file-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .file-status {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--live-muted);
      font-weight: 700;
    }
    .file-status.is-available { color: #2f5e2f; }
    .file-status.is-missing { color: #7c5c30; }
    .mini-button {
      min-height: 24px;
      padding: 0 10px;
      font-size: 10px;
      font-weight: 700;
    }
    .empty-state {
      padding: 14px 14px;
      display: grid;
      gap: 6px;
      color: var(--live-muted);
      background: #cfcfcf;
    }
    .footer {
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      background: linear-gradient(180deg, #b2b2b2, #aaaaaa);
    }
    .footer small {
      color: var(--live-muted);
      font-size: 9px;
      line-height: 1.35;
      max-width: 60%;
    }
    .footer-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .close-button, .cancel-button {
      min-height: 28px;
      padding: 0 11px;
      font-size: 10px;
      font-weight: 700;
    }
    .cancel-button {
      color: var(--live-text);
      background: linear-gradient(180deg, #b8b8b8, #a5a5a5);
    }
    .footer a {
      color: rgba(17,17,17,0.55);
      text-decoration: none;
      font-size: 9px;
      white-space: nowrap;
    }
    .footer a:hover {
      color: var(--live-orange-deep);
    }
    @media (max-width: 1024px) {
      .hero {
        flex-direction: column;
        align-items: start;
      }
      .hero-meta {
        grid-auto-flow: row;
        gap: 4px;
      }
    }
    @media (max-width: 860px) {
      .overview-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .hero-meta, .footer small {
        max-width: none;
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
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-metro">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-outputs">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-devices">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-files">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-overview">

    <nav class="tab-bar" aria-label="Internal viewer tabs">
      <label class="tab-label" for="internal-tab-session">Session</label>
      <label class="tab-label" for="internal-tab-metro">Git / Metro</label>
      <label class="tab-label" for="internal-tab-outputs">Outputs</label>
      <label class="tab-label" for="internal-tab-devices">Devices</label>
      <label class="tab-label" for="internal-tab-files">Files</label>
      <label class="tab-label" for="internal-tab-overview">Overview</label>
    </nav>

    <section class="panel-shell">
      <div class="panel panel-session">
        ${renderSessionPreview(model)}
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
