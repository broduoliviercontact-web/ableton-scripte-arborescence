import type { DeviceParameter, Track } from "@ableton-extensions/sdk";
import { safeGet, type RoutingInfo, type SendInfo } from "./types.js";

const unavailableRouting = (): RoutingInfo => ({ type: null, channel: null });

export async function scanInputRouting(
  _track: Track<"1.0.0">,
): Promise<RoutingInfo> {
  // TODO: Read input routing type/channel when exposed by the Extensions SDK.
  return unavailableRouting();
}

export async function scanOutputRouting(
  _track: Track<"1.0.0">,
): Promise<RoutingInfo> {
  // TODO: Read output routing type/channel when exposed by the Extensions SDK.
  return unavailableRouting();
}

export async function scanSends(
  track: Track<"1.0.0">,
): Promise<SendInfo[]> {
  const mixer = await safeGet(() => track.mixer, null, "track.mixer");
  if (!mixer) return [];

  const sends = await safeGet<DeviceParameter<"1.0.0">[]>(
    () => mixer.sends,
    [],
    "track.mixer.sends",
  );

  return Promise.all(
    sends.map(async (send, index) => {
      const handle = await safeGet(() => send.handle, null, "send.handle");
      return {
        id: handle?.id.toString() ?? `send-${index}`,
        index,
        name: await safeGet(() => send.name, `Send ${index + 1}`, "send.name"),
        value: await safeGet(() => send.getValue(), null, "send.value"),
      };
    }),
  );
}

// TODO: Scan device sidechain routing when the SDK exposes sidechain properties.
