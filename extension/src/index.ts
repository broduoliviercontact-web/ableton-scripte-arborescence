import { spawn } from "node:child_process";
import {
  initialize,
  type ActivationContext,
  type ExtensionContext,
} from "@ableton-extensions/sdk";
import {
  exportCapabilityMatrixArtifacts,
  exportDiagnosticJson,
  exportJson,
  exportRackDiagnosticJson,
  generateDiagramsIndex,
  generateHtml,
  generateMermaidHtmlArtifacts,
  generateMermaidDiagrams,
  generateSessionGrid,
  resolveCapabilityMatrixExportPaths,
  resolveExportLocations,
  resolveSessionExportPaths,
} from "./exportJson.js";
import { showInternalViewerExperimental } from "./internal-viewer/createInternalViewer.js";
import {
  renderCapabilityMatrixHtml,
  renderCapabilityMatrixMarkdown,
  scanCapabilityMatrix,
} from "./scanCapabilityMatrix.js";
import { loadRoutingOverrides, mergeManualRouting } from "./routingOverrides.js";
import { scanRackDiagnostic } from "./scanRackDiagnostic.js";
import { scanSdkDiagnostic } from "./scanDiagnostic.js";
import { scanLiveSet } from "./scanLiveSet.js";
import type { SessionMap } from "./types.js";

const EXPORT_SESSION_MAP_COMMAND_ID = "abletonSessionMapper.exportSessionMap";
const OPEN_INTERNAL_VIEWER_COMMAND_ID = "abletonSessionMapper.openInternalViewerExperimental";
const EXPORT_COMMAND_ID = "abletonSessionMapper.exportJson";
const EXPORT_DIAGNOSTIC_COMMAND_ID = "abletonSessionMapper.exportSdkDiagnostic";
const EXPORT_RACK_DIAGNOSTIC_COMMAND_ID = "abletonSessionMapper.exportRackDiagnostic";
const EXPORT_CAPABILITY_MATRIX_COMMAND_ID = "abletonSessionMapper.exportSdkCapabilityMatrix";
const ENABLE_DIAGNOSTIC_ACTIONS = process.env.ENABLE_DIAGNOSTIC_ACTIONS === "true";
const ENABLE_CAPABILITY_MATRIX = process.env.ENABLE_CAPABILITY_MATRIX === "true";
const ENABLE_OPEN_HTML = process.env.ENABLE_OPEN_HTML !== "false";
const GENERATE_DIAGRAMS_ON_EXPORT = process.env.GENERATE_DIAGRAMS_ON_EXPORT === "true";
const GENERATE_MERMAID_HTML_ON_EXPORT = process.env.GENERATE_MERMAID_HTML_ON_EXPORT !== "false";
const ENABLE_INTERNAL_VIEWER_DEV_ACTION = process.env.ENABLE_INTERNAL_VIEWER_DEV_ACTION === "true";
const OPEN_INTERNAL_MODAL_ON_EXPORT = process.env.OPEN_INTERNAL_MODAL_ON_EXPORT !== "false";
const FALLBACK_TO_EXTERNAL_LAUNCHER = process.env.FALLBACK_TO_EXTERNAL_LAUNCHER !== "false";
const NORMAL_ACTION_LABEL = "Export Session Map";
const INTERNAL_VIEWER_ACTION_LABEL = "Open Internal Viewer Experimental";
const CONTEXT_MENU_SCOPES = [
  "AudioTrack",
  "MidiTrack",
  "AudioClip",
  "MidiClip",
  "ClipSlot",
  "Scene",
  "AudioTrack.ArrangementSelection",
  "MidiTrack.ArrangementSelection",
  "ClipSlotSelection",
] as const;

interface ExportPaths {
  latestJsonPath: string;
  archiveJsonPath: string;
  latestHtmlPath?: string;
  archiveHtmlPath?: string;
}

function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return error.stack
      ? { message: error.message, stack: error.stack }
      : { message: error.message };
  }
  return { message: String(error) };
}

function logActionStarted(action: string): void {
  console.log(`[Ableton Session Mapper] Action started: ${action}`);
}

function logActionCompleted(action: string, detail?: string): void {
  console.log(
    `[Ableton Session Mapper] Action completed: ${action}${detail ? ` (${detail})` : ""}`,
  );
}

