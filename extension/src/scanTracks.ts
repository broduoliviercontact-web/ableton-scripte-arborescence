import { AudioTrack, MidiTrack, type Track } from "@ableton-extensions/sdk";
import { scanDevices, scanTimedOut, type ScanState } from "./scanDevices.js";
import {
  scanInputRouting,
  scanOutputRouting,
  scanSends,
} from "./scanRoutings.js";
import { safeGet, type TrackInfo, type TrackKind } from "./types.js";

type TrackRole = "regular" | "return" | "master";

async function getTrackId(track: Track<"1.0.0"> | null): Promise<string | null> {
  if (!track) return null;
  const handle = await safeGet(() => track.handle, null, "track.handle");
  return handle?.id.toString() ?? null;
}

async function getKind(
  track: Track<"1.0.0">,
  role: TrackRole,
  groupIds: Set<string>,
): Promise<TrackKind> {
  if (role === "return") return "return";
  if (role === "master") return "master";
  const id = await getTrackId(track);
  if (id && groupIds.has(id)) return "group";
  if (track instanceof AudioTrack) return "audio";
  if (track instanceof MidiTrack) return "midi";
  return "unknown";
}

export async function findGroupTrackIds(
  tracks: Track<"1.0.0">[],
): Promise<Set<string>> {
  const ids = await Promise.all(
    tracks.map(async (track) => {
      const group = await safeGet(() => track.groupTrack, null, "track.groupTrack");
      return getTrackId(group);
    }),
  );
  return new Set(ids.filter((id): id is string => id !== null));
}

export async function scanTrack(
  track: Track<"1.0.0">,
  index: number,
  role: TrackRole,
  groupIds: Set<string>,
  scanState: ScanState,
): Promise<TrackInfo> {
  const trackName = await safeGet(() => track.name, "Unnamed track", "track.name");
  console.log(
    `[Ableton Session Mapper] Scan track started: ${trackName} (#${index}, ${role})`,
  );
  const groupTrack = await safeGet(
    () => track.groupTrack,
    null,
    "track.groupTrack",
  );
  const devices = await safeGet(() => track.devices, [], "track.devices");
  if (scanTimedOut(scanState)) {
    console.log(`[Ableton Session Mapper] Scan track completed: ${trackName} (timed out before devices)`);
    return {
      id: (await getTrackId(track)) ?? `${role}-${index}`,
      index,
      name: trackName,
      kind: await getKind(track, role, groupIds),
      color: null,
      isMuted: await safeGet(() => track.mute, null, "track.mute"),
      isSoloed: await safeGet(() => track.solo, null, "track.solo"),
      isArmed: await safeGet(() => track.arm, null, "track.arm"),
      groupTrackId: await getTrackId(groupTrack),
      input: await scanInputRouting(track),
      output: await scanOutputRouting(track),
      devices: [],
      sends: await scanSends(track),
    } satisfies TrackInfo;
  }
  const result = {
    id: (await getTrackId(track)) ?? `${role}-${index}`,
    index,
    name: trackName,
    kind: await getKind(track, role, groupIds),
    // Track color is not part of SDK 1.0.0-beta.0.
    color: null,
    isMuted: await safeGet(() => track.mute, null, "track.mute"),
    isSoloed: await safeGet(() => track.solo, null, "track.solo"),
    isArmed: await safeGet(() => track.arm, null, "track.arm"),
    groupTrackId: await getTrackId(groupTrack),
    input: await scanInputRouting(track),
    output: await scanOutputRouting(track),
    devices: await scanDevices(devices, scanState),
    sends: await scanSends(track),
  } satisfies TrackInfo;

  console.log(
    `[Ableton Session Mapper] Scan track completed: ${trackName} (devices=${result.devices.length}, sends=${result.sends.length})`,
  );
  return result;
}

export async function scanTracks(
  tracks: Track<"1.0.0">[],
  role: TrackRole,
  groupIds: Set<string>,
  scanState: ScanState,
): Promise<TrackInfo[]> {
  const results: TrackInfo[] = [];
  for (const [index, track] of tracks.entries()) {
    if (scanTimedOut(scanState)) break;
    results.push(await scanTrack(track, index, role, groupIds, scanState));
  }
  return results;
}
