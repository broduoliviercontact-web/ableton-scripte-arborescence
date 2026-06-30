import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createInternalViewerHtml, type InternalViewerModel } from "../extension/src/internal-viewer/template.js";

const views = ["session", "kanban", "metro", "outputs", "routing", "devices", "files", "overview"] as const;

const columns: InternalViewerModel["sessionPreviewColumns"] = [
  { index: 0, name: "DRUMS", kind: "group", sectionType: "track", deviceCount: 2, sendCount: 2, rackCount: 1, deviceCards: [
    { name: "Drum Buss", summary: "Drum Buss · Audio Effect", isRack: false },
    { name: "Parallel Crunch", summary: "Parallel Crunch · Rack · chains:3", isRack: true },
  ] },
  { index: 1, name: "Kick — Analog", kind: "midi", sectionType: "track", deviceCount: 3, sendCount: 2, rackCount: 1, deviceCards: [
    { name: "Kick Designer", summary: "Kick Designer · Rack · chains:4", isRack: true },
    { name: "Saturator", summary: "Saturator · Audio Effect", isRack: false },
    { name: "EQ Eight", summary: "EQ Eight · Audio Effect", isRack: false },
  ] },
  { index: 2, name: "Percussion", kind: "midi", sectionType: "track", deviceCount: 2, sendCount: 2, rackCount: 1, deviceCards: [
    { name: "Drum Rack", summary: "Drum Rack · Rack · pads:16", isRack: true },
    { name: "Glue Compressor", summary: "Glue Compressor · Audio Effect", isRack: false },
  ] },
  { index: 3, name: "Bass Sequence", kind: "midi", sectionType: "track", deviceCount: 3, sendCount: 2, rackCount: 1, deviceCards: [
    { name: "Bass Engine", summary: "Bass Engine · Rack · chains:3", isRack: true },
    { name: "Roar", summary: "Roar · Audio Effect", isRack: false },
    { name: "Utility", summary: "Utility · Audio Effect", isRack: false },
  ] },
  { index: 4, name: "Juno Chords", kind: "audio", sectionType: "track", deviceCount: 2, sendCount: 2, rackCount: 0, deviceCards: [
    { name: "Auto Filter", summary: "Auto Filter · Audio Effect", isRack: false },
    { name: "Chorus-Ensemble", summary: "Chorus-Ensemble · Audio Effect", isRack: false },
  ] },
  { index: 5, name: "Lead Atmosphere", kind: "midi", sectionType: "track", deviceCount: 3, sendCount: 2, rackCount: 1, deviceCards: [
    { name: "Wavetable", summary: "Wavetable · Instrument", isRack: false },
    { name: "Movement Rack", summary: "Movement Rack · Rack · chains:2", isRack: true },
    { name: "Echo", summary: "Echo · Audio Effect", isRack: false },
  ] },
  { index: 0, name: "A — Short Verb", kind: "return", sectionType: "return", deviceCount: 2, sendCount: 0, rackCount: 0, deviceCards: [
    { name: "Hybrid Reverb", summary: "Hybrid Reverb · Audio Effect", isRack: false },
    { name: "EQ Eight", summary: "EQ Eight · Audio Effect", isRack: false },
  ] },
  { index: 1, name: "B — Tape Delay", kind: "return", sectionType: "return", deviceCount: 2, sendCount: 0, rackCount: 0, deviceCards: [
    { name: "Echo", summary: "Echo · Audio Effect", isRack: false },
    { name: "Saturator", summary: "Saturator · Audio Effect", isRack: false },
  ] },
  { index: 0, name: "Master", kind: "master", sectionType: "master", deviceCount: 3, sendCount: 0, rackCount: 0, deviceCards: [
    { name: "EQ Eight", summary: "EQ Eight · Audio Effect", isRack: false },
    { name: "Glue Compressor", summary: "Glue Compressor · Audio Effect", isRack: false },
    { name: "Limiter", summary: "Limiter · Audio Effect", isRack: false },
  ] },
];

const outputs: InternalViewerModel["outputs"] = columns.map((column) => ({
  index: column.index,
  name: column.name,
  kind: column.kind,
  sectionType: column.sectionType,
  midiFrom: column.kind === "midi" ? "All Ins · All Channels" : "—",
  midiTo: column.kind === "midi" ? "Track In" : "—",
  audioFrom: column.sectionType === "master" ? "Tracks + Returns" : column.kind === "audio" ? "Ext. In · 1/2" : "—",
  audioTo: column.sectionType === "master" ? "Ext. Out · 1/2" : column.sectionType === "return" ? "Master" : column.name === "Kick — Analog" || column.name === "Percussion" ? "DRUMS" : "Master",
  monitor: column.kind === "audio" ? "In" : "Auto",
  source: column.sectionType === "return" || column.sectionType === "master" ? "MANUAL" : "SDK",
  sends: column.sendCount ? "A: 0.186, B: 0.094" : "—",
}));