function logActionFailed(action: string, error: unknown): void {
  const detail = formatError(error);
  console.error(`[Ableton Session Mapper] Action failed: ${action}: ${detail.message}`);
  if (detail.stack) console.error(detail.stack);
}

function logWarning(message: string, error?: unknown): void {
  console.warn(`[Ableton Session Mapper] ${message}`);
  if (error) {
    const detail = formatError(error);
    console.warn(`[Ableton Session Mapper] ${detail.message}`);
    if (detail.stack) console.warn(detail.stack);
  }
}

async function runSafeAction(
  action: string,
  task: () => Promise<string | void>,
): Promise<void> {
  logActionStarted(action);
  try {
    const detail = await task();
    logActionCompleted(action, typeof detail === "string" && detail.length > 0 ? detail : undefined);
  } catch (error) {
    logActionFailed(action, error);
  }
}

function openPathInBrowser(path: string, label: string): void {
  console.log(`[Ableton Session Mapper] Open ${label} started: ${path}`);

  try {
    if (process.platform !== "darwin") {
      logWarning(
        `Automatic HTML opening is currently configured for macOS only. ${label} available at: ${path}`,
      );
      return;
    }

    const child = spawn("open", [path], {
      detached: true,
      stdio: "ignore",
    });

    child.on("error", (error) => {
      const detail = formatError(error);
      console.warn(`[Ableton Session Mapper] Open ${label} failed: ${detail.message}`);
      console.warn(`[Ableton Session Mapper] ${label} available at: ${path}`);
      if (detail.stack) console.warn(detail.stack);
    });

    child.unref();
    console.log(`[Ableton Session Mapper] Open ${label} completed`);
  } catch (error) {
    const detail = formatError(error);
    console.warn(`[Ableton Session Mapper] Open ${label} failed: ${detail.message}`);
    console.warn(`[Ableton Session Mapper] ${label} available at: ${path}`);
    if (detail.stack) console.warn(detail.stack);
  }
}

