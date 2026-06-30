# SDK Capability Matrix

Generated at: 2026-06-30T08:48:18.886Z

## Summary

| Status | Count |
| --- | ---: |
| supported | 20 |
| partial | 4 |
| unavailable | 38 |
| unsafe | 3 |
| unknown | 2 |
| not-tested | 10 |

## Set

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Set name | unavailable | Not exposed by current SDK scan | Set name is not exposed on this SDK object. | 2 ms | low |
| Tempo | supported | Read from song.tempo | — | 2 ms | low |
| Time signature | unavailable | Not exposed by current SDK scan | No stable time signature property found. | 3 ms | low |
| Key / scale | supported | Read via scaleName | — | 3 ms | low |
| Arrangement / session info | supported | Tracks and scenes are readable from the song object | — | 3 ms | low |

## Tracks

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Track list | supported | Read from first 5 tracks | — | 1 ms | low |
| Track order | supported | Order preserved from song.tracks / returnTracks / mainTrack | — | 1 ms | low |
| Track name | supported | Read from first 5 tracks | — | 1 ms | low |
| Track type audio/midi/return/master | supported | Derived from SDK track classes and role | — | 0 ms | low |
| Track color | unavailable | Not exposed by current SDK scan | Track color is not exposed by the current SDK scan. | 15 ms | low |
| Mute | supported | Read via mute | — | 15 ms | low |
| Solo | supported | Read via solo | — | 8 ms | low |
| Arm | supported | Read via arm | — | 15 ms | low |
| Fold | unavailable | Not exposed by current SDK scan | Fold information is not consistently exposed. | 15 ms | low |
| Group membership | partial | groupTrack property visible on 5/5 sampled tracks | Only parent-link visibility is tested here. | 0 ms | medium |
| Parent group | unavailable | No parent group value returned on sampled tracks | — | 0 ms | low |
| Child tracks | unavailable | No direct child tracks collection found | — | 0 ms | low |

## Mixer

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Volume | supported | Read via volume | — | 2 ms | low |
| Pan | supported | Read via panning | — | 16 ms | low |
| Sends count | unavailable | Read from first sampled track | — | 1 ms | low |
| Send names | unknown | Probe failed | Cannot read properties of undefined (reading 'map') | 1 ms | medium |
| Send values | unknown | Probe failed | Cannot read properties of undefined (reading 'map') | 1 ms | medium |
| Return tracks | supported | Read from song.returnTracks | — | 2 ms | low |
| Master track | supported | Read from song.mainTrack | — | 2 ms | low |

## Routing I/O

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Audio From | unavailable | Not exposed by current SDK scan | Not exposed by current SDK scan | 18 ms | low |
| Audio To | unavailable | Not exposed by current SDK scan | Not exposed by current SDK scan | 18 ms | low |
| MIDI From | unavailable | Not exposed by current SDK scan | Not exposed by current SDK scan | 18 ms | low |
| MIDI To | unavailable | Not exposed by current SDK scan | Not exposed by current SDK scan | 18 ms | low |
| External In | unavailable | Not exposed by current SDK scan | Not exposed by current SDK scan | 18 ms | low |
| External Out | unavailable | Not exposed by current SDK scan | Not exposed by current SDK scan | 18 ms | low |
| Monitor mode | unavailable | Not exposed by current SDK scan | Monitor mode is not exposed by the sampled tracks. | 17 ms | low |
| Sidechain source | unavailable | Not exposed by current SDK scan | Sidechain source is not exposed by current SDK scan | 18 ms | low |
| Sidechain enabled | unavailable | Not exposed by current SDK scan | Sidechain enabled state is not exposed by current SDK scan | 17 ms | low |
| Group routing | partial | Property exists (groupTrack) but no stable value was returned | Group routing is not directly exposed. | 18 ms | medium |
| Return routing | unavailable | Not exposed by current SDK scan | Return routing is not exposed by current SDK scan | 17 ms | low |
| Master routing | unavailable | Not exposed by current SDK scan | Master routing is not exposed by current SDK scan | 17 ms | low |

## Devices

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Device list | supported | Read from 5 sampled tracks | — | 0 ms | low |
| Device order | supported | Order preserved from track.devices | — | 0 ms | low |
| Device name | supported | Read from 4 sampled devices | — | 0 ms | low |
| Device type/class | unavailable | Not exposed by current SDK scan | Device class/type is not stably exposed on sampled devices. | 0 ms | low |
| Is rack | partial | Derived from RackDevice instances and object type names | — | 0 ms | low |
| Device enabled | unavailable | Not exposed by current SDK scan | Device enabled state is not consistently exposed. | 0 ms | low |
| Device parameters | supported | Read from up to 200 sampled parameters | — | 0 ms | low |
| Parameter name | supported | Read via name | — | 1 ms | low |
| Parameter value | unavailable | Not exposed by current SDK scan | Parameter values are not exposed on sampled parameters. | 1 ms | low |
| Parameter min/max | supported | Read via min | — | 2 ms | low |
| Parameter automation state | unavailable | Not exposed by current SDK scan | Automation state is not exposed on sampled parameters. | 2 ms | low |

