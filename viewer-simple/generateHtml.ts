import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderTemplate,
  type ChainInfo,
  type DeviceInfo,
  type PadInfo,
  type SdkDiagnostic,
  type SessionMap,
  type TrackInfo,
} from "./template.js";

const viewerDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(viewerDirectory, "..");
const MAX_VIEWER_RACK_DEPTH = 3;
const MAX_VIEWER_CHAINS_PER_RACK = 64;
const MAX_VIEWER_DEVICES_PER_STRUCTURE = 32;
const MAX_VIEWER_PARAMETERS_PER_DEVICE = 16;

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const jsonPath = resolve(
  argumentValue("--json") ?? resolve(rootDirectory, "exports/session-map.json"),
);
const outputPath = resolve(
  argumentValue("--output") ?? resolve(rootDirectory, "exports/session-map.html"),
);
const indexPath = resolve(viewerDirectory, "index.html");
const stylesPath = resolve(viewerDirectory, "styles.css");
const diagnosticArgument = argumentValue("--diagnostic");

async function readOptionalDiagnostic(): Promise<SdkDiagnostic | null> {
  if (!diagnosticArgument) return null;
  const diagnosticPath = resolve(diagnosticArgument);
  try {
    return JSON.parse(await readFile(diagnosticPath, "utf8")) as SdkDiagnostic;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function sanitizeDevices(
  devices: DeviceInfo[] | undefined,
  depth: number,
): DeviceInfo[] {
  return (devices ?? []).slice(0, MAX_VIEWER_DEVICES_PER_STRUCTURE).map((device) => {
    const nextDepth = depth + 1;
    const allowNested = nextDepth < MAX_VIEWER_RACK_DEPTH;
    const sanitizedChains: ChainInfo[] = allowNested
      ? (device.chains ?? []).slice(0, MAX_VIEWER_CHAINS_PER_RACK).map((chain) => ({
          ...chain,
          devices: sanitizeDevices(chain.devices, nextDepth),
        }))
      : [];
    const sanitizedPads: PadInfo[] = allowNested
      ? (device.pads ?? []).slice(0, MAX_VIEWER_CHAINS_PER_RACK).map((pad) => ({
          ...pad,
          devices: sanitizeDevices(pad.devices, nextDepth),
        }))
      : [];

    return {
      ...device,
      parameters: (device.parameters ?? []).slice(0, MAX_VIEWER_PARAMETERS_PER_DEVICE),
      chains: sanitizedChains,
      pads: sanitizedPads,
    };
  });
}

function sanitizeTrack(track: TrackInfo): TrackInfo {
  return {
    ...track,
    devices: sanitizeDevices(track.devices, 0),
  };
}

function sanitizeSessionMap(data: SessionMap): SessionMap {
  return {
    ...data,
    tracks: data.tracks.map(sanitizeTrack),
    returnTracks: data.returnTracks.map(sanitizeTrack),
    masterTrack: data.masterTrack ? sanitizeTrack(data.masterTrack) : null,
  };
}

async function generate(): Promise<void> {
  const [json, styles, diagnostic] = await Promise.all([
    readFile(jsonPath, "utf8"),
    readFile(stylesPath, "utf8"),
    readOptionalDiagnostic(),
  ]);
  const data = JSON.parse(json) as SessionMap;

  if (!Array.isArray(data.tracks) || !Array.isArray(data.returnTracks)) {
    throw new Error(`Invalid session map: ${jsonPath}`);
  }

  const safeData = sanitizeSessionMap(data);
  const html = renderTemplate(safeData, styles, diagnostic);
  const writes = [writeFile(outputPath, html, "utf8")];
  if (!argumentValue("--output")) writes.push(writeFile(indexPath, html, "utf8"));
  await Promise.all(writes);

  console.log(`[viewer-simple] Generated ${outputPath}`);
}

generate().catch((error: unknown) => {
  console.error("[viewer-simple] Generation failed.", error);
  process.exitCode = 1;
});
