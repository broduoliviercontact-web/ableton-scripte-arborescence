import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ExtensionContext } from "@ableton-extensions/sdk";
import { safeGet } from "./types.js";

export type RuntimeMode = "dev" | "installed";

export interface RuntimePaths {
  runtimeMode: RuntimeMode;
  extensionRoot: string;
  storageRoot: string;
  projectRoot: string;
  exportDirectory: string;
  assetsDirectory: string;
  configDirectory: string;
  viewerStylesPath: string;
  mermaidRuntimePath: string | null;
  workspaceRoot: string | null;
}

async function firstExistingPath(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

export async function resolveRuntimePaths(
  context: ExtensionContext<"1.0.0">,
): Promise<RuntimePaths> {
  const storageRoot = await safeGet(
    () => context.environment.storageDirectory,
    undefined,
    "environment.storageDirectory",
  );
  if (!storageRoot) {
    throw new Error("The extension storage directory is unavailable.");
  }

  const extensionRoot = resolve(dirname(__dirname));
  const explicitRuntimeMode = process.env.SESSION_MAPPER_RUNTIME_MODE === "dev"
    ? "dev"
    : process.env.SESSION_MAPPER_RUNTIME_MODE === "installed"
      ? "installed"
      : null;
  const runtimeMode: RuntimeMode = explicitRuntimeMode ?? "installed";
  const projectRoot = runtimeMode === "dev" ? storageRoot : storageRoot;
  const workspaceRoot = runtimeMode === "dev" ? storageRoot : null;
  const exportDirectory = join(storageRoot, "exports");
  const assetsDirectory = join(extensionRoot, "assets");
  const configDirectory = join(storageRoot, "config");

  const viewerStylesPath = await firstExistingPath([
    join(assetsDirectory, "viewer-simple", "styles.css"),
    join(projectRoot, "viewer-simple", "styles.css"),
  ]);
  if (!viewerStylesPath) {
    throw new Error("viewer-simple/styles.css is unavailable in the current runtime.");
  }

  const mermaidRuntimePath = await firstExistingPath([
    join(assetsDirectory, "vendor", "mermaid.min.js"),
    join(projectRoot, "node_modules", "mermaid", "dist", "mermaid.min.js"),
  ]);

  return {
    runtimeMode,
    extensionRoot,
    storageRoot,
    projectRoot,
    exportDirectory,
    assetsDirectory,
    configDirectory,
    viewerStylesPath,
    mermaidRuntimePath,
    workspaceRoot,
  };
}