async function exportSession(
  context: ExtensionContext<"1.0.0">,
  actionName: string,
  withHtml: boolean,
): Promise<{ paths: ExportPaths | null; partial: boolean; sessionMap: SessionMap | null }> {
  let latestJsonPath: string | null = null;
  let archiveJsonPath: string | null = null;
  let latestHtmlPath: string | null = null;
  let archiveHtmlPath: string | null = null;
  let sessionMapForViewer: SessionMap | null = null;
  let partial = false;
  const locations = await resolveExportLocations(context);
  console.log(`[Ableton Session Mapper] Resolved project root: ${locations.projectRoot}`);
  console.log(`[Ableton Session Mapper] Resolved exports directory: ${locations.exportDirectory}`);
  await context.ui.withinProgressDialog(
    withHtml ? "Exporting and generating Session Map…" : "Exporting Ableton Session Map…",
    { progress: 0 },
    async (update, signal) => {
      try {
        await update("Scanning Live Set…", 20);
        if (signal.aborted) return;
        console.log("[Ableton Session Mapper] Scan Live Set started");
        const scannedSessionMap = await scanLiveSet(context);
        console.log("[Ableton Session Mapper] Scan Live Set completed");
        const routingOverrides = await loadRoutingOverrides(locations.exportDirectory);
        const sessionMap = mergeManualRouting(scannedSessionMap, routingOverrides);
        sessionMapForViewer = sessionMap;
        console.log(`[Ableton Session Mapper] Scan Live Set exportedAt: ${sessionMap.exportedAt}`);
        partial = sessionMap.scan.partial;
        const sessionExportPaths = await resolveSessionExportPaths(context, sessionMap);
        latestJsonPath = sessionExportPaths.latestJsonPath;
        archiveJsonPath = sessionExportPaths.archiveJsonPath;
        latestHtmlPath = sessionExportPaths.latestHtmlPath;
        archiveHtmlPath = sessionExportPaths.archiveHtmlPath;
        await update("Writing JSON…", 55);
        if (signal.aborted) return;
        console.log(`[Ableton Session Mapper] Write JSON target: ${locations.sessionMapJsonPath}`);
        const writtenPaths = await exportJson(sessionExportPaths, sessionMap);
        latestJsonPath = writtenPaths.latestJsonPath;
        archiveJsonPath = writtenPaths.archiveJsonPath;
        latestHtmlPath = writtenPaths.latestHtmlPath;
        archiveHtmlPath = writtenPaths.archiveHtmlPath;
        console.log(`[Ableton Session Mapper] Exported JSON: ${writtenPaths.latestJsonPath}`);

        if (withHtml) {
          await update("Generating HTML viewer…", 80);
          if (signal.aborted) return;
          console.log("[Ableton Session Mapper] Generate HTML started");
          const generatedPaths = await generateHtml(
            context,
            writtenPaths.archiveJsonPath,
            writtenPaths,
          );
          latestJsonPath = generatedPaths.latestJsonPath;
          archiveJsonPath = generatedPaths.archiveJsonPath;
          latestHtmlPath = generatedPaths.latestHtmlPath;
          archiveHtmlPath = generatedPaths.archiveHtmlPath;
          console.log(`[Ableton Session Mapper] Generated HTML: ${generatedPaths.latestHtmlPath ?? "missing"}`);
          console.log("[Ableton Session Mapper] Generate HTML completed");

          await update("Generating Session Grid…", 88);
          if (signal.aborted) return;
          console.log("[Ableton Session Mapper] Generate Session Grid started");
          const sessionGridPath = await generateSessionGrid(
            context,
            writtenPaths.archiveJsonPath,
          );
          console.log(`[Ableton Session Mapper] Generated Session Grid: ${sessionGridPath}`);
          console.log("[Ableton Session Mapper] Generate Session Grid completed");

          if (GENERATE_MERMAID_HTML_ON_EXPORT) {
            await update("Generating Mermaid HTML views…", 93);
            if (signal.aborted) return;
            console.log("[Ableton Session Mapper] Generate Mermaid HTML on export enabled");
            console.log("[Ableton Session Mapper] Generate Mermaid flow started");
            console.log("[Ableton Session Mapper] Generate Mermaid git started");
            console.log("[Ableton Session Mapper] Generate Mermaid kanban started");
            await generateMermaidHtmlArtifacts(context);
            console.log("[Ableton Session Mapper] Generate Mermaid flow completed");
            console.log("[Ableton Session Mapper] Generate Mermaid git completed");
            console.log("[Ableton Session Mapper] Generate Mermaid kanban completed");
            if (!GENERATE_DIAGRAMS_ON_EXPORT) {
              console.log("[Ableton Session Mapper] Mermaid SVG/PNG render skipped on export");
            }
          }

          if (GENERATE_DIAGRAMS_ON_EXPORT) {
            await update("Generating Mermaid diagrams…", 94);
            if (signal.aborted) return;
            console.log("[Ableton Session Mapper] Generate Mermaid Diagrams started");
            await generateMermaidDiagrams(context);
            console.log("[Ableton Session Mapper] Generate Mermaid Diagrams completed");
          }

          await update("Generating launcher…", 98);
          if (signal.aborted) return;
          console.log("[Ableton Session Mapper] Generate Diagrams Index started");
          const diagramsIndexPath = await generateDiagramsIndex(
            context,
            writtenPaths.archiveJsonPath,
          );
          console.log(`[Ableton Session Mapper] Generated Diagrams Index: ${diagramsIndexPath}`);
          console.log("[Ableton Session Mapper] Generate Diagrams Index completed");
        }
        await update("Complete", 100);
      } catch (error) {
        logActionFailed(actionName, error);
        throw error;
      }
    },
  );

  if (withHtml) {
    const locations = await resolveExportLocations(context);
    const launcherPath = locations.sessionMapDiagramsPath;
    if (OPEN_INTERNAL_MODAL_ON_EXPORT) {
      console.log("[Ableton Session Mapper] Open integrated modal after export started");
      try {
        await showInternalViewerExperimental(context, openPathInBrowser, {
          sessionMapOverride: sessionMapForViewer,
        });
        console.log("[Ableton Session Mapper] Open integrated modal after export completed");
      } catch (error) {
        const detail = formatError(error);
        console.error(`[Ableton Session Mapper] Open integrated modal failed: ${detail.message}`);
        if (detail.stack) console.error(detail.stack);
        if (FALLBACK_TO_EXTERNAL_LAUNCHER) {
          console.log("[Ableton Session Mapper] Fallback to external launcher started");
          openPathInBrowser(launcherPath, "External Launcher");
          console.log("[Ableton Session Mapper] Fallback to external launcher completed");
        } else {
          console.log(`[Ableton Session Mapper] External launcher available at: ${launcherPath}`);
        }
      }
    } else if (ENABLE_OPEN_HTML) {
      openPathInBrowser(launcherPath, "External Launcher");
    } else {
      console.log(`[Ableton Session Mapper] External launcher available at: ${launcherPath}`);
    }
  }

  const paths = latestJsonPath && archiveJsonPath
    ? {
        latestJsonPath,
        archiveJsonPath,
        ...(latestHtmlPath && archiveHtmlPath
          ? {
              latestHtmlPath,
              archiveHtmlPath,
            }
          : {}),
      }
    : null;
  return { paths, partial, sessionMap: sessionMapForViewer };
}

