import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import { resolveExportLocations } from "../exportJson.js";
import type { SessionMap } from "../types.js";
import {
  createInternalViewerHtml,
  createInternalViewerModel,
  type InternalViewerFileLink,
} from "./template.js";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readLatestSessionMap(
  context: ExtensionContext<"1.0.0">,
): Promise<SessionMap | null> {
  console.log("[Ableton Session Mapper] Read latest export metadata started");
  const locations = await resolveExportLocations(context);
  if (!(await pathExists(locations.sessionMapJsonPath))) {
    console.log("[Ableton Session Mapper] Read latest export metadata completed (no export yet)");
    return null;
  }

  try {
    const raw = await readFile(locations.sessionMapJsonPath, "utf8");
    const parsed = JSON.parse(raw) as SessionMap;
    console.log("[Ableton Session Mapper] Read latest export metadata completed");
    return parsed;
  } catch (error) {
    console.warn("[Ableton Session Mapper] Internal Viewer could not parse session-map.json.", error);
    console.log("[Ableton Session Mapper] Read latest export metadata completed (fallback)");
    return null;
  }
}

export async function showInternalViewerExperimental(
  context: ExtensionContext<"1.0.0">,
  openExternalPath: (path: string, label: string) => void,
): Promise<void> {
  try {
    const locations = await resolveExportLocations(context);
    const sessionMap = await readLatestSessionMap(context);

    const links: Array<InternalViewerFileLink & { path: string; openLabel: string }> = [
      {
        key: "launcher",
        label: "Open External Launcher",
        path: locations.sessionMapDiagramsPath,
        openLabel: "Launcher",
        exists: await pathExists(locations.sessionMapDiagramsPath),
      },
      {
        key: "session-grid",
        label: "Open Session Grid",
        path: locations.sessionGridHtmlPath,
        openLabel: "Session Grid",
        exists: await pathExists(locations.sessionGridHtmlPath),
      },
      {
        key: "report",
        label: "Open HTML Report",
        path: locations.sessionMapHtmlPath,
        openLabel: "HTML Report",
        exists: await pathExists(locations.sessionMapHtmlPath),
      },
      {
        key: "flow",
        label: "Open Flow",
        path: join(locations.exportDirectory, "session-map-mermaid-flow.html"),
        openLabel: "Flow",
        exists: await pathExists(join(locations.exportDirectory, "session-map-mermaid-flow.html")),
      },
      {
        key: "git",
        label: "Open Git / Metro",
        path: join(locations.exportDirectory, "session-map-mermaid-git.html"),
        openLabel: "Git / Metro",
        exists: await pathExists(join(locations.exportDirectory, "session-map-mermaid-git.html")),
      },
      {
        key: "kanban",
        label: "Open Kanban",
        path: join(locations.exportDirectory, "session-map-mermaid-kanban.html"),
        openLabel: "Kanban",
        exists: await pathExists(join(locations.exportDirectory, "session-map-mermaid-kanban.html")),
      },
    ];

    const model = createInternalViewerModel(
      sessionMap,
      links.map(({ key, label, exists }) => ({ key, label, exists })),
    );
    console.log("[Ableton Session Mapper] Build internal viewer model completed");

    const html = createInternalViewerHtml(model);

    console.log("[Ableton Session Mapper] Show internal viewer modal started");
    const result = await context.ui.showModalDialog(
      `data:text/html,${encodeURIComponent(html)}`,
      560,
      420,
    );
    console.log("[Ableton Session Mapper] Show internal viewer modal completed");

    let parsed: { action?: string; key?: string } | null = null;
    try {
      parsed = JSON.parse(result) as { action?: string; key?: string };
    } catch (error) {
      console.warn("[Ableton Session Mapper] Internal Viewer returned invalid JSON.", error);
      return;
    }

    if (parsed?.action !== "open-link" || !parsed.key) {
      return;
    }

    const target = links.find((link) => link.key === parsed?.key);
    if (!target) {
      console.warn(`[Ableton Session Mapper] Internal Viewer requested unknown target: ${parsed.key}`);
      return;
    }

    console.log(`[Ableton Session Mapper] Open external view requested: ${target.openLabel}`);
    if (!target.exists || !(await pathExists(target.path))) {
      console.warn(`[Ableton Session Mapper] Open external view skipped missing file: ${target.path}`);
      return;
    }

    try {
      openExternalPath(target.path, target.openLabel);
      console.log(`[Ableton Session Mapper] Open external view completed: ${target.path}`);
    } catch (error) {
      console.warn("[Ableton Session Mapper] Open external view failed.", error);
    }
  } catch (error) {
    console.error(
      `[Ableton Session Mapper] Open Internal Viewer failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}
