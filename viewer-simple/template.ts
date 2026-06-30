export interface RoutingInfo {
  type: string | null;
  channel: string | null;
}

export interface TrackRoutingInfo {
  source: "sdk" | "manual" | "none";
  audioFrom: string | null;
  audioTo: string | null;
  midiFrom: string | null;
  midiTo: string | null;
  monitor: string | null;
  group: string | null;
  notes: string;
}

export interface ManualRoutingConnection {
  from: string;
  to: string;
  type: "audio" | "midi" | "sidechain" | "unknown";
  label: string;
}

export interface ManualRoutingSidechain {
  targetTrack: string;
  targetDevice: string;
  sourceTrack: string;
  enabled: boolean | null;
  notes: string;
}

export interface ManualRoutingState {
  status: "missing" | "loaded" | "invalid";
  stale: boolean;
  setMatch: boolean;
  sourcePath: string;
  sourceModifiedAt: string | null;
  sessionMapModifiedAt: string | null;
  currentTrackCount: number;
  overrideTrackCount: number;
  missingFromCurrent: string[];
  missingFromOverrides: string[];
  warnings: string[];
  tracks: Record<string, unknown>;
  sidechains: ManualRoutingSidechain[];
  connections: ManualRoutingConnection[];
}

export interface DeviceParameterInfo {
  id: string;
  index: number;
  name: string;
  value: number | null;
  min: number | null;
  max: number | null;
  isQuantized: boolean | null;
  isMacro: boolean;
}

export interface ChainInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  note?: string | null;
  devices: DeviceInfo[];
  volume: number | null;
  pan: number | null;
  isMuted: boolean | null;
  isSoloed: boolean | null;
  isActive: boolean | null;
}

export interface PadInfo {
  id: string;
  index: number;
  name: string;
  note: string | null;
  devices: DeviceInfo[];
  volume: number | null;
  pan: number | null;
  isMuted: boolean | null;
  isSoloed: boolean | null;
  isActive: boolean | null;
}

export interface DeviceInfo {
  id: string;
  index: number;
  name: string;
  type: string;
  enabled?: boolean | null;
  parameters?: DeviceParameterInfo[];
  chains?: ChainInfo[];
  pads?: PadInfo[];
}

export interface SendInfo {
  id: string;
  index: number;
  name: string;
  value: number | null;
}

export interface TrackInfo {
  id: string;
  index: number;
  name: string;
  kind: "audio" | "midi" | "group" | "return" | "master" | "unknown";
  color: string | null;
  isMuted: boolean | null;
  isSoloed: boolean | null;
  isArmed: boolean | null;
  groupTrackId: string | null;
  input: RoutingInfo;
  output: RoutingInfo;
  routing?: TrackRoutingInfo;
  devices: DeviceInfo[];
  sends: SendInfo[];
}

export interface SessionMap {
  version: string;
  exportedAt: string;
  set: { name: string | null; tempo: number | null };
  tracks: TrackInfo[];
  returnTracks: TrackInfo[];
  masterTrack: TrackInfo | null;
  manualRouting?: ManualRoutingState;
}

export interface DiagnosticProperty {
  property: string;
  status: "available" | "missing" | "error";
  value?: unknown;
  error?: string;
}

export interface DiagnosticObject {
  objectType: string;
  id: string | null;
  name: string | null;
  availableProperties: string[];
  properties: DiagnosticProperty[];
}

export interface DiagnosticDevice extends DiagnosticObject {
  index: number;
  isRack: boolean;
  chains: Array<DiagnosticObject & { devices?: DiagnosticDevice[]; mixer?: DiagnosticObject | null }>;
}

export interface DiagnosticTrack extends DiagnosticObject {
  index: number;
  role: string;
  detectedType: string;
  devices: DiagnosticDevice[];
  mixer: DiagnosticObject | null;
}

export interface SdkDiagnostic {
  version: string;
  generatedAt: string;
  sdkApiVersion: string;
  summary: {
    tracksInspected: number;
    routingsFound: number;
    devicesInspected: number;
    racksDetected: number;
    chainsDetected: number;
    propertyErrors: number;
  };
  song: DiagnosticObject;
  tracks: DiagnosticTrack[];
}