const deviceTracks: InternalViewerModel["deviceTracks"] = columns.map((column) => ({
  index: column.index,
  name: column.name,
  kind: column.kind,
  sectionType: column.sectionType,
  deviceCount: column.deviceCount,
  rackCount: column.rackCount,
  deviceSummary: column.deviceCards.map((device) => device.summary),
  rackSummary: column.deviceCards.filter((device) => device.isRack).map((device) => `${device.name} · chains:${device.name === "Drum Rack" ? 16 : 3} · complete`),
}));

const files: InternalViewerModel["files"] = [
  ["launcher", "Open External Launcher", "session-map-diagrams.html", "Core Outputs"],
  ["report", "Open HTML Report", "session-map.html", "Core Outputs"],
  ["session-grid", "Open Session Grid", "session-map-session-grid.html", "Core Outputs"],
  ["json", "Open session-map.json", "session-map.json", "Core Outputs"],
  ["flow-svg", "Open Flow SVG", "session-map-flow.svg", "Mermaid Flow"],
  ["flow-png", "Open Flow PNG", "session-map-flow.png", "Mermaid Flow"],
  ["git-svg", "Open Git / Metro SVG", "session-map-git.svg", "Mermaid Git / Metro"],
  ["git-png", "Open Git / Metro PNG", "session-map-git.png", "Mermaid Git / Metro"],
  ["kanban-svg", "Open Kanban SVG", "session-map-kanban.svg", "Mermaid Kanban"],
  ["kanban-png", "Open Kanban PNG", "session-map-kanban.png", "Mermaid Kanban"],
].map(([key, label, fileName, group]) => ({ key, label, fileName, group, exists: true }));

const model: InternalViewerModel = {
  setName: "NEON TRANSIT — Live Set",
  exportedAt: "2026-06-30T18:42:00+02:00",
  statusMessage: "Latest export metadata loaded. Use Quick Open or Files to jump to external outputs.",
  warningMessage: null,
  scanMode: "ultra-safe",
  metrics: { tracks: 6, returns: 2, devices: 22, racks: 5, sends: 12 },
  quickLinks: [
    { key: "launcher", label: "Open External Launcher", exists: true },
    { key: "report", label: "Open HTML Report", exists: true },
    { key: "session-grid", label: "Open Session Grid", exists: true },
    { key: "git-svg", label: "Open Git / Metro", exists: true },
    { key: "kanban-svg", label: "Open Kanban", exists: true },
  ],
  sessionPreviewColumns: columns,
  outputs,
  connections: [
    { from: "Kick — Analog", to: "DRUMS", type: "audio", label: "Bus" },
    { from: "Percussion", to: "DRUMS", type: "audio", label: "Bus" },
  ],
  manualRoutingStatus: "loaded",
  manualRoutingWarnings: [],
  routingOverridesPath: "/Users/jeanclaude/Documents/ableton scripte arborescence/exports/routing-overrides.json",
  routingOverridesExists: true,
  sidechains: [
    {
      targetTrack: "Bass Sequence",
      targetDevice: "Glue Compressor",
      sourceTrack: "Kick — Analog",
      enabled: "enabled",
      notes: "Preview example",
    },
  ],
  deviceTracks,
  files,
  hasExport: true,
  hasMissingRoutingData: false,
  internalVisualPreviewEnabled: true,
};

const previewScript = `<script>
    (() => {
      const views = ${JSON.stringify(views)};
      const requested = new URLSearchParams(location.search).get("view") || "session";
      const view = views.includes(requested) ? requested : "session";
      const input = document.getElementById("internal-tab-" + view);
      if (input) input.checked = true;
      document.querySelectorAll('input[name="internal-tab"]').forEach((tab) => {
        tab.addEventListener("change", () => history.replaceState(null, "", "?view=" + tab.id.replace("internal-tab-", "")));
      });
      document.documentElement.dataset.staticPreview = "true";
    })();
  </script>`;

const previewStyles = `<style>
    html { width: 1400px; height: 950px; overflow: hidden; }
    body { width: 1400px; height: 950px; overflow: hidden; }
    .shell { width: 1372px; max-width: none; height: 922px; max-height: none; }
  </style>`;

const html = createInternalViewerHtml(model)
  .replace("</head>", `${previewStyles}</head>`)
  .replace("</body>", `${previewScript}</body>`);

await writeFile(fileURLToPath(new URL("./index.html", import.meta.url)), html, "utf8");
console.log("Generated internal-viewer-preview/index.html (1400x950)");
