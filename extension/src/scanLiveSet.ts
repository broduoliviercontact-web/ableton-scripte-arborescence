import type { ExtensionContext, Track } from "@ableton-extensions/sdk";
import { APP_VERSION } from "./appInfo.js";
import { createScanState, scanStateSummary, scanTimedOut } from "./scanDevices.js";
import { findGroupTrackIds, scanTrack, scanTracks } from "./scanTracks.js";
import { safeGet, type SessionMap } from "./types.js";

export async function scanLiveSet(
  context: ExtensionContext<"1.0.0">,
): Promise<SessionMap> {
  const song = await safeGet(() => context.application.song, null, "application.song");
  if (!song) {
    throw new Error("The current Live Set is unavailable.");
  }

  const tracks = await safeGet<Track<"1.0.0">[]>(
    () => song.tracks,
    [],
    "song.tracks",
  );
  const returnTracks = await safeGet<Track<"1.0.0">[]>(
    () => song.returnTracks,
    [],
    "song.returnTracks",
  );
  const mainTrack = await safeGet(() => song.mainTrack, null, "song.mainTrack");
  const groupIds = await findGroupTrackIds(tracks);
  const scanState = createScanState();

  const scannedTracks = await scanTracks(tracks, "regular", groupIds, scanState);
  const scannedReturnTracks = scanTimedOut(scanState)
    ? []
    : await scanTracks(returnTracks, "return", groupIds, scanState);
  const scannedMasterTrack = mainTrack && !scanTimedOut(scanState)
    ? await scanTrack(mainTrack, 0, "master", groupIds, scanState)
    : null;
  console.log("[Ableton Session Mapper] Scan Live Set completed");

  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    set: {
      // The current SDK exposes no Live Set name/path.
      name: null,
      tempo: await safeGet(() => song.tempo, null, "song.tempo"),
    },
    scan: scanStateSummary(scanState),
    tracks: scannedTracks,
    returnTracks: scannedReturnTracks,
    masterTrack: scannedMasterTrack,
  };
}