async function exportSdkDiagnosticOnly(
  context: ExtensionContext<"1.0.0">,
): Promise<string | null> {
  let diagnosticPath: string | null = null;
  const locations = await resolveExportLocations(context);
  console.log(`[Ableton Session Mapper] Resolved project root: ${locations.projectRoot}`);
  console.log(`[Ableton Session Mapper] Resolved exports directory: ${locations.exportDirectory}`);
  await context.ui.withinProgressDialog(
    "Inspecting Ableton SDK data…",
    { progress: 0 },
    async (update, signal) => {
      try {
        await update("Inspecting tracks, devices and routing candidates…", 25);
        if (signal.aborted) return;
        const diagnostic = await scanSdkDiagnostic(context);
        await update("Writing SDK diagnostic JSON…", 80);
        if (signal.aborted) return;
        diagnosticPath = await exportDiagnosticJson(context, diagnostic);
        console.log(`[Ableton Session Mapper] Exported SDK Diagnostic JSON: ${diagnosticPath}`);
        await update("Diagnostic complete", 100);
      } catch (error) {
        logActionFailed("Export SDK Diagnostic JSON", error);
        throw error;
      }
    },
  );
  return diagnosticPath;
}

async function exportRackDiagnosticOnly(
  context: ExtensionContext<"1.0.0">,
): Promise<string | null> {
  let diagnosticPath: string | null = null;
  const locations = await resolveExportLocations(context);
  console.log(`[Ableton Session Mapper] Resolved project root: ${locations.projectRoot}`);
  console.log(`[Ableton Session Mapper] Resolved exports directory: ${locations.exportDirectory}`);
  await context.ui.withinProgressDialog(
    "Inspecting rack devices…",
    { progress: 0 },
    async (update, signal) => {
      try {
        await update("Inspecting racks, chains and pads…", 25);
        if (signal.aborted) return;
        const diagnostic = await scanRackDiagnostic(context);
        await update("Writing rack diagnostic JSON…", 80);
        if (signal.aborted) return;
        diagnosticPath = await exportRackDiagnosticJson(context, diagnostic);
        console.log(`[Ableton Session Mapper] Exported Rack Diagnostic JSON: ${diagnosticPath}`);
        await update("Diagnostic complete", 100);
      } catch (error) {
        logActionFailed("Export Rack Diagnostic JSON", error);
        throw error;
      }
    },
  );
  return diagnosticPath;
}

async function exportCapabilityMatrixOnly(
  context: ExtensionContext<"1.0.0">,
): Promise<string | null> {
  let htmlPath: string | null = null;
  const locations = await resolveExportLocations(context);
  console.log(`[Ableton Session Mapper] Resolved project root: ${locations.projectRoot}`);
  console.log(`[Ableton Session Mapper] Resolved exports directory: ${locations.exportDirectory}`);
  await context.ui.withinProgressDialog(
    "Generating SDK Capability Matrix…",
    { progress: 0 },
    async (update, signal) => {
      try {
        await update("Scanning SDK capabilities…", 20);
        if (signal.aborted) return;
        const matrix = await scanCapabilityMatrix(context);
        const html = renderCapabilityMatrixHtml(matrix);
        const markdown = renderCapabilityMatrixMarkdown(matrix);
        const paths = await resolveCapabilityMatrixExportPaths(context, matrix);
        await update("Writing capability matrix reports…", 80);
        if (signal.aborted) return;
        await exportCapabilityMatrixArtifacts(paths, matrix, html, markdown);
        htmlPath = paths.latestHtmlPath;
        await update("Capability matrix complete", 100);
      } catch (error) {
        logActionFailed("Generate SDK Capability Matrix", error);
        throw error;
      }
    },
  );
  return htmlPath;
}