function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function renderTemplate(
  data: SessionMap,
  styles: string,
  diagnostic: SdkDiagnostic | null = null,
): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Ableton Session Mapper — ${escapeHtml(data.set.name ?? "Untitled Set")}</title>
  <style>${styles}</style>
</head>
<body class="mode-detailed">
  <div class="ambient-grid" aria-hidden="true"></div>
  <header class="masthead">
    <div class="brand-block">
      <span class="live-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div>
        <p class="eyebrow">Ableton Session Mapper / JSON ${escapeHtml(data.version)}</p>
        <h1 id="project-name">Session Map</h1>
      </div>
    </div>
    <p class="export-time" id="export-time"></p>
  </header>

  <nav class="viewer-actions" aria-label="Actions du viewer">
    <span>LIVE SET REPORT</span>
    <div class="view-mode-switch" role="group" aria-label="Mode d'affichage">
      <button type="button" data-mode="compact" onclick="setViewMode('compact')">Compact</button>
      <button type="button" data-mode="detailed" onclick="setViewMode('detailed')">Detailed</button>
    </div>
    <button type="button" onclick="requestViewerAction('refresh')">↻ Refresh</button>
    <button type="button" onclick="requestViewerAction('export-html')">⇩ Export HTML</button>
    <button class="debug-action" type="button" onclick="requestViewerAction('debug-sdk-data')">⌁ Debug SDK Data</button>
    <button class="close-action" type="button" onclick="requestViewerAction('close')">Close</button>
  </nav>

  <main>
    <section class="telemetry" aria-label="Résumé de la session">
      <article><span class="metric-value" id="tempo">—</span><span class="metric-label">BPM</span></article>
      <article><span class="metric-value" id="track-count">0</span><span class="metric-label">Tracks</span></article>
      <article><span class="metric-value" id="device-count">0</span><span class="metric-label">Devices</span></article>
      <article><span class="metric-value" id="send-count">0</span><span class="metric-label">Sends</span></article>
    </section>

    <div id="session-sections" class="session-sections"></div>
    <section id="sdk-diagnostic" class="diagnostic-section" aria-labelledby="diagnostic-title"></section>
  </main>

  <footer>
    <span>STATIC LOCAL REPORT</span>
    <span class="footer-line"></span>
    <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
  </footer>

  <script>
    const session = ${safeJsonForScript(data)};
    const sdkDiagnostic = ${safeJsonForScript(diagnostic)};

    function requestViewerAction(action) {
      const message = {
        method: "close_and_send",
        params: [JSON.stringify({ action })],
      };
      if (window.webkit?.messageHandlers?.live) {
        window.webkit.messageHandlers.live.postMessage(message);
        return;
      }
      if (window.chrome?.webview) {
        window.chrome.webview.postMessage(message);
        return;
      }
      if (action === "refresh") window.location.reload();
      if (action === "debug-sdk-data") {
        document.getElementById("sdk-diagnostic")?.scrollIntoView({ behavior: "smooth" });
      }
      if (action === "export-html") {
        const blob = new Blob([document.documentElement.outerHTML], { type: "text/html" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "session-map.html";
        link.click();
        URL.revokeObjectURL(link.href);
      }
      if (action === "close") window.close();
    }

    function setViewMode(mode) {
      const normalizedMode = mode === "compact" ? "compact" : "detailed";
      document.body.classList.toggle("mode-compact", normalizedMode === "compact");
      document.body.classList.toggle("mode-detailed", normalizedMode === "detailed");
      document.querySelectorAll("[data-mode]").forEach((button) => {
        const isActive = button.getAttribute("data-mode") === normalizedMode;
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      try {
        localStorage.setItem("ableton-session-mapper:view-mode", normalizedMode);
      } catch {}
    }

    const escapeHtml = (value) => String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    const allTracks = [
      ...(Array.isArray(session.tracks) ? session.tracks : []),
      ...(Array.isArray(session.returnTracks) ? session.returnTracks : []),
      ...(session.masterTrack ? [session.masterTrack] : []),
    ];
    const manualRouting = session.manualRouting || {
      status: "missing",
      stale: false,
      setMatch: false,
      sourcePath: "exports/routing-overrides.json",
      sourceModifiedAt: null,
      sessionMapModifiedAt: null,
      currentTrackCount: 0,
      overrideTrackCount: 0,
      missingFromCurrent: [],
      missingFromOverrides: [],
      warnings: [],
      tracks: {},
      sidechains: [],
      connections: [],
    };

    const routingText = (routing) => {
      const parts = [routing?.type, routing?.channel].filter(Boolean);
      return parts.length ? parts.join(" / ") : "Routing I/O non disponible dans cette version du SDK";
    };
    const manualValue = (value) => value && String(value).trim().length ? String(value).trim() : "—";
    const trackRoutingSource = (track) => track?.routing?.source === "manual" ? "MANUAL" : track?.routing?.source === "sdk" ? "SDK" : "NONE";
    const effectiveManualRouting = (track) => ({
      midiFrom: manualValue(track?.routing?.midiFrom),
      midiTo: manualValue(track?.routing?.midiTo),
      audioFrom: manualValue(track?.routing?.audioFrom),
      audioTo: manualValue(track?.routing?.audioTo),
      monitor: manualValue(track?.routing?.monitor),
      group: manualValue(track?.routing?.group),
      notes: manualValue(track?.routing?.notes),
      source: trackRoutingSource(track),
    });

    const formatValue = (value, digits = 3) => typeof value === "number" ? value.toFixed(digits) : "—";
    const asArray = (value) => Array.isArray(value) ? value : [];

    const countDevicesDeep = (devices) => asArray(devices).reduce((sum, device) => {
      const chains = asArray(device?.chains);
      const pads = asArray(device?.pads);
      const nestedDevices = chains.reduce((nestedSum, chain) => nestedSum + countDevicesDeep(chain?.devices), 0) +
        pads.reduce((nestedSum, pad) => nestedSum + countDevicesDeep(pad?.devices), 0);
      return sum + 1 + nestedDevices;
    }, 0);

    const countTrackDevices = (tracks) => asArray(tracks).reduce(
      (sum, track) => sum + countDevicesDeep(track?.devices),
      0,
    );

    const badge = (label, tone = "default") =>
      '<span class="node-badge tone-' + tone + '">' + escapeHtml(label) + '</span>';

    const stateLeds = (track) => [
      ["M", track.isMuted, "Muted"],
      ["S", track.isSoloed, "Solo"],
      ["A", track.isArmed, "Armed"],
    ].map(([letter, active, label]) =>
      '<span class="state-led ' + (active ? "is-active" : "") + '" title="' + label + '">' + letter + '</span>'
    ).join("");

    const parameterStrip = (parameters) => {
      const items = asArray(parameters);
      if (!items.length) return '<p class="empty-state compact">No readable macros</p>';
      return '<div class="parameter-strip">' + items.map((parameter) =>
        '<div class="parameter-chip">' +
          badge(parameter.isMacro ? "Macro" : "Param", parameter.isMacro ? "macro" : "device") +
          '<strong>' + escapeHtml(parameter.name) + '</strong>' +
          '<em>' + escapeHtml(formatValue(parameter.value)) + '</em>' +
        '</div>'
      ).join("") + '</div>';
    };

    const chainState = (chain) => {
      const parts = [
        chain?.volume !== null && chain?.volume !== undefined ? "Vol " + formatValue(chain.volume) : null,
        chain?.pan !== null && chain?.pan !== undefined ? "Pan " + formatValue(chain.pan) : null,
        chain?.note ? "Note " + chain.note : null,
        chain?.isMuted === true ? "Muted" : null,
        chain?.isSoloed === true ? "Solo" : null,
        chain?.isActive === false ? "Inactive" : null,
      ].filter(Boolean);
      return parts.length ? '<div class="chain-state">' + parts.map((part) => '<span>' + escapeHtml(part) + '</span>').join("") + '</div>' : "";
    };

    const renderStructureCards = (items, label, depth) => {
      const list = asArray(items);
      if (!list.length) return '<p class="empty-state compact">Internal rack structure not exposed by current SDK</p>';
      return '<div class="rack-chain-list">' + list.map((item) =>
        '<article class="chain-card">' +
          '<header class="chain-header">' +
            '<div><div class="device-badges">' + badge(label === "Pads" ? "Pad" : "Chain", label === "Pads" ? "drum" : "chain") + '</div><h4>' + escapeHtml(item?.name || (label === "Pads" ? "Unnamed pad" : "Unnamed chain")) + '</h4></div>' +
            '<span class="chain-kind">' + escapeHtml(item?.type || (label === "Pads" ? "Pad" : "Chain")) + '</span>' +
          '</header>' +
          chainState(item) +
          '<div class="nested-device-chain">' + deviceChain(item?.devices, depth + 1) + '</div>' +
        '</article>'
      ).join("") + '</div>';
    };

    const renderDeviceNode = (device, depth = 0) => {
      const chains = asArray(device?.chains);
      const pads = asArray(device?.pads);
      const parameters = asArray(device?.parameters);
      const isRack = chains.length > 0 || pads.length > 0 || /rack/i.test(String(device?.type || ""));
      const isDrumRack = /drum/i.test(String(device?.type || "")) || /drum/i.test(String(device?.name || ""));
      const structureItems = isDrumRack && pads.length ? pads : chains;
      const structureLabel = isDrumRack && pads.length ? "Pads" : "Chains";
      const enabledLabel = device?.enabled === null || device?.enabled === undefined
        ? ""
        : '<span class="device-flag ' + (device.enabled ? "is-on" : "is-off") + '">' + (device.enabled ? "On" : "Off") + '</span>';

      if (!isRack) {
        return '<div class="device-node">' +
          '<div class="device-node-head">' +
            '<span class="device-index">' + String((device?.index ?? 0) + 1).padStart(2, "0") + '</span>' +
            '<div class="device-heading">' +
              '<div class="device-badges">' + badge("Device", "device") + enabledLabel + '</div>' +
              '<span class="device-name">' + escapeHtml(device?.name || "Unnamed device") + '</span>' +
              '<span class="device-type">' + escapeHtml(device?.type || "Device") + '</span>' +
            '</div>' +
          '</div>' +
          (parameters.length
            ? '<div class="device-parameters"><span class="detail-label">Parameters</span>' + parameterStrip(parameters) + '</div>'
            : "") +
        '</div>';
      }

      return '<details class="device-node rack-node" ' + (depth < 1 ? "open" : "") + '>' +
        '<summary>' +
          '<div class="device-node-head">' +
            '<span class="device-index">' + String((device?.index ?? 0) + 1).padStart(2, "0") + '</span>' +
            '<div class="device-heading">' +
              '<div class="device-badges">' +
                badge(isDrumRack ? "Drum Rack" : "Rack", isDrumRack ? "drum" : "rack") +
                badge("Device", "device") +
                enabledLabel +
              '</div>' +
              '<span class="device-name">' + escapeHtml(device?.name || "Unnamed rack") + '</span>' +
              '<span class="device-type">' + escapeHtml(device?.type || "RackDevice") + '</span>' +
            '</div>' +
          '</div>' +
          '<span class="rack-meta">' + escapeHtml(String(structureItems.length)) + ' ' + escapeHtml(structureLabel.toLowerCase()) + '</span>' +
        '</summary>' +
        '<div class="rack-body">' +
          '<div class="device-parameters"><span class="detail-label">Macros</span>' + parameterStrip(parameters) + '</div>' +
          '<div class="rack-structure"><span class="detail-label">' + structureLabel + '</span>' + renderStructureCards(structureItems, structureLabel, depth) + '</div>' +
        '</div>' +
      '</details>';
    };

    const deviceChain = (devices, depth = 0) => {
      const items = asArray(devices);
      if (!items.length) return '<p class="empty-state">No devices</p>';
      return '<div class="device-chain depth-' + depth + '">' + items.map((device, index) =>
        renderDeviceNode({ ...device, index: device?.index ?? index }, depth)
      ).join('<span class="chain-link" aria-hidden="true"></span>') + '</div>';
    };

    const sendsList = (sends) => {
      const items = asArray(sends);
      if (!items.length) return '<p class="empty-state compact">No sends</p>';
      return '<div class="send-list">' + items.map((send) =>
        '<span class="send-chip"><b>' + escapeHtml(send.name) + '</b><em>' + escapeHtml(formatValue(send.value)) + '</em></span>'
      ).join("") + '</div>';
    };

    const trackCard = (track, ordinal, displayIndex) => {
        return '<article class="track-card kind-' + escapeHtml(track.kind) + '" style="--delay:' + Math.min(ordinal * 35, 420) + 'ms">' +
        '<div class="track-rail"><span>' + escapeHtml(displayIndex) + '</span></div>' +
        '<div class="track-body">' +
          '<header class="track-header">' +
            '<div><span class="kind-tag">' + escapeHtml(track.kind) + '</span><h3>' + escapeHtml(track.name) + '</h3></div>' +
            '<div class="track-state" aria-label="État de la piste">' + stateLeds(track) + '</div>' +
          '</header>' +
          '<div class="routing-grid">' +
            '<div><span>IN</span><strong>' + escapeHtml(routingText(track.input)) + '</strong></div>' +
            '<div><span>OUT</span><strong>' + escapeHtml(routingText(track.output)) + '</strong></div>' +
          '</div>' +
          '<div class="track-detail"><span class="detail-label">Device chain · ' + countDevicesDeep(track.devices) + '</span>' + deviceChain(track.devices) + '</div>' +
          '<div class="track-detail sends-row"><span class="detail-label">Sends · ' + asArray(track.sends).length + '</span>' + sendsList(track.sends) + '</div>' +
        '</div>' +
      '</article>';
      };

    const sessionOrderTracks = [
      ...session.tracks.map((track) => ({ ...track, sectionType: "track" })),
      ...session.returnTracks.map((track) => ({ ...track, sectionType: "return" })),
      ...(session.masterTrack ? [{ ...session.masterTrack, sectionType: "master" }] : []),
    ];

    const renderSessionOrder = () => {
      let displayCounter = 0;
      let hasInsertedReturnsDivider = false;
      let hasInsertedMasterDivider = false;

      return sessionOrderTracks.map((track, ordinal) => {
        const fragments = [];

        if (track.sectionType === "return" && !hasInsertedReturnsDivider) {
          hasInsertedReturnsDivider = true;
          fragments.push(
            '<div class="track-divider"><span>RTN</span><strong>Returns</strong><i></i></div>',
          );
        }

        if (track.sectionType === "master" && !hasInsertedMasterDivider) {
          hasInsertedMasterDivider = true;
          fragments.push(
            '<div class="track-divider"><span>MST</span><strong>Master</strong><i></i></div>',
          );
        }

        displayCounter += 1;
        fragments.push(
          trackCard(track, ordinal, String(displayCounter).padStart(2, "0")),
        );
        return fragments.join("");
      }).join("");
    };

    document.getElementById("project-name").textContent = session.set?.name || "Untitled Live Set";
    document.getElementById("tempo").textContent = session.set?.tempo ?? "—";
    document.getElementById("track-count").textContent = String(session.tracks.length);
    document.getElementById("device-count").textContent = String(countTrackDevices(allTracks));
    document.getElementById("send-count").textContent = String(allTracks.reduce((sum, track) => sum + asArray(track?.sends).length, 0));
    document.getElementById("export-time").textContent = "EXPORTED " + new Date(session.exportedAt).toLocaleString("fr-FR");

    document.getElementById("session-sections").innerHTML =
      '<section class="track-section">' +
        '<div class="section-heading"><span>SET</span><h2>Ordre du Set</h2><i></i><b>' + sessionOrderTracks.length + '</b></div>' +
        '<div class="track-stack">' + (sessionOrderTracks.length
          ? renderSessionOrder()
          : '<div class="empty-section">No tracks in this section</div>') +
        '</div>' +
        '</section>';

    const preferredMode = (() => {
      try {
        return localStorage.getItem("ableton-session-mapper:view-mode") || "detailed";
      } catch {
        return "detailed";
      }
    })();
    setViewMode(preferredMode);

    const formatDiagnosticValue = (value) => {
      if (value === undefined) return "—";
      if (typeof value === "string") return escapeHtml(value);
      return escapeHtml(JSON.stringify(value, null, 2));
    };

    const propertyRows = (properties) => properties.map((property) =>
      '<div class="diagnostic-property status-' + property.status + '">' +
        '<span class="property-status">' + property.status + '</span>' +
        '<code>' + escapeHtml(property.property) + '</code>' +
        '<pre>' + (property.status === "error" ? escapeHtml(property.error || "Unknown error") : formatDiagnosticValue(property.value)) + '</pre>' +
      '</div>'
    ).join("");

    const objectDiagnostic = (object, label) => {
      if (!object) return "";
      return '<details class="diagnostic-object">' +
        '<summary><span>' + escapeHtml(label) + '</span><b>' + escapeHtml(object.objectType) + '</b><em>' + escapeHtml(object.name || object.id || "anonymous") + '</em></summary>' +
        '<div class="diagnostic-object-body">' +
          '<div class="available-list"><span>Prototype surface</span>' + (object.availableProperties || []).map((name) => '<code>' + escapeHtml(name) + '</code>').join("") + '</div>' +
          '<div class="property-table">' + propertyRows(object.properties || []) + '</div>' +
        '</div>' +
      '</details>';
    };

    const deviceDiagnostic = (device) =>
      '<div class="diagnostic-nested">' + objectDiagnostic(device, device.isRack ? "Rack" : "Device") +
      (device.chains || []).map((chain) =>
        '<div class="chain-diagnostic">' + objectDiagnostic(chain, "Chain") +
        (chain.devices || []).map(deviceDiagnostic).join("") +
        objectDiagnostic(chain.mixer, "Chain mixer") + '</div>'
      ).join("") + '</div>';

    const diagnosticRoot = document.getElementById("sdk-diagnostic");
    if (!sdkDiagnostic) {
      diagnosticRoot.innerHTML =
        '<div class="section-heading"><span>SDK</span><h2 id="diagnostic-title">Data Diagnostic</h2><i></i><b>NOT RUN</b></div>' +
        '<div class="diagnostic-empty"><strong>No SDK diagnostic loaded.</strong><span>Use “Export SDK Diagnostic JSON” in Live, then regenerate the HTML.</span></div>';
    } else {
      const metrics = [
        [sdkDiagnostic.summary.tracksInspected, "Tracks inspected"],
        [sdkDiagnostic.summary.routingsFound, "Routings found"],
        [sdkDiagnostic.summary.devicesInspected, "Devices inspected"],
        [sdkDiagnostic.summary.racksDetected, "Racks detected"],
        [sdkDiagnostic.summary.chainsDetected, "Chains detected"],
        [sdkDiagnostic.summary.propertyErrors, "Property errors"],
      ];
      diagnosticRoot.innerHTML =
        '<div class="section-heading"><span>SDK</span><h2 id="diagnostic-title">Data Diagnostic</h2><i></i><b>v' + escapeHtml(sdkDiagnostic.version) + '</b></div>' +
        '<div class="diagnostic-summary">' + metrics.map(([value, label]) => '<article><b>' + value + '</b><span>' + label + '</span></article>').join("") + '</div>' +
        objectDiagnostic(sdkDiagnostic.song, "Song") +
        '<div class="diagnostic-tracks">' + sdkDiagnostic.tracks.map((track) =>
          '<article class="diagnostic-track">' +
            '<header><div><span>' + escapeHtml(track.role) + '</span><h3>' + escapeHtml(track.name || "Unnamed track") + '</h3></div><code>' + escapeHtml(track.detectedType) + '</code></header>' +
            '<p class="diagnostic-id">ID ' + escapeHtml(track.id || "unavailable") + '</p>' +
            objectDiagnostic(track, "Track properties") +
            objectDiagnostic(track.mixer, "Mixer device") +
            (track.devices || []).map(deviceDiagnostic).join("") +
          '</article>'
        ).join("") + '</div>';
    }
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