## Racks

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Rack detection | partial | Rack-like devices detected from sampled device list | — | 0 ms | low |
| Rack chains count | unavailable | Not exposed by current SDK scan | Chains are not exposed on sampled racks. | 6 ms | low |
| Chain names | unavailable | No racks sampled | — | 0 ms | low |
| Chain devices | unsafe | Disabled in diagnostic mode to protect Live stability | Deep chain-device recursion is intentionally disabled because earlier scans could stall or freeze Live. | 0 ms | high |
| Nested racks | unsafe | Disabled in diagnostic mode to protect Live stability | Nested rack recursion remains disabled in capability-matrix mode. | 0 ms | high |
| Drum rack pads | unavailable | Not exposed by current SDK scan | Pad collections are not exposed on sampled racks. | 6 ms | low |
| Pad names | unavailable | No racks sampled | — | 0 ms | low |
| Pad chains | unsafe | Disabled in diagnostic mode to protect Live stability | Per-pad chain traversal is intentionally skipped in shallow capability mode. | 0 ms | high |
| Macro controls | unavailable | No racks sampled | Only visible macro-like parameter names are counted here. | 0 ms | medium |
| Rack variations | unavailable | Not exposed by current SDK scan | Rack variations are not exposed on sampled racks. | 6 ms | low |

## Clips

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Session clips | unavailable | No clipSlots collection found on sampled scenes | — | 2 ms | low |
| Clip slots | unavailable | Not exposed by current SDK scan | Clip-slot collections are not exposed on sampled scenes. | 2 ms | low |
| Clip names | not-tested | Skipped in shallow capability mode | Clip object traversal is skipped by default to avoid context-dependent scans. | 0 ms | low |
| Clip colors | not-tested | Skipped in shallow capability mode | Clip color probing is skipped in shallow capability mode. | 0 ms | low |
| MIDI clip notes | not-tested | Skipped in shallow capability mode | Reading note lists can be expensive and is not part of the default capability scan. | 0 ms | low |
| Audio clip metadata | not-tested | Skipped in shallow capability mode | Audio clip metadata remains untested in shallow capability mode. | 0 ms | low |
| Arrangement clips | not-tested | Skipped in shallow capability mode | Arrangement clip traversal is not enabled by default. | 0 ms | low |
| Clip start/end | not-tested | Skipped in shallow capability mode | Clip timing fields are not traversed in the default safe scan. | 0 ms | low |
| Loop start/end | not-tested | Skipped in shallow capability mode | Loop timing fields are not traversed in the default safe scan. | 0 ms | low |
| Warp info | not-tested | Skipped in shallow capability mode | Warp-related clip probing remains disabled by default. | 0 ms | low |

## Arrangement

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Arrangement locators | unavailable | Not exposed by current SDK scan | Arrangement locators are not exposed on the current song object. | 1 ms | low |
| Arrangement clips | not-tested | Skipped in shallow capability mode | Arrangement clip traversal remains disabled in capability-matrix mode. | 0 ms | low |
| Automation lanes | not-tested | Skipped in shallow capability mode | Automation-lane probing remains disabled in capability-matrix mode. | 0 ms | low |
| Selected arrangement region | unavailable | Not exposed by current SDK scan | Arrangement selection is not exposed on the current song object. | 1 ms | low |
| Current song position | unavailable | Not exposed by current SDK scan | Current song position is not exposed on the current song object. | 1 ms | low |

## Browser / Files

| Capability | Status | Evidence | Notes | Duration | Risk |
| --- | --- | --- | --- | ---: | --- |
| Project path | unavailable | Not exposed by current SDK scan | Project path is not exposed on the current song object. | 1 ms | low |
| Set path | unavailable | Not exposed by current SDK scan | Set path is not exposed on the current song object. | 1 ms | low |
| Sample references | unavailable | Not exposed by current SDK scan | Sample references are not exposed on the current song object. | 1 ms | low |
| Missing media | unavailable | Not exposed by current SDK scan | Missing media is not exposed on the current song object. | 1 ms | low |
| Device preset paths | unavailable | Not exposed by current SDK scan | Device preset paths are not exposed on the current song object. | 1 ms | low |

## Supported

- Tempo
- Key / scale
- Arrangement / session info
- Track list
- Track order
- Track name
- Track type audio/midi/return/master
- Mute
- Solo
- Arm
- Volume
- Pan
- Return tracks
- Master track
- Device list
- Device order
- Device name
- Device parameters
- Parameter name
- Parameter min/max

## Partial

- Group membership
- Group routing
- Is rack
- Rack detection

## Unavailable

- Set name
- Time signature
- Track color
- Fold
- Parent group
- Child tracks
- Sends count
- Audio From
- Audio To
- MIDI From
- MIDI To
- External In
- External Out
- Monitor mode
- Sidechain source
- Sidechain enabled
- Return routing
- Master routing
- Device type/class
- Device enabled
- Parameter value
- Parameter automation state
- Rack chains count
- Chain names
- Drum rack pads
- Pad names
- Macro controls
- Rack variations
- Session clips
- Clip slots
- Arrangement locators
- Selected arrangement region
- Current song position
- Project path
- Set path
- Sample references
- Missing media
- Device preset paths

## Unsafe

- Chain devices
- Nested racks
- Pad chains

## Unknown / Not tested

- Send names (unknown)
- Send values (unknown)
- Clip names (not-tested)
- Clip colors (not-tested)
- MIDI clip notes (not-tested)
- Audio clip metadata (not-tested)
- Arrangement clips (not-tested)
- Clip start/end (not-tested)
- Loop start/end (not-tested)
- Warp info (not-tested)
- Arrangement clips (not-tested)
- Automation lanes (not-tested)