export function activate(activation: ActivationContext): void {
  const context = initialize(activation, "1.0.0");

  context.commands.registerCommand(EXPORT_SESSION_MAP_COMMAND_ID, () => {
    void runSafeAction("Export Session Map", async () => {
      const result = await exportSession(context, "Export Session Map", true);
      return result.partial ? "partial" : undefined;
    });
  });

  if (ENABLE_DIAGNOSTIC_ACTIONS || ENABLE_INTERNAL_VIEWER_DEV_ACTION) {
    context.commands.registerCommand(OPEN_INTERNAL_VIEWER_COMMAND_ID, () => {
      void runSafeAction("Open Internal Viewer", async () => {
        console.log("[Ableton Session Mapper] Open Internal Viewer started");
        await showInternalViewerExperimental(context, openPathInBrowser);
        console.log("[Ableton Session Mapper] Open Internal Viewer completed");
      });
    });
  }

  if (ENABLE_DIAGNOSTIC_ACTIONS) {
    context.commands.registerCommand(EXPORT_COMMAND_ID, () => {
      void runSafeAction("Export JSON", async () => {
        const result = await exportSession(context, "Export JSON", false);
        return result.partial ? "partial" : undefined;
      });
    });

    context.commands.registerCommand(EXPORT_DIAGNOSTIC_COMMAND_ID, () => {
      void runSafeAction("Export SDK Diagnostic JSON", async () => {
        const diagnosticPath = await exportSdkDiagnosticOnly(context);
        if (diagnosticPath) {
          console.log(`[Ableton Session Mapper] SDK diagnostic available at: ${diagnosticPath}`);
        }
      });
    });

    context.commands.registerCommand(EXPORT_RACK_DIAGNOSTIC_COMMAND_ID, () => {
      void runSafeAction("Export Rack Diagnostic JSON", async () => {
        const diagnosticPath = await exportRackDiagnosticOnly(context);
        if (diagnosticPath) {
          console.log(`[Ableton Session Mapper] Rack diagnostic available at: ${diagnosticPath}`);
        }
      });
    });
  }

  if (ENABLE_DIAGNOSTIC_ACTIONS || ENABLE_CAPABILITY_MATRIX) {
    context.commands.registerCommand(EXPORT_CAPABILITY_MATRIX_COMMAND_ID, () => {
      void runSafeAction("Generate SDK Capability Matrix", async () => {
        const htmlPath = await exportCapabilityMatrixOnly(context);
        if (htmlPath) {
          console.log(`[Ableton Session Mapper] Capability matrix available at: ${htmlPath}`);
        }
      });
    });
  }

  const actions = ENABLE_DIAGNOSTIC_ACTIONS
    ? ([
        [NORMAL_ACTION_LABEL, EXPORT_SESSION_MAP_COMMAND_ID],
        ...((ENABLE_DIAGNOSTIC_ACTIONS || ENABLE_INTERNAL_VIEWER_DEV_ACTION)
          ? ([[INTERNAL_VIEWER_ACTION_LABEL, OPEN_INTERNAL_VIEWER_COMMAND_ID]] as const)
          : []),
        ["Export JSON", EXPORT_COMMAND_ID],
        ["Export SDK Diagnostic JSON", EXPORT_DIAGNOSTIC_COMMAND_ID],
        ["Export Rack Diagnostic JSON", EXPORT_RACK_DIAGNOSTIC_COMMAND_ID],
        ...((ENABLE_DIAGNOSTIC_ACTIONS || ENABLE_CAPABILITY_MATRIX)
          ? ([["Generate SDK Capability Matrix", EXPORT_CAPABILITY_MATRIX_COMMAND_ID]] as const)
          : []),
      ] as const)
    : ([
        [NORMAL_ACTION_LABEL, EXPORT_SESSION_MAP_COMMAND_ID],
        ...((ENABLE_DIAGNOSTIC_ACTIONS || ENABLE_INTERNAL_VIEWER_DEV_ACTION)
          ? ([[INTERNAL_VIEWER_ACTION_LABEL, OPEN_INTERNAL_VIEWER_COMMAND_ID]] as const)
          : []),
        ...((ENABLE_CAPABILITY_MATRIX
          ? ([["Generate SDK Capability Matrix", EXPORT_CAPABILITY_MATRIX_COMMAND_ID]] as const)
          : [])),
      ] as const);

  for (const scope of CONTEXT_MENU_SCOPES) {
    for (const [title, commandId] of actions) {
      void context.ui
        .registerContextMenuAction(scope, title, commandId)
        .catch((error: unknown) => {
          logActionFailed(`Register ${scope}/${title}`, error);
        });
    }
  }

  console.log(
    "[Ableton Session Mapper] Extension activated. Right-click a supported track, clip, clip slot, scene, or arrangement selection.",
  );
  console.log(
    "[Ableton Session Mapper] Lightweight integrated modal enabled for Session Mapper. Heavy Mermaid/SVG rendering remains external.",
  );
  console.log(
    `[Ableton Session Mapper] Diagnostic actions ${ENABLE_DIAGNOSTIC_ACTIONS ? "enabled" : "disabled"}${ENABLE_DIAGNOSTIC_ACTIONS ? " via ENABLE_DIAGNOSTIC_ACTIONS=true" : ""}.`,
  );
  console.log(
    `[Ableton Session Mapper] SDK Capability Matrix ${ENABLE_CAPABILITY_MATRIX ? "enabled" : "disabled"}${ENABLE_CAPABILITY_MATRIX ? " via ENABLE_CAPABILITY_MATRIX=true" : ""}.`,
  );
  console.log(
    `[Ableton Session Mapper] External HTML auto-open ${ENABLE_OPEN_HTML ? "enabled" : "disabled"}${ENABLE_OPEN_HTML ? " (set ENABLE_OPEN_HTML=false to disable)" : " via ENABLE_OPEN_HTML=false"}.`,
  );
  console.log(
    `[Ableton Session Mapper] Integrated modal on export ${OPEN_INTERNAL_MODAL_ON_EXPORT ? "enabled" : "disabled"}${OPEN_INTERNAL_MODAL_ON_EXPORT ? " (set OPEN_INTERNAL_MODAL_ON_EXPORT=false to use the external launcher by default)" : " via OPEN_INTERNAL_MODAL_ON_EXPORT=false"}.`,
  );
  console.log(
    `[Ableton Session Mapper] Fallback to external launcher ${FALLBACK_TO_EXTERNAL_LAUNCHER ? "enabled" : "disabled"}${FALLBACK_TO_EXTERNAL_LAUNCHER ? " (recommended)" : " via FALLBACK_TO_EXTERNAL_LAUNCHER=false"}.`,
  );
  console.log(
    `[Ableton Session Mapper] Mermaid diagram generation on export ${GENERATE_DIAGRAMS_ON_EXPORT ? "enabled" : "disabled"}${GENERATE_DIAGRAMS_ON_EXPORT ? " via GENERATE_DIAGRAMS_ON_EXPORT=true" : " by default"}.`,
    `[Ableton Session Mapper] Mermaid HTML generation on export ${GENERATE_MERMAID_HTML_ON_EXPORT ? "enabled" : "disabled"}${GENERATE_MERMAID_HTML_ON_EXPORT ? " by default" : " via GENERATE_MERMAID_HTML_ON_EXPORT=false"}.`,
  );
  console.log(
    `[Ableton Session Mapper] Internal Viewer dev action ${(ENABLE_DIAGNOSTIC_ACTIONS || ENABLE_INTERNAL_VIEWER_DEV_ACTION) ? "enabled" : "disabled"}${ENABLE_INTERNAL_VIEWER_DEV_ACTION ? " via ENABLE_INTERNAL_VIEWER_DEV_ACTION=true" : ""}.`,
  );
}
