"use strict";var ct=Object.defineProperty;var nr=Object.getOwnPropertyDescriptor;var ar=Object.getOwnPropertyNames;var rr=Object.prototype.hasOwnProperty;var ir=(e,t)=>{for(var n in t)ct(e,n,{get:t[n],enumerable:!0})},sr=(e,t,n,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of ar(t))!rr.call(e,r)&&r!==n&&ct(e,r,{get:()=>t[r],enumerable:!(a=nr(t,r))||a.enumerable});return e};var or=e=>sr(ct({},"__esModule",{value:!0}),e);var Vo={};ir(Vo,{activate:()=>Lo});module.exports=or(Vo);var tr=require("node:child_process");var N=class sn{constructor(t,n,a){this.handle=t,this.dataModel=n,this.objectRegistry=a}get parent(){let t=this.dataModel.getObjectCanonicalParent(this.handle);return t?this.objectRegistry.getObjectFromHandle(t,sn):null}},ne=(e,t,...n)=>new Promise((a,r)=>{e.withinTransaction(()=>t(...n,a,r))}),R=(e,t,n,a,...r)=>new Promise((i,s)=>{e.withinTransaction(()=>a(...r,o=>i(t.getObjectFromHandle(o,n)),s))}),me=class extends N{static className="Clip";get name(){return this.dataModel.clipGetName(this.handle)}set name(e){this.dataModel.withinTransaction(()=>{this.dataModel.clipSetName(this.handle,e)})}get startTime(){return this.dataModel.clipGetStartTime(this.handle)}get endTime(){return this.dataModel.clipGetEndTime(this.handle)}get duration(){return this.dataModel.clipGetEndTime(this.handle)-this.dataModel.clipGetStartTime(this.handle)}get startMarker(){return this.dataModel.clipGetStartMarker(this.handle)}get endMarker(){return this.dataModel.clipGetEndMarker(this.handle)}get looping(){return this.dataModel.clipGetLooping(this.handle)}set looping(e){this.dataModel.withinTransaction(()=>{this.dataModel.clipSetLooping(this.handle,e)})}get loopStart(){return this.dataModel.clipGetLoopStart(this.handle)}get loopEnd(){return this.dataModel.clipGetLoopEnd(this.handle)}get color(){return this.dataModel.clipGetColor(this.handle)}set color(e){this.dataModel.withinTransaction(()=>{this.dataModel.clipSetColor(this.handle,e)})}get muted(){return this.dataModel.clipGetMuted(this.handle)}set muted(e){this.dataModel.withinTransaction(()=>{this.dataModel.clipSetMuted(this.handle,e)})}},Ue=class extends me{static className="AudioClip";get filePath(){return this.dataModel.audioclipGetFilePath(this.handle)}get warping(){return this.dataModel.audioclipGetWarping(this.handle)}set warping(e){this.dataModel.withinTransaction(()=>{this.dataModel.audioclipSetWarping(this.handle,e)})}get warpMode(){return this.dataModel.audioclipGetWarpMode(this.handle)}set warpMode(e){this.dataModel.withinTransaction(()=>{this.dataModel.audioclipSetWarpMode(this.handle,e)})}get warpMarkers(){return this.dataModel.audioclipGetWarpMarkers(this.handle)}},We=class extends me{static className="MidiClip";get notes(){return this.dataModel.midiclipGetNotes(this.handle)}set notes(e){this.dataModel.withinTransaction(()=>{this.dataModel.midiclipSetNotes(this.handle,e)})}},on=class extends N{static className="ClipSlot";get clip(){let e=this.dataModel.clipslotGetClip(this.handle);return e?this.objectRegistry.getObjectFromHandle(e,me):null}deleteClip(){return ne(this.dataModel,this.dataModel.clipslotDeleteClip,this.handle)}createMidiClip(e){return R(this.dataModel,this.objectRegistry,We,this.dataModel.clipslotCreateMidiClip,this.handle,e)}createAudioClip(e){return R(this.dataModel,this.objectRegistry,Ue,this.dataModel.clipslotCreateAudioClip,this.handle,{filePath:e.filePath,isWarped:e.isWarped,loopSettings:e.loopSettings})}},ae=class extends N{static className="DeviceParameter";get name(){return this.dataModel.deviceParameterGetName(this.handle)}get min(){return this.dataModel.deviceParameterGetInternalMin(this.handle)}get max(){return this.dataModel.deviceParameterGetInternalMax(this.handle)}get isQuantized(){return this.dataModel.deviceParameterGetIsQuantized(this.handle)}get defaultValue(){return this.dataModel.deviceParameterGetDefaultValue(this.handle)}get valueItems(){return this.dataModel.deviceParameterGetValueItems(this.handle)}getValue(){return new Promise(e=>{this.dataModel.deviceParameterGetInternalValue(this.handle,e)})}setValue(e){return new Promise((t,n)=>{this.dataModel.withinTransaction(()=>{this.dataModel.deviceParameterSetInternalValue(this.handle,e,t,a=>n(new Error(a)))})})}},B=class extends N{static className="Device";get name(){return this.dataModel.deviceGetName(this.handle)}get parameters(){return this.dataModel.deviceGetParameters(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,ae))}},dt=class extends N{static className="TakeLane";get clips(){return this.dataModel.takelaneGetClips(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,me))}get name(){return this.dataModel.takelaneGetName(this.handle)}set name(e){this.dataModel.withinTransaction(()=>{this.dataModel.takelaneSetName(this.handle,e)})}createMidiClip(e,t){return R(this.dataModel,this.objectRegistry,We,this.dataModel.takelaneCreateMidiClip,this.handle,e,t)}createAudioClip(e){return R(this.dataModel,this.objectRegistry,Ue,this.dataModel.takelaneCreateAudioClip,this.handle,{duration:e.duration,filePath:e.filePath,isWarped:e.isWarped,loopSettings:e.loopSettings,startTime:e.startTime})}},ln=class extends N{static className="MixerDevice";get volume(){return this.objectRegistry.getObjectFromHandle(this.dataModel.mixerdeviceGetVolume(this.handle),ae)}get panning(){return this.objectRegistry.getObjectFromHandle(this.dataModel.mixerdeviceGetPanning(this.handle),ae)}get sends(){return this.dataModel.mixerdeviceGetSends(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,ae))}},le=class cn extends N{static className="Track";get name(){return this.dataModel.trackGetName(this.handle)}set name(t){this.dataModel.withinTransaction(()=>{this.dataModel.trackSetName(this.handle,t)})}get mute(){return this.dataModel.trackGetMute(this.handle)}set mute(t){this.dataModel.withinTransaction(()=>{this.dataModel.trackSetMute(this.handle,t)})}get solo(){return this.dataModel.trackGetSolo(this.handle)}set solo(t){this.dataModel.withinTransaction(()=>{this.dataModel.trackSetSolo(this.handle,t)})}get mutedViaSolo(){return this.dataModel.trackGetMutedViaSolo(this.handle)}get arm(){return this.dataModel.trackGetArm(this.handle)}set arm(t){this.dataModel.withinTransaction(()=>{this.dataModel.trackSetArm(this.handle,t)})}get clipSlots(){return this.dataModel.trackGetClipSlots(this.handle).map(t=>this.objectRegistry.getObjectFromHandle(t,on))}get takeLanes(){return this.dataModel.trackGetTakeLanes(this.handle).map(t=>this.objectRegistry.getObjectFromHandle(t,dt))}get arrangementClips(){return this.dataModel.trackGetArrangementClips(this.handle).map(t=>this.objectRegistry.getObjectFromHandle(t,me))}get groupTrack(){let t=this.dataModel.trackGetGroupTrack(this.handle);return t?this.objectRegistry.getObjectFromHandle(t,cn):null}get devices(){return this.dataModel.trackGetDevices(this.handle).map(t=>this.objectRegistry.getObjectFromHandle(t,B))}get mixer(){return this.objectRegistry.getObjectFromHandle(this.dataModel.trackGetMixerDevice(this.handle),ln)}createTakeLane(){return R(this.dataModel,this.objectRegistry,dt,this.dataModel.trackCreateTakeLane,this.handle)}insertDevice(t,n){return R(this.dataModel,this.objectRegistry,B,this.dataModel.trackInsertDevice,this.handle,t,BigInt(n))}deleteDevice(t){return ne(this.dataModel,this.dataModel.trackDeleteDevice,this.handle,t.handle)}duplicateDevice(t){return R(this.dataModel,this.objectRegistry,B,this.dataModel.trackDuplicateDevice,this.handle,t.handle)}deleteClip(t){return ne(this.dataModel,this.dataModel.trackDeleteClip,this.handle,t.handle)}clearClipsInRange(t,n){return ne(this.dataModel,this.dataModel.trackClearClipsInRange,this.handle,t,n)}},re=class extends le{static className="AudioTrack";createAudioClip(e){return R(this.dataModel,this.objectRegistry,Ue,this.dataModel.trackCreateAudioClip,this.handle,{duration:e.duration,filePath:e.filePath,isWarped:e.isWarped,loopSettings:e.loopSettings,startTime:e.startTime})}},ut=class extends N{static className="CuePoint";get time(){return this.dataModel.cuePointGetTime(this.handle)}get name(){return this.dataModel.cuePointGetName(this.handle)}set name(e){this.dataModel.withinTransaction(()=>{this.dataModel.cuePointSetName(this.handle,e)})}},ie=class extends le{static className="MidiTrack";createMidiClip(e,t){return R(this.dataModel,this.objectRegistry,We,this.dataModel.trackCreateMidiClip,this.handle,e,t)}},Be=class extends N{static className="Scene";get name(){return this.dataModel.sceneGetName(this.handle)}set name(e){this.dataModel.withinTransaction(()=>{this.dataModel.sceneSetName(this.handle,e)})}get tempo(){return this.dataModel.sceneGetTempo(this.handle)}get signatureNumerator(){return this.dataModel.sceneGetSignatureNumerator(this.handle)}get signatureDenominator(){return this.dataModel.sceneGetSignatureDenominator(this.handle)}},dn=class extends N{static className="Song";get tracks(){return this.dataModel.songGetTracks(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,le))}get returnTracks(){return this.dataModel.songGetReturnTracks(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,le))}get mainTrack(){return this.objectRegistry.getObjectFromHandle(this.dataModel.songGetMainTrack(this.handle),le)}get scenes(){return this.dataModel.songGetScenes(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,Be))}get cuePoints(){return this.dataModel.songGetCuePoints(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,ut))}get tempo(){return this.dataModel.songGetTempo(this.handle)}set tempo(e){this.dataModel.withinTransaction(()=>{this.dataModel.songSetTempo(this.handle,e)})}get gridQuantization(){return this.dataModel.songGetGridQuantization(this.handle)}get gridIsTriplet(){return this.dataModel.songGetGridIsTriplet(this.handle)}get rootNote(){return Number(this.dataModel.songGetRootNote(this.handle))}get scaleName(){return this.dataModel.songGetScaleName(this.handle)}get scaleMode(){return this.dataModel.songGetScaleMode(this.handle)}get scaleIntervals(){return this.dataModel.songGetScaleIntervals(this.handle).map(Number)}createAudioTrack(){return R(this.dataModel,this.objectRegistry,re,this.dataModel.songCreateAudioTrack,this.handle)}createMidiTrack(){return R(this.dataModel,this.objectRegistry,ie,this.dataModel.songCreateMidiTrack,this.handle)}createScene(e){return R(this.dataModel,this.objectRegistry,Be,this.dataModel.songCreateScene,this.handle,BigInt(e))}deleteTrack(e){return ne(this.dataModel,this.dataModel.songDeleteTrack,this.handle,e.handle)}deleteScene(e){return ne(this.dataModel,this.dataModel.songDeleteScene,this.handle,e.handle)}duplicateTrack(e){return R(this.dataModel,this.objectRegistry,le,this.dataModel.songDuplicateTrack,this.handle,e.handle)}duplicateScene(e){return R(this.dataModel,this.objectRegistry,Be,this.dataModel.songDuplicateScene,this.handle,e.handle)}createCuePoint(e){return R(this.dataModel,this.objectRegistry,ut,this.dataModel.songCreateCuePoint,this.handle,e)}deleteCuePoint(e){return ne(this.dataModel,this.dataModel.songDeleteCuePoint,this.handle,e.handle)}},un=class extends N{static className="Application";get song(){return this.objectRegistry.getObjectFromHandle(this.dataModel.rootGetSong(this.handle),dn)}},lr=class{module;constructor(e){this.module=e}registerCommand(e,t){this.module.registerCommand(e,t)}executeCommand(e,...t){this.module.executeCommand(e,...t)}},pn=class extends N{static className="ChainMixerDevice";get volume(){return this.objectRegistry.getObjectFromHandle(this.dataModel.chainmixerdeviceGetVolume(this.handle),ae)}get panning(){return this.objectRegistry.getObjectFromHandle(this.dataModel.chainmixerdeviceGetPanning(this.handle),ae)}get sends(){return this.dataModel.chainmixerdeviceGetSends(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,ae))}},Je=class extends N{static className="Chain";get devices(){return this.dataModel.chainGetDevices(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,B))}get mixer(){return this.objectRegistry.getObjectFromHandle(this.dataModel.chainGetMixerDevice(this.handle),pn)}insertDevice(e,t){return R(this.dataModel,this.objectRegistry,B,this.dataModel.chainInsertDevice,this.handle,e,BigInt(t))}deleteDevice(e){return ne(this.dataModel,this.dataModel.chainDeleteDevice,this.handle,e.handle)}duplicateDevice(e){return R(this.dataModel,this.objectRegistry,B,this.dataModel.chainDuplicateDevice,this.handle,e.handle)}},mn=class extends Je{static className="DrumChain";get receivingNote(){return Number(this.dataModel.drumchainGetReceivingNote(this.handle))}set receivingNote(e){this.dataModel.withinTransaction(()=>{this.dataModel.drumchainSetReceivingNote(this.handle,BigInt(e))})}},J=class extends B{static className="RackDevice";get chains(){return this.dataModel.rackdeviceGetChains(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,Je))}insertChain(e){return R(this.dataModel,this.objectRegistry,Je,this.dataModel.rackdeviceInsertChain,this.handle,BigInt(e))}},cr=class extends J{static className="DrumRackDevice";get chains(){return this.dataModel.rackdeviceGetChains(this.handle).map(e=>this.objectRegistry.getObjectFromHandle(e,mn))}},pt=class extends N{static className="Sample";get filePath(){return this.dataModel.sampleGetFilePath(this.handle)}},dr=class extends B{static className="Simpler";get sample(){let e=this.dataModel.simplerGetSample(this.handle);return e?this.objectRegistry.getObjectFromHandle(e,pt):null}replaceSample(e){return R(this.dataModel,this.objectRegistry,pt,this.dataModel.simplerReplaceSample,this.handle,e)}},ur=[un,dn,re,ie,le,Ue,We,me,on,dt,dr,cr,J,B,pt,mn,Je,Be,ut,ae,ln,pn],pr=class{cache=new Map;dataModel;constructor(e){this.dataModel=e}getOrCreateObjectFromHandle(e){let t=this.cache.get(e.id);if(t)return t;let n=ur.find(r=>this.dataModel.getObjectIsOfClass(e,r.className));if(!n)throw new Error("Unknown object type");let a=new n(e,this.dataModel,this);return this.cache.set(e.id,a),a}getObjectFromHandle(e,t){let n=this.getOrCreateObjectFromHandle(e);if(!(n instanceof t))throw new Error("Object of incorrect type");return n}},mr=class{module;constructor(e){this.module=e}get storageDirectory(){return this.module.storageDirectory}get tempDirectory(){return this.module.tempDirectory}get language(){return this.module.language}},gr=class{module;constructor(e){this.module=e}renderPreFxAudio(e,t,n){return new Promise((a,r)=>{this.module.renderPreFxAudio(e.handle,{endTime:n,startTime:t},a,r)})}importIntoProject(e){return new Promise((t,n)=>{this.module.importIntoProject(e,t,n)})}},rn=(e,t)=>typeof t=="number"?{progress:t,text:e}:{text:e},fr=class{module;constructor(e){this.module=e}registerContextMenuAction(e,t,n){return new Promise(a=>{this.module.registerContextMenuAction(e,t,n,r=>{a(()=>new Promise(i=>{r(i)}))})})}showModalDialog(e,t,n){return new Promise((a,r)=>{this.module.showModalDialog(e,t,n,a,r)})}withinProgressDialog(e,t,n){let a=new AbortController;return new Promise((r,i)=>{this.module.showProgressDialog(rn(e,t.progress),({update:s,close:o})=>{let l=(d,f)=>new Promise(g=>{s(rn(d,f),g)}),c=()=>new Promise(d=>{o(d)});n(l,a.signal).finally(c).then(r).catch(i)},()=>{a.abort()})})}},gn=(e,t)=>{let{commands:n,dataModel:a,environment:r,resources:i,ui:s}=e.initializeExtensionHost({apiVersion:t}),o=new pr(a);return{application:o.getObjectFromHandle(a.getRoot(),un),commands:new lr(n),environment:new mr(r),getObjectFromHandle:o.getObjectFromHandle.bind(o),resources:new gr(i),ui:new fr(s),withinTransaction:a.withinTransaction.bind(a)}};var M=require("node:fs/promises"),Wn=require("node:child_process"),S=require("node:path"),Xn=require("node:util");function fn(e){return JSON.stringify(e).replaceAll("<","\\u003c").replaceAll(">","\\u003e").replaceAll("&","\\u0026").replaceAll("\u2028","\\u2028").replaceAll("\u2029","\\u2029")}function bn(e,t,n=null){return`<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Ableton Session Mapper \u2014 ${hn(e.set.name??"Untitled Set")}</title>
  <style>${t}</style>
</head>
<body class="mode-detailed">
  <div class="ambient-grid" aria-hidden="true"></div>
  <header class="masthead">
    <div class="brand-block">
      <span class="live-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <div>
        <p class="eyebrow">Ableton Session Mapper / JSON ${hn(e.version)}</p>
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
    <button type="button" onclick="requestViewerAction('refresh')">\u21BB Refresh</button>
    <button type="button" onclick="requestViewerAction('export-html')">\u21E9 Export HTML</button>
    <button class="debug-action" type="button" onclick="requestViewerAction('debug-sdk-data')">\u2301 Debug SDK Data</button>
    <button class="close-action" type="button" onclick="requestViewerAction('close')">Close</button>
  </nav>

  <main>
    <section class="telemetry" aria-label="R\xE9sum\xE9 de la session">
      <article><span class="metric-value" id="tempo">\u2014</span><span class="metric-label">BPM</span></article>
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
    const session = ${fn(e)};
    const sdkDiagnostic = ${fn(n)};

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
    const manualValue = (value) => value && String(value).trim().length ? String(value).trim() : "\u2014";
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

    const formatValue = (value, digits = 3) => typeof value === "number" ? value.toFixed(digits) : "\u2014";
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
            '<div class="track-state" aria-label="\xC9tat de la piste">' + stateLeds(track) + '</div>' +
          '</header>' +
          '<div class="routing-grid">' +
            '<div><span>IN</span><strong>' + escapeHtml(routingText(track.input)) + '</strong></div>' +
            '<div><span>OUT</span><strong>' + escapeHtml(routingText(track.output)) + '</strong></div>' +
          '</div>' +
          '<div class="track-detail"><span class="detail-label">Device chain \xB7 ' + countDevicesDeep(track.devices) + '</span>' + deviceChain(track.devices) + '</div>' +
          '<div class="track-detail sends-row"><span class="detail-label">Sends \xB7 ' + asArray(track.sends).length + '</span>' + sendsList(track.sends) + '</div>' +
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
    document.getElementById("tempo").textContent = session.set?.tempo ?? "\u2014";
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
      if (value === undefined) return "\u2014";
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
        '<div class="diagnostic-empty"><strong>No SDK diagnostic loaded.</strong><span>Use \u201CExport SDK Diagnostic JSON\u201D in Live, then regenerate the HTML.</span></div>';
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
</html>`}function hn(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}var U=require("node:fs/promises"),j=require("node:path"),mt=require("node:url"),wn=require("node:url"),Tn={},hr=typeof __dirname<"u"?__dirname:(0,j.dirname)((0,wn.fileURLToPath)(Tn.url)),Xe=(0,j.resolve)(hr,".."),Sn=e=>{let t=process.argv.indexOf(e);return t>=0?process.argv[t+1]:void 0},br=(0,j.resolve)(Sn("--json")??(0,j.resolve)(Xe,"exports/session-map.json")),vr=(0,j.resolve)(Sn("--output")??(0,j.resolve)(Xe,"exports/session-map-session-grid.html")),gt="[session-grid]";async function vn(e){try{return await(0,U.access)(e),!0}catch{return!1}}function Me(e){return String(e).padStart(2,"0")}function kn(e,t){let n=new Date(e),a=Number.isNaN(n.getTime())?new Date:n,r=[a.getFullYear(),Me(a.getMonth()+1),Me(a.getDate())].join("-"),i=[Me(a.getHours()),Me(a.getMinutes())];return t&&i.push(Me(a.getSeconds())),`${r}_${i.join("-")}`}function kr(e){return(e??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[<>:"/\\|?*\x00-\x1f]/g," ").replace(/[^A-Za-z0-9._ -]/g," ").trim().replace(/[ .]+/g,"-").replace(/-+/g,"-").replace(/^[-_.]+|[-_.]+$/g,"")}function xr(e){let t=kr(e.set.name);return t?`${t}_Session-Grid`:"Ableton-Session-Grid"}async function yr(e,t){let n=(0,j.dirname)(t);await(0,U.mkdir)(n,{recursive:!0});let a=xr(e),r=kn(e.exportedAt,!1),i=kn(e.exportedAt,!0),s=[`${a}_${r}`,`${a}_${i}`];for(let l of s){let c=(0,j.join)(n,`${l}.html`);if(!await vn(c))return{latestPath:t,archivePath:c}}let o=2;for(;o<1e4;){let l=(0,j.join)(n,`${a}_${i}-${o}.html`);if(!await vn(l))return{latestPath:t,archivePath:l};o+=1}throw new Error("Unable to reserve a unique session-grid archive filename.")}function A(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function wr(e,t){let n=e.trim();return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function Sr(e){let t=e.name?.trim()||`Track ${e.index+1}`,n=t.split("|")[0]?.trim()||t;return wr(n,22)}function Mr(e){switch(e){case"midi":return"MIDI";case"audio":return"Audio";case"group":return"Group";case"return":return"Return";case"master":return"Master";default:return"Track"}}function Tr(e){switch(e){case"midi":return"MIDI Track";case"audio":return"Audio Track";case"group":return"Group Track";case"return":return"Return";case"master":return"Master";default:return"Track"}}function Pr(e){switch(e){case"midi":return"kind-midi";case"audio":return"kind-audio";case"group":return"kind-group";case"return":return"kind-return";case"master":return"kind-master";default:return"kind-unknown"}}function xn(e){let t=[e?.type,e?.channel].filter(Boolean);return t.length>0?t.join(" / "):"Routing I/O non disponible dans cette version du SDK"}function Te(e){return e&&e.trim().length>0?e.trim():"\u2014"}function Mn(e){return e.type.toLowerCase().includes("rack")||!!e.chainsSummary?.count||!!e.padsSummary?.count}function Dr(e){return A(e.name?.trim()||`Device ${e.index+1}`)}function Ar(e){return e.kind==="return"?'<span class="section-marker">RETURNS</span>':e.kind==="master"?'<span class="section-marker">MASTER</span>':""}function $r(e){let t=e.color?.trim(),n=t&&/^#?[0-9a-fA-F]{6}$/.test(t)?t.startsWith("#")?t:`#${t}`:null;return n?` style="--track-accent:${A(n)}"`:""}function yn(e,t){if(!t||t.count<=0)return"";let n=t.items.slice(0,6).map(r=>{let i=r.receivingNote??r.note,s=[i!==null?`note ${i}`:null,r.deviceCount!==null?`dev:${r.deviceCount}`:null].filter(Boolean).join(" \xB7 ");return`<li><span>${A(r.name||`${e} ${r.index+1}`)}</span>${s?`<small>${A(s)}</small>`:""}</li>`}),a=t.count>t.items.length?`<li><span>+${t.count-t.items.length} more</span></li>`:"";return`<div class="device-structure">
    <div class="structure-title">${e==="chains"?"Chains":"Pads"} \xB7 ${t.count}</div>
    <ul>${n.join("")}${a}</ul>
  </div>`}function Rr(e){let t=Mn(e),n=e.enabled===!1?"disabled":"active",a=[`<span>${A(t?"Rack":e.type||"Device")}</span>`,e.chainsSummary?.count?`<span>chains:${e.chainsSummary.count}</span>`:"",e.padsSummary?.count?`<span>pads:${e.padsSummary.count}</span>`:"",e.enabled===!1?"<span>disabled</span>":""].filter(Boolean).join("");return`<article class="device-card ${t?"is-rack":"is-device"} ${n}">
    <div class="device-head">
      <h3 title="${A(e.name||"")}">${Dr(e)}</h3>
      <div class="device-chips">${a}</div>
    </div>
    ${yn("chains",e.chainsSummary)}
    ${yn("pads",e.padsSummary)}
  </article>`}function Cr(e,t){let n=e.devices.filter(s=>Mn(s)).length,a=e.routing,r=(t.manualRouting?.connections??[]).filter(s=>s.from===e.name||s.to===e.name),i=e.devices.length?e.devices.map(Rr).join(""):'<div class="empty-state">No devices on this track.</div>';return`<section class="track-column ${Pr(e.kind)}"${$r(e)}>
    <div class="track-header">
      <div class="track-header-top">
        ${Ar(e)}
        <span class="track-pill">${A(Tr(e.kind))}</span>
      </div>
      <h2 title="${A(e.name||"")}">${A(Sr(e))}</h2>
      <p class="track-subtitle">${A(e.name||`Track ${e.index+1}`)}</p>
      <div class="track-stats">
        <span>#${e.index+1}</span>
        <span>${A(Mr(e.kind))}</span>
        <span>dev:${e.devices.length}</span>
        <span>sends:${e.sends.length}</span>
        ${n>0?`<span>racks:${n}</span>`:""}
        ${a?.source==="manual"?"<span>MANUAL</span>":""}
      </div>
    </div>
    <div class="track-routing">
      <div><strong>In</strong><span>${A(xn(e.input))}</span></div>
      <div><strong>Out</strong><span>${A(xn(e.output))}</span></div>
    </div>
    ${a?.source==="manual"?`<div class="track-routing manual-routing">
            <div><strong>MIDI From</strong><span>${A(Te(a.midiFrom))}</span></div>
            <div><strong>MIDI To</strong><span>${A(Te(a.midiTo))}</span></div>
            <div><strong>Audio From</strong><span>${A(Te(a.audioFrom))}</span></div>
            <div><strong>Audio To</strong><span>${A(Te(a.audioTo))}</span></div>
            <div><strong>Monitor</strong><span>${A(Te(a.monitor))}</span></div>
            <div><strong>Source</strong><span>MANUAL</span></div>
          </div>`:""}
    <div class="device-stack">
      ${i}
    </div>
    <div class="track-footer">
      <div class="footer-row"><strong>Sends</strong><span>${e.sends.length?A(e.sends.map(s=>s.name).join(", ")):"None"}</span></div>
      ${r.length?`<div class="footer-row"><strong>Manual Connections</strong><span>${A(r.map(s=>`${s.from} \u2192 ${s.to}${s.label?` \xB7 ${s.label}`:""}`).join(" | "))}</span></div>`:""}
    </div>
  </section>`}function Ir(e){let t=[...e.tracks,...e.returnTracks,...e.masterTrack?[e.masterTrack]:[]],n=t.reduce((i,s)=>i+s.devices.length,0),a=t.reduce((i,s)=>i+s.sends.length,0),r=t.map(i=>Cr(i,e)).join(`
`);return`<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Ableton Session Mapper \u2014 Session Grid</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b0f14;
      --panel: #11161d;
      --panel-2: #171d26;
      --text: #f3f5f7;
      --muted: #94a3b8;
      --line: rgba(255,255,255,0.09);
      --accent: #f5a623;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(245,166,35,0.06), transparent 18%),
        radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 40%),
        var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .shell {
      max-width: 100%;
      padding: 24px 20px 28px;
    }
    .masthead {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-end;
      margin-bottom: 18px;
    }
    .eyebrow {
      margin: 0 0 6px;
      color: var(--accent);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-size: 12px;
    }
    h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.05;
    }
    .meta {
      color: var(--muted);
      font-size: 14px;
      text-align: right;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .metric {
      background: rgba(17, 22, 29, 0.88);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
      margin-bottom: 4px;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    .frame {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: rgba(12, 16, 22, 0.88);
      padding: 16px;
      overflow-x: auto;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .session-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(250px, 280px);
      gap: 14px;
      align-items: start;
      min-width: max-content;
    }
    .track-column {
      --track-accent: #667085;
      background: linear-gradient(180deg, color-mix(in srgb, var(--track-accent) 18%, #10151c 82%), rgba(16, 21, 28, 0.96));
      border: 1px solid color-mix(in srgb, var(--track-accent) 45%, rgba(255,255,255,0.12));
      border-radius: 18px;
      padding: 12px;
      min-height: 520px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 14px 32px rgba(0,0,0,0.22);
    }
    .kind-midi { --track-accent: #8b7dff; }
    .kind-audio { --track-accent: #5f96ff; }
    .kind-group { --track-accent: #ad7fff; }
    .kind-return { --track-accent: #35c9f2; }
    .kind-master { --track-accent: #f5a623; }
    .kind-unknown { --track-accent: #7b8598; }
    .track-header {
      border-radius: 14px;
      padding: 12px;
      background: rgba(255,255,255,0.035);
      border: 1px solid rgba(255,255,255,0.06);
    }
    .track-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }
    .section-marker,
    .track-pill,
    .track-stats span,
    .device-chips span,
    .structure-title {
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.05);
    }
    .section-marker,
    .track-pill {
      padding: 4px 8px;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .section-marker {
      color: var(--accent);
      border-color: rgba(245,166,35,0.28);
      background: rgba(245,166,35,0.10);
    }
    .track-pill {
      color: #e5e7eb;
    }
    .track-header h2 {
      margin: 0;
      font-size: 21px;
      line-height: 1.05;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .track-subtitle {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 13px;
      min-height: 18px;
    }
    .track-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
    }
    .track-stats span,
    .device-chips span,
    .structure-title {
      padding: 4px 8px;
      font-size: 11px;
      color: #e5e7eb;
    }
    .track-routing,
    .track-footer,
    .device-card {
      border-radius: 14px;
      background: rgba(9, 13, 19, 0.68);
      border: 1px solid rgba(255,255,255,0.07);
    }
    .track-routing {
      padding: 10px 12px;
      display: grid;
      gap: 10px;
    }
    .manual-routing {
      border-color: rgba(245,166,35,0.18);
      background: rgba(245,166,35,0.06);
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .track-routing div,
    .footer-row {
      display: grid;
      gap: 4px;
    }
    .track-routing strong,
    .footer-row strong {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .track-routing span,
    .footer-row span {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }
    .device-stack {
      display: grid;
      gap: 10px;
      flex: 1 1 auto;
    }
    .device-card {
      padding: 12px;
    }
    .device-card.is-rack {
      border-color: rgba(245,166,35,0.22);
      background: linear-gradient(180deg, rgba(245,166,35,0.08), rgba(9,13,19,0.75));
    }
    .device-card.disabled {
      opacity: 0.65;
    }
    .device-head h3 {
      margin: 0 0 10px;
      font-size: 15px;
      line-height: 1.3;
    }
    .device-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .device-structure {
      margin-top: 10px;
    }
    .device-structure ul {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: grid;
      gap: 7px;
    }
    .device-structure li {
      padding: 8px 9px;
      border-radius: 10px;
      background: rgba(255,255,255,0.035);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .device-structure li span {
      display: block;
      font-size: 13px;
      line-height: 1.3;
    }
    .device-structure li small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 11px;
    }
    .track-footer {
      padding: 10px 12px;
    }
    .empty-state {
      min-height: 96px;
      display: grid;
      place-items: center;
      text-align: center;
      color: var(--muted);
      border-radius: 14px;
      border: 1px dashed rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.025);
      padding: 16px;
    }
    footer {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      color: var(--muted);
      font-size: 12px;
    }
    footer a {
      color: #7c8799;
      text-decoration: none;
    }
    footer a:hover {
      color: var(--accent);
    }
    @media (max-width: 900px) {
      .metrics {
        grid-template-columns: repeat(2, minmax(120px, 1fr));
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="masthead">
      <div>
        <p class="eyebrow">Ableton Session Mapper / Session Grid</p>
        <h1>${A(e.set.name||"Ableton Live Set")}</h1>
      </div>
      <div class="meta">
        <div>JSON ${A(e.version)}</div>
        <div>${e.set.tempo!==null?`${A(String(e.set.tempo))} BPM`:"Tempo unavailable"}</div>
        <div>${A(new Date(e.exportedAt).toLocaleString("fr-FR"))}</div>
      </div>
    </header>

    <section class="metrics" aria-label="Session summary">
      <article class="metric"><strong>${t.length}</strong><span>Total tracks shown</span></article>
      <article class="metric"><strong>${e.tracks.length}</strong><span>Main tracks in set order</span></article>
      <article class="metric"><strong>${n}</strong><span>Devices</span></article>
      <article class="metric"><strong>${a}</strong><span>Sends</span></article>
    </section>

    <section class="frame" aria-label="Ableton-like session grid">
      <div class="session-grid">
        ${r}
      </div>
    </section>

    <footer>
      <span>External HTML only. No Ableton WebView used.</span>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`}async function Er(){await ft({jsonPath:br,outputPath:vr,logPrefix:gt,rootDirectory:Xe})}async function ft(e){let t=e.logPrefix??gt,n=e.rootDirectory??Xe,a=l=>{let c=(0,j.relative)(n,l);return c&&!c.startsWith("..")?c:l};console.log(`${t} Read JSON started: ${a(e.jsonPath)}`);let r=await(0,U.readFile)(e.jsonPath,"utf8");console.log(`${t} Read JSON completed`);let i=JSON.parse(r),s=await yr(i,e.outputPath);console.log(`${t} Generate Session Grid started`);let o=Ir(i);return await(0,U.writeFile)(s.latestPath,o,"utf8"),await(0,U.writeFile)(s.archivePath,o,"utf8"),console.log(`${t} Write Session Grid latest completed: ${a(s.latestPath)}`),console.log(`${t} Write Session Grid archive completed: ${a(s.archivePath)}`),console.log(`${t} Generate Session Grid completed`),s}var Or=typeof __filename<"u"?(0,mt.pathToFileURL)(__filename).href:Tn.url,Nr=process.argv[1]!=null&&Or===(0,mt.pathToFileURL)(process.argv[1]).href;Nr&&Er().catch(e=>{let t=e instanceof Error?e.message:String(e);console.error(`${gt} Generation failed: ${t}`),process.exitCode=1});var X=require("node:fs/promises"),W=require("node:path"),jr=["session-map.html","session-map-session-grid.html","session-map-mermaid-flow.html","session-map-flow.mmd","session-map-flow.svg","session-map-flow.png","session-map-mermaid-git.html","session-map-git.mmd","session-map-git.svg","session-map-git.png","session-map-mermaid-kanban.html","session-map-kanban.mmd","session-map-kanban.svg","session-map-kanban.png"],_r=["sdk-capability-matrix.html","sdk-capability-matrix.json","sdk-capability-matrix.md"];function P(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function Lr(e){let t=new Date(e);return Number.isNaN(t.getTime())?"Unknown export date":new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"}).format(t)}async function Vr(e){try{return await(0,X.access)(e),!0}catch{return!1}}async function Fr(e){return await Vr(e)?{exists:!0,mtimeMs:(await(0,X.stat)(e)).mtimeMs}:{exists:!1,mtimeMs:null}}function Gr(e){return e.type.toLowerCase().includes("rack")||!!e.chainsSummary?.count||!!e.padsSummary?.count}function Hr(e){let t=[...e.tracks,...e.returnTracks,...e.masterTrack?[e.masterTrack]:[]],n=t.reduce((i,s)=>i+s.devices.length,0),a=t.reduce((i,s)=>i+s.devices.filter(o=>Gr(o)).length,0),r=t.reduce((i,s)=>i+s.sends.length,0);return[{value:String(e.tracks.length),label:"Tracks"},{value:String(e.returnTracks.length),label:"Returns"},{value:String(n),label:"Devices"},{value:String(a),label:"Racks"},{value:String(r),label:"Sends"}]}function Kr(e,t){return e.exists?e.mtimeMs!=null&&e.mtimeMs<t?"outdated":"current":"missing"}function zr(e){if(e.role==="render")return e.status==="outdated"?"Older manual render.":e.status==="missing"?"Optional manual render.":"Manual render available.";if(e.role==="data"&&e.fileName.startsWith("sdk-capability-matrix"))return e.status==="outdated"?"Separate Live diagnostic.":e.status==="missing"?"Not generated yet.":"Separate Live diagnostic.";if(e.status==="outdated")return"Older than latest session export.";if(e.status==="missing")return"Not generated yet."}function $(e,t,n,a,r){let i=n.get(e)??{exists:!1,mtimeMs:null},s=Kr(i,a),o={label:t,fileName:e,href:e,status:s,role:r},l=zr(o);return l&&(o.note=l),o}function ht(e,t){return`<span class="status-badge status-${t}">${P(e)}</span>`}function Br(e){if(e.primary.status==="missing")return{label:"Missing files",tone:"missing"};if(e.primary.status==="outdated")return{label:"Needs refresh",tone:"warn"};let t=(e.extras??[]).filter(a=>a.status==="outdated"),n=(e.extras??[]).filter(a=>a.status==="missing");return t.length>0?{label:"Current",tone:"ok",note:"Some older renders"}:n.length>0?{label:"Current",tone:"ok",note:"More exports available"}:{label:"Current",tone:"ok"}}function Dn(e){if(e.role==="render")switch(e.status){case"current":return"Current";case"outdated":return"Older render";default:return"Missing"}switch(e.status){case"current":return"Current";case"outdated":return"Older";default:return"Missing"}}function An(e){return e.status==="missing"?"missing":e.status==="outdated"?e.role==="render"?"neutral":"warn":e.role==="render"?"neutral":"ok"}function Jr(e){let t=Br(e),n=e.extras?.length??0;return`<article class="view-card ${P(e.accentClass)}">
    <div class="view-head">
      <div class="view-copy">
        <h2>${P(e.title)}</h2>
        <p>${P(e.description)}</p>
      </div>
      ${ht(t.label,t.tone)}
    </div>

    ${t.note?`<p class="status-note">${P(t.note)}</p>`:""}

    <div class="view-actions">
      <a class="open-button" href="${P(e.primary.href)}">${P(e.primary.label)}</a>
      ${n>0?`<details class="more-exports">
        <summary>More</summary>
        <div class="more-list">
          ${e.extras.map(a=>`<div class="more-row">
            <div class="more-copy">
              <strong>${P(a.label)}</strong>
              <small>${P(a.note??a.fileName)}</small>
            </div>
            <div class="more-actions">
              ${ht(Dn(a),An(a))}
              ${a.status==="missing"?`<span class="mini-button is-disabled">${P(a.label)}</span>`:`<a class="mini-button" href="${P(a.href)}">${P(a.label)}</a>`}
            </div>
          </div>`).join(`
`)}
        </div>
      </details>`:""}
    </div>

    ${e.footerNote?`<p class="view-foot">${P(e.footerNote)}</p>`:""}
  </article>`}function Pn(e){return`<div class="compact-row">
    <div class="compact-copy">
      <strong>${P(e.label)}</strong>
      <small>${P(e.note??e.fileName)}</small>
    </div>
    <div class="compact-actions">
      ${ht(Dn(e),An(e))}
      ${e.status==="missing"?`<span class="mini-button is-disabled">${P(e.label)}</span>`:`<a class="mini-button" href="${P(e.href)}">${P(e.label)}</a>`}
    </div>
  </div>`}function Ur(e){return Hr(e).map(t=>`<span class="metric-chip"><strong>${P(t.label)}</strong> ${P(t.value)}</span>`).join(`
`)}async function Wr(e){let t=await(0,X.readFile)(e.jsonPath,"utf8"),n=JSON.parse(t),r=(await(0,X.stat)(e.jsonPath)).mtimeMs,i=(0,W.dirname)(e.outputPath),s=(0,W.resolve)(e.rootDirectory,"exports"),o=(0,W.relative)(i,e.jsonPath)||(0,W.basename)(e.jsonPath),l=n.set.name?.trim()||"Ableton Live Set",c=[...jr,..._r,"session-map.json"],d=new Map;await Promise.all(c.map(async w=>{d.set(w,await Fr((0,W.resolve)(s,w)))}));let f=[{title:"Session Grid",description:"Live-like overview",accentClass:"accent-grid",primary:$("session-map-session-grid.html","Open",d,r,"primary")},{title:"HTML Report",description:"Detailed report",accentClass:"accent-report",primary:$("session-map.html","Open",d,r,"primary")},{title:"Git / Metro",description:"Track/device metro map",accentClass:"accent-git",primary:$("session-map-mermaid-git.html","Open",d,r,"primary"),extras:[$("session-map-git.svg","Open SVG",d,r,"render"),$("session-map-git.png","Open PNG",d,r,"render"),$("session-map-git.mmd","Open .mmd",d,r,"data")],footerNote:"Custom Metro is canonical."},{title:"Flow",description:"Technical tree",accentClass:"accent-flow",primary:$("session-map-mermaid-flow.html","Open",d,r,"primary"),extras:[$("session-map-flow.svg","Open SVG",d,r,"render"),$("session-map-flow.png","Open PNG",d,r,"render"),$("session-map-flow.mmd","Open .mmd",d,r,"data")]},{title:"Kanban",description:"External column view",accentClass:"accent-kanban",primary:$("session-map-mermaid-kanban.html","Open",d,r,"primary"),extras:[$("session-map-kanban.svg","Open SVG",d,r,"render"),$("session-map-kanban.png","Open PNG",d,r,"render"),$("session-map-kanban.mmd","Open .mmd",d,r,"data")]}],g=[$("session-map.json","session-map.json",d,r,"data"),{label:"Exports folder",fileName:"exports/",href:`file://${s}`,status:"current",role:"data",note:"Open latest files and archives."},$("session-map-flow.mmd","Flow .mmd",d,r,"data"),$("session-map-git.mmd","Git / Metro .mmd",d,r,"data"),$("session-map-kanban.mmd","Kanban .mmd",d,r,"data")],k=[$("sdk-capability-matrix.html","Capability Matrix HTML",d,r,"data"),$("sdk-capability-matrix.json","Capability Matrix JSON",d,r,"data"),$("sdk-capability-matrix.md","Capability Matrix Markdown",d,r,"data")],u=f.map(w=>w.primary),b=f.flatMap(w=>w.extras??[]),x=u.some(w=>w.status==="outdated"),h=b.some(w=>w.role==="render"&&w.status==="outdated"),y=u.some(w=>w.status==="missing"),T=k.some(w=>w.status==="outdated"),O="http://localhost:5177/exports/session-map-diagrams.html";return`<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ableton Session Mapper \u2014 External Launcher</title>
  <style>
    :root {
      --live-bg: #b7b7b7;
      --live-panel: #cbcbcb;
      --live-panel-light: #d8d8d8;
      --live-border: #8f8f8f;
      --live-border-soft: rgba(0,0,0,0.12);
      --live-grid: rgba(0,0,0,0.035);
      --live-text: #202020;
      --live-muted: #5e5e5e;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
      --live-cyan: #3fc2d7;
      --live-magenta: #cb67ba;
      --ok: #407a40;
      --warn: #b67814;
      --neutral: #5a6d7d;
      --missing: #7a655a;
      --matrix: #49a97f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--live-text);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.16), transparent 22%),
        repeating-linear-gradient(0deg, var(--live-grid) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(90deg, var(--live-grid) 0 1px, transparent 1px 24px),
        var(--live-bg);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
    }
    .shell {
      --compact-gap: 8px;
      --compact-pad: 10px;
      --button-height: 26px;
      --card-min-height: 124px;
      max-width: 1440px;
      margin: 0 auto;
      padding: 12px;
      display: grid;
      gap: var(--compact-gap);
    }
    .panel {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .header {
      display: grid;
      gap: 8px;
      padding: 10px 12px;
    }
    .header-top {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
    }
    .eyebrow {
      margin: 0 0 2px;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--live-orange-dark);
    }
    h1 {
      margin: 0;
      font-size: 19px;
      line-height: 1.05;
    }
    .header-line {
      margin: 3px 0 0;
      color: var(--live-muted);
      font-size: 11px;
      line-height: 1.35;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 14px;
      justify-content: flex-end;
      font-size: 11px;
      color: var(--live-muted);
    }
    .meta strong { color: var(--live-text); font-weight: 700; }
    .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      border-top: 1px solid var(--live-border-soft);
      padding-top: 8px;
    }
    .metric-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 24px;
      padding: 0 8px;
      border: 1px solid var(--live-border-soft);
      border-radius: 999px;
      background: rgba(255,255,255,0.14);
      font-size: 11px;
      color: var(--live-text);
    }
    .metric-chip strong {
      font-size: 10px;
      line-height: 1;
      color: var(--live-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .note-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      color: var(--live-muted);
      font-size: 10px;
    }
    .note-chip {
      padding: 4px 7px;
      border: 1px solid var(--live-border-soft);
      border-radius: 999px;
      background: rgba(255,255,255,0.15);
    }
    .primary-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: var(--compact-gap);
    }
    .view-card {
      min-height: var(--card-min-height);
      padding: 10px;
      display: grid;
      gap: 6px;
      grid-template-rows: auto auto 1fr auto;
      background: var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-left-width: 4px;
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
    }
    .accent-grid { border-left-color: #8477ff; }
    .accent-report { border-left-color: var(--live-orange); }
    .accent-flow { border-left-color: #6ba7ff; }
    .accent-git { border-left-color: var(--live-cyan); }
    .accent-kanban { border-left-color: var(--live-magenta); }
    .view-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: start;
    }
    .view-copy h2 {
      margin: 0;
      font-size: 14px;
      line-height: 1.15;
    }
    .view-copy p {
      margin: 2px 0 0;
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.25;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      min-height: 20px;
      padding: 0 6px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.12);
      font-size: 9px;
      line-height: 1;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
      background: rgba(255,255,255,0.16);
    }
    .status-ok { color: #1f4d1f; background: rgba(76,141,76,0.18); }
    .status-warn { color: #8a5600; background: rgba(198,134,25,0.18); }
    .status-neutral { color: #35556d; background: rgba(99,144,176,0.16); }
    .status-missing { color: #6f5645; background: rgba(139,111,95,0.18); }
    .status-note {
      margin: 0;
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.2;
      min-height: 12px;
    }
    .view-actions {
      display: grid;
      gap: 5px;
      align-items: start;
      align-self: end;
    }
    .open-button,
    .mini-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: var(--button-height);
      padding: 0 9px;
      border-radius: 4px;
      border: 1px solid #8d8d8d;
      background: linear-gradient(180deg, #eeeeee, #cfcfcf);
      color: #1a1a1a;
      text-decoration: none;
      font-size: 10px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.35);
    }
    .open-button {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-dark));
      border-color: #9a6200;
      color: #181204;
      width: 100%;
    }
    .mini-button.is-disabled {
      opacity: 0.5;
      color: #6a6a6a;
      cursor: default;
    }
    .more-exports {
      border: 1px solid var(--live-border-soft);
      border-radius: 4px;
      background: rgba(255,255,255,0.12);
      overflow: hidden;
    }
    .more-exports summary,
    .fold summary {
      cursor: pointer;
      list-style: none;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 700;
      color: var(--live-text);
    }
    .more-exports summary::-webkit-details-marker,
    .fold summary::-webkit-details-marker {
      display: none;
    }
    .more-exports summary::after,
    .fold summary::after {
      content: "\u25B8";
      float: right;
      color: var(--live-muted);
    }
    .more-exports[open] summary::after,
    .fold[open] summary::after {
      content: "\u25BE";
    }
    .more-list,
    .fold-body {
      padding: 0 7px 7px;
      display: grid;
      gap: 5px;
    }
    .more-row,
    .compact-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 6px;
      align-items: center;
      padding: 6px 7px;
      border-radius: 4px;
      border: 1px solid var(--live-border-soft);
      background: rgba(255,255,255,0.12);
    }
    .more-copy,
    .compact-copy {
      display: grid;
      gap: 1px;
      min-width: 0;
    }
    .more-copy strong,
    .compact-copy strong {
      font-size: 10px;
      line-height: 1.2;
    }
    .more-copy small,
    .compact-copy small {
      color: var(--live-muted);
      font-size: 9px;
      line-height: 1.3;
      word-break: break-word;
    }
    .more-actions,
    .compact-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .view-foot {
      margin: 0;
      color: var(--live-muted);
      font-size: 9px;
      line-height: 1.25;
    }
    .fold {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .fold p {
      margin: 0;
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.35;
    }
    .commands {
      display: grid;
      gap: 5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
    }
    .command {
      padding: 6px 7px;
      border-radius: 4px;
      border: 1px solid var(--live-border-soft);
      background: rgba(255,255,255,0.12);
      color: var(--live-text);
    }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      padding: 0 4px;
      color: var(--live-muted);
      font-size: 10px;
    }
    .footer a {
      color: inherit;
      text-decoration: none;
    }
    @media (max-width: 900px) {
      .header-top { grid-template-columns: 1fr; }
      .meta { justify-content: flex-start; }
      .primary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .primary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .more-row,
      .compact-row,
      .footer { grid-template-columns: 1fr; display: grid; }
      .more-actions,
      .compact-actions { justify-content: start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="panel header">
      <div class="header-top">
        <div>
          <p class="eyebrow">Session Mapper / External Launcher</p>
          <h1>Session Mapper</h1>
          <p class="header-line">Set <strong>${P(l)}</strong> \xB7 Export <strong>${P(Lr(n.exportedAt))}</strong> \xB7 Mode <strong>${P(n.scan?.mode??"unknown")}</strong></p>
        </div>
        <div class="meta">
          <span><strong>JSON</strong> ${P(o)}</span>
        </div>
      </div>

      <section class="metrics" aria-label="Session metrics">
        ${Ur(n)}
      </section>

      <div class="note-strip">
        <span class="note-chip">HTML views are current on export</span>
        <span class="note-chip">SVG/PNG are optional manual renders</span>
        ${x?'<span class="note-chip">Some primary views need refresh</span>':""}
        ${!x&&h?'<span class="note-chip">Some older renders</span>':""}
        ${y?'<span class="note-chip">Some files missing</span>':""}
      </div>

      <details class="fold">
        <summary>Workflow</summary>
        <div class="fold-body">
          <p>Export from Live, open a primary view, then use More only when you need SVG / PNG / .mmd.</p>
        </div>
      </details>
    </section>

    <section class="primary-grid" aria-label="Primary views">
      ${f.map(w=>Jr(w)).join(`
`)}
    </section>

    <details class="fold">
      <summary>Advanced exports</summary>
      <div class="fold-body">
        <p>Raw data, exports folder, Mermaid sources, and quick access to archived outputs.</p>
        ${g.map(w=>Pn(w)).join(`
`)}
      </div>
    </details>

    <details class="fold">
      <summary>Diagnostics</summary>
      <div class="fold-body">
        <p>SDK Capability Matrix is a separate Live diagnostic.</p>
        ${T?"<p>Current launcher views may be up to date even if the Capability Matrix is older.</p>":""}
        ${k.map(w=>Pn(w)).join(`
`)}
      </div>
    </details>

    <details class="fold">
      <summary>Commands</summary>
      <div class="fold-body">
        <p>Use these only when you want manual renders or localhost preview.</p>
        <div class="commands">
          <div class="command">npm run export:diagram:all</div>
          <div class="command">npm run serve:exports</div>
          <div class="command">npm run open:diagrams:http</div>
        </div>
        <p>Localhost preview: <a href="${O}">${O}</a></p>
      </div>
    </details>

    <footer class="footer">
      <span>Exports folder: ${P(s)}</span>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`}async function $n(e){let t=await Wr(e);return await(0,X.writeFile)(e.outputPath,t,"utf8"),e.outputPath}function q(e){return String(e).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function bt(e,t){return e.length<=t?e:`${e.slice(0,t-1)}\u2026`}function Xr(e){let t=(e.name||`Track ${e.index+1}`).split("|")[0]?.trim()||e.name||`Track ${e.index+1}`;return bt(t.replace(/\s+/g," ").trim(),24)}function qr(e){return bt((e.name||`Device ${e.index+1}`).replace(/_/g," ").replace(/\s+/g," ").trim(),18)}function vt(e){return e.type.toLowerCase().includes("rack")||!!e.chainsSummary?.count||!!e.padsSummary?.count}function Yr(e){let t=new Set,n=(e.name||`Return ${e.index+1}`).trim(),a=n.split("|")[0]?.trim()||n,r=o=>o.trim().toLowerCase().replace(/\s+/g," ");t.add(r(n)),t.add(r(a));let s=a.match(/^([A-Za-z])\s*[-|]/)?.[1];return s&&(t.add(s.toLowerCase()),t.add(r(`${s} send`)),t.add(r(`send ${s}`))),[...t].filter(Boolean)}function Zr(e){switch(e){case"midi":return"MIDI";case"audio":return"Audio";case"group":return"Group";case"return":return"Return";case"master":return"Main";default:return"Track"}}function Qr(e,t){switch(e){case"midi":return["#8a7dff","#b08cff","#73a9ff","#7d8fff"][t%4];case"audio":return["#66b4ff","#63d3cf","#6da2ff","#59c0ff"][t%4];case"return":return t%2===0?"#3fc2d7":"#5bc7d8";case"master":return"#f5a623";case"group":return"#b78cff";default:return"#9aa3b2"}}function ei(e){let t=(e.category??"").trim().toUpperCase();return t?bt(t,10):vt(e)?"RACK":null}function Rn(e){let t=[...e.tracks,...e.returnTracks,...e.masterTrack?[e.masterTrack]:[]],n=72,a=84,r=180,i=r+72,s=Math.max(1,...t.map(u=>u.devices.length)),l=i+220+Math.max(0,s-1)*110,c=l+68,d=c+120,f=Math.max(420,a+t.length*n+72),g=a+(t.length-1)*n,k=t.map((u,b)=>{let x=u.devices.filter(T=>vt(T)).length,h=a+b*n,y=`dev:${u.devices.length}${x>0?` \xB7 racks:${x}`:""}`;return{track:u,y:h,color:Qr(u.kind,b),kindLabel:Zr(u.kind),label:Xr(u),summary:y,rackCount:x}});return{sessionMap:e,rows:k,width:d,height:f,startY:a,rowHeight:n,labelWidth:r,lineStartX:i,lineEndX:l,sinkX:c,masterY:g}}function kt(e){let t=new Map,n=[],a=[];return e.rows.forEach(r=>{if(r.track.kind!=="return")return;let i=e.lineStartX+48;Yr(r.track).forEach(s=>{t.set(s,{y:r.y,x:i})})}),e.rows.forEach(r=>{let{track:i,y:s,color:o}=r,l=i.kind==="master",c=l?6:i.kind==="return"?4.5:4,d=l?9:6,f=e.lineEndX-e.lineStartX;a.push(`
      <g class="metro-row metro-row-${q(i.kind)}">
        <text x="28" y="${s-8}" class="track-name" fill="#f3f5f8">${q(r.label)}</text>
        <text x="28" y="${s+14}" class="track-meta" fill="#95a1b3">${q(`${r.kindLabel} \xB7 ${r.summary}`)}</text>
        <line x1="${e.lineStartX}" y1="${s}" x2="${e.lineEndX}" y2="${s}" stroke="${o}" stroke-width="${c}" stroke-linecap="round" />
        <circle cx="${e.lineStartX}" cy="${s}" r="${l?5:4}" fill="${o}" />
    `);let g=e.lineStartX+54,k=i.devices.length>0?Math.min(110,f/(i.devices.length+2)):110;if(i.devices.forEach((u,b)=>{let x=e.lineStartX+140+b*k,h=vt(u)?"#f2c26a":"#f5f7fa",y=ei(u);a.push(`
        <g class="metro-stop metro-device">
          <circle cx="${x}" cy="${s}" r="8" fill="#0f1318" stroke="${h}" stroke-width="2.1" />
          <text x="${x}" y="${s-14}" class="stop-caption" fill="#dbe3ed">${q(qr(u))}</text>
          ${y?`<text x="${x}" y="${s+24}" class="device-badge" fill="${q(h)}">${q(y)}</text>`:""}
        </g>
      `)}),a.push(`
        <circle cx="${e.lineEndX}" cy="${s}" r="${d}" fill="${o}" />
      </g>
    `),l)a.push(`
        <line x1="${e.lineEndX}" y1="${s}" x2="${e.sinkX}" y2="${s}" stroke="${o}" stroke-width="6" stroke-linecap="round" />
        <circle cx="${e.sinkX}" cy="${s}" r="11" fill="#0f1318" stroke="${o}" stroke-width="4" />
        <text x="${e.sinkX-6}" y="${s-18}" class="stop-caption stop-caption-main" fill="#ffd18c">Main sink</text>
      `);else{let u=i.kind==="return"?2.2:2;a.push(`
        <path d="M ${e.lineEndX} ${s} L ${e.sinkX} ${s} L ${e.sinkX} ${e.masterY}" fill="none" stroke="${o}" stroke-width="${u}" stroke-linecap="round" stroke-opacity="${i.kind==="return"?"0.9":"0.5"}" />
      `)}if(i.kind!=="return"&&i.kind!=="master"){let u=g;i.sends.filter(b=>typeof b.value=="number"&&b.value>0).forEach((b,x)=>{let h=b.name.trim().toLowerCase().replace(/\s+/g," "),y=t.get(h)??t.get(h.split(" ")[0]??"")??null;if(!y)return;let T=u+120+x*22,O=(s+y.y)/2;n.push(`
            <path d="M ${u} ${s} Q ${T} ${O}, ${y.x} ${y.y}" fill="none" stroke="#7de2f0" stroke-width="1.5" stroke-dasharray="6 5" stroke-linecap="round" stroke-opacity="0.82" />
          `)})}}),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${e.width} ${e.height}" width="${e.width}" height="${e.height}" role="img" aria-label="Git Metro custom session map">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <style>
        .track-name { font: 700 15px "Avenir Next", "Segoe UI", sans-serif; }
        .track-meta, .stop-caption, .send-label { font: 500 11px "Avenir Next", "Segoe UI", sans-serif; }
        .stop-caption-main { font: 700 12px "Avenir Next", "Segoe UI", sans-serif; }
        .device-badge { font: 700 10px "Avenir Next", "Segoe UI", sans-serif; letter-spacing: 0.08em; text-anchor: middle; }
        .stop-caption, .send-label { text-anchor: middle; }
      </style>
    </defs>
    <rect x="0" y="0" width="${e.width}" height="${e.height}" fill="#0f1318" rx="8" />
    <line x1="${e.sinkX}" y1="${e.startY}" x2="${e.sinkX}" y2="${e.masterY}" stroke="#f5a623" stroke-width="2.5" stroke-opacity="0.35" filter="url(#glow)" />
    ${n.join(`
`)}
    ${a.join(`
`)}
  </svg>`}function Cn(e,t){let n=kt(e);return`<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ableton Session Mapper \u2014 Git / Metro</title>
  <style>
    :root {
      color-scheme: dark;
      --live-bg: #b7b7b7;
      --live-panel: #cbcbcb;
      --live-border: #8f8f8f;
      --live-text: #202020;
      --live-muted: #5e5e5e;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.16), transparent 22%),
        repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 24px),
        var(--live-bg);
      color: var(--live-text);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
    }
    .shell { max-width: 1520px; margin: 0 auto; padding: 18px; }
    .panel {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.24);
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      margin-bottom: 12px;
      padding: 14px;
    }
    .eyebrow {
      margin: 0 0 4px;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--live-orange-dark);
    }
    h1 { margin: 0; font-size: 22px; line-height: 1.1; }
    .subline {
      margin: 6px 0 0;
      color: var(--live-muted);
      font-size: 13px;
      line-height: 1.45;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    a {
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1px solid #8d8d8d;
      background: linear-gradient(180deg, #ededed, #cfcfcf);
      color: #1d1d1d;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .links a:first-child {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-dark));
      border-color: #9a6200;
      color: #111;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .legend, .support { padding: 12px 14px; }
    .legend h2, .support strong {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .legend ul {
      margin: 0;
      padding-left: 18px;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.5;
    }
    .support p {
      margin: 0;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .diagram {
      overflow: auto;
      border: 1px solid #6d6d6d;
      border-radius: 6px;
      background: #0f1318;
      padding: 14px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .diagram svg {
      width: max-content;
      min-width: 100%;
      height: auto;
      display: block;
    }
    .caption {
      margin-top: 10px;
      color: var(--live-muted);
      font-size: 11px;
    }
    footer { margin-top: 10px; text-align: right; }
    footer a {
      font-size: 11px;
      color: var(--live-muted);
      background: transparent;
      border: 0;
      padding: 0;
      min-height: unset;
      box-shadow: none;
    }
    @media (max-width: 980px) {
      .toolbar, .meta-grid { grid-template-columns: 1fr; }
      .links { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="toolbar panel">
      <div>
        <p class="eyebrow">Session Mapper / Custom Metro</p>
        <h1>Git / Metro</h1>
        <p class="subline">Custom metro-style track/device map.</p>
      </div>
      <div class="links">
        <a href="${q(t.svgFileName)}">Open Custom Metro SVG</a>
        <a href="${q(t.pngFileName)}">Open Custom Metro PNG</a>
        <a href="${q(t.mmdFileName)}">Open Mermaid gitGraph source</a>
      </div>
    </div>

    <section class="meta-grid">
      <article class="legend panel">
        <h2>Reading guide</h2>
        <ul>
          <li>Regular tracks stay above returns, with Main as the final line at the bottom.</li>
          <li>Returns also flow toward Main.</li>
          <li>Git / Metro focuses on tracks and devices. Detailed routing/sends are available in Outputs.</li>
        </ul>
      </article>
      <article class="support panel">
        <strong>Canonical Git / Metro view</strong>
        <p>This custom Metro view is generated from session-map.json.</p>
        <p>The Mermaid .mmd file remains available as a secondary gitGraph export with Mermaid layout limitations.</p>
      </article>
    </section>

    <div class="diagram">
${n}
    </div>
    <p class="caption">This custom Metro view is generated from session-map.json. The Mermaid .mmd file remains available as a secondary gitGraph export with Mermaid layout limitations.</p>
    <footer>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
</body>
</html>`}var ee=require("node:fs/promises"),_=require("node:path"),$e=require("node:url"),Fn={},_n=!1,ti=typeof __dirname<"u"?__dirname:(0,_.dirname)((0,$e.fileURLToPath)(Fn.url)),qe=(0,_.resolve)(ti,".."),Ye=e=>{let t=process.argv.indexOf(e);return t>=0?process.argv[t+1]:void 0},De=Ye("--profile")??"flow",xt=Ye("--file-suffix")??"",ni=(0,_.resolve)(Ye("--json")??(0,_.resolve)(qe,"exports/session-map.json")),ai=(0,_.resolve)(Ye("--output")??(0,_.resolve)(qe,De==="git"?"exports/session-map-git.mmd":De==="kanban"?"exports/session-map-kanban.mmd":"exports/session-map.mmd")),Ln=xt?`[mermaid:${xt}]`:De==="flow"?"[mermaid]":`[mermaid:${De}]`;function Pe(e){return String(e).padStart(2,"0")}function In(e,t){let n=new Date(e),a=Number.isNaN(n.getTime())?new Date:n,r=[a.getFullYear(),Pe(a.getMonth()+1),Pe(a.getDate())].join("-"),i=[Pe(a.getHours()),Pe(a.getMinutes())];return t&&i.push(Pe(a.getSeconds())),`${r}_${i.join("-")}`}function ri(e){return(e??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[<>:"/\\|?*\x00-\x1f]/g," ").replace(/[^A-Za-z0-9._ -]/g," ").trim().replace(/[ .]+/g,"-").replace(/-+/g,"-").replace(/^[-_.]+|[-_.]+$/g,"")}async function En(e){try{return await(0,ee.access)(e),!0}catch{return!1}}function ii(e){let t=ri(e.set.name);return t?`${t}_Session-Map`:"Ableton-Session-Map"}function Vn(e,t=96){return e.length<=t?e:`${e.slice(0,t-1)}\u2026`}function ge(e,t){return Vn(e.trim(),t)}function si(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function fe(e){return e.replaceAll("\\","\\\\").replaceAll('"','\\"')}function Q(...e){return Vn(e.filter(t=>!!(t&&t.trim().length>0)).join("<br/>").replace(/\r?\n/g,"<br/>"))}function oi(e){switch(e){case"audio":return"Audio";case"midi":return"MIDI";case"group":return"Group";case"return":return"Return";case"master":return"Master";default:return"Track"}}function li(e){if(_n)switch(e){case"midi":return"\u{1F3B9}";case"audio":return"\u{1F3A7}";case"return":return"\u21A9";case"master":return"\u2605";case"group":return"\u25A4";default:return"\u2022"}switch(e){case"midi":return"MIDI";case"audio":return"AUD";case"return":return"RET";case"master":return"MAIN";case"group":return"GRP";default:return"TRK"}}function ci(e){let t=Re(e);return _n?t?"\u25A3":"\u2022":t?"RACK":"DEV"}function di(e,t){let n=e.name?.trim()||`Track ${t+1}`,a=n.split("|")[0]?.trim()||n;return ge(a,18)}function ui(e){return e.split("<br/>").map(t=>si(t).replaceAll("[","(").replaceAll("]",")")).join("<br/>")}function pi(e){switch(e){case"audio":return"Audio Track";case"midi":return"MIDI Track";case"group":return"Group Track";case"return":return"Return Track";case"master":return"Master Track";default:return"Track"}}function Re(e){return e.type.toLowerCase().includes("rack")||!!e.chainsSummary?.count||!!e.padsSummary?.count}function G(e,t,n){e.push(`  ${t}["${ui(n)}"]`)}function Y(e,t,n){e.push(`  ${t} --> ${n}`)}function mi(e){if(!e.sends.length)return null;let t=e.sends.slice(0,2).map(a=>a.name.trim()).filter(Boolean);if(t.length===0)return`sends: ${e.sends.length}`;let n=e.sends.length>t.length?" +":"";return`sends: ${t.join(", ")}${n}`}function On(e,t,n){let a=t.name?.trim()||`${e} ${String(n+1).padStart(2,"0")}`,r=t.receivingNote??t.note,i=[r!==null?`note: ${r}`:null,t.deviceCount!==null?`devices: ${t.deviceCount}`:null].filter(Boolean);return Q(a,i.join(" \xB7 "))}function gi(e){let t=["flowchart TD"],n=new Map,a=new Map,r=(s,o)=>{let l=n.get(o)??[];l.push(s),n.set(o,l)};G(t,"set",Q(e.set.name?`${e.set.name}`:"Ableton Live Set",e.set.tempo!==null?`${e.set.tempo} BPM`:null,`JSON ${e.version}`)),r("set","set"),G(t,"section_tracks",Q("Tracks",`${e.tracks.length} normal tracks`)),G(t,"section_returns",Q("Return Tracks",`${e.returnTracks.length} return tracks`)),G(t,"section_master",Q("Master Track",e.masterTrack?"1 master track":"no master track")),Y(t,"set","section_tracks"),Y(t,"set","section_returns"),Y(t,"set","section_master"),r("section_tracks","track"),r("section_returns","return"),r("section_master","master");let i=(s,o,l,c)=>{G(t,o,Q(s.name||`Track ${s.index+1}`,pi(s.kind),`devices: ${s.devices.length}`,mi(s))),Y(t,l,o),r(o,c),a.set(s.name,o),s.devices.forEach((d,f)=>{let g=`${o}_device_${f}`,k=Re(d),u=d.chainsSummary?.count??0,b=d.padsSummary?.count??0,x=[k&&u>0?`chains: ${u}`:null,k&&b>0?`pads: ${b}`:null].filter(Boolean);G(t,g,Q(d.name||`Device ${d.index+1}`,d.type||"Device",x.join(" \xB7 "))),Y(t,o,g),r(g,k?"rack":"device");let h=d.chainsSummary?.items??[];if(h.forEach((T,O)=>{let w=`${g}_chain_${O}`;G(t,w,On("Chain",T,O)),Y(t,g,w),r(w,"chain")}),(d.chainsSummary?.count??0)>h.length){let T=`${g}_chains_more`;G(t,T,Q("Additional chains",`+${d.chainsSummary.count-h.length} more`)),Y(t,g,T),r(T,"chain")}let y=d.padsSummary?.items??[];if(y.forEach((T,O)=>{let w=`${g}_pad_${O}`;G(t,w,On("Pad",T,O)),Y(t,g,w),r(w,"chain")}),(d.padsSummary?.count??0)>y.length){let T=`${g}_pads_more`;G(t,T,Q("Additional pads",`+${d.padsSummary.count-y.length} more`)),Y(t,g,T),r(T,"chain")}})};e.tracks.forEach((s,o)=>{i(s,`track_${o}`,"section_tracks","track")}),e.returnTracks.forEach((s,o)=>{i(s,`return_${o}`,"section_returns","return")}),e.masterTrack&&i(e.masterTrack,"master_0","section_master","master"),(e.manualRouting?.connections??[]).forEach(s=>{let o=a.get(s.from),l=a.get(s.to);!o||!l||t.push(`  ${o} -. "${fe(s.label||s.type||"manual")}" .-> ${l}`)}),t.push(""),t.push("classDef set fill:#111,stroke:#f5a623,color:#fff"),t.push("classDef track fill:#1b1b1b,stroke:#666,color:#fff"),t.push("classDef return fill:#1b1b1b,stroke:#4aa3ff,color:#fff"),t.push("classDef master fill:#1b1b1b,stroke:#ff4a4a,color:#fff"),t.push("classDef device fill:#242424,stroke:#999,color:#fff"),t.push("classDef rack fill:#2b2114,stroke:#f5a623,color:#fff"),t.push("classDef chain fill:#141f2b,stroke:#4aa3ff,color:#fff"),t.push("");for(let[s,o]of n.entries())o.length>0&&t.push(`class ${o.join(",")} ${s};`);return t.push(""),`${t.join(`
`)}
`}function fi(e){let t=(e.name||`Track ${e.index+1}`).split("|")[0]?.trim()||e.name||`Track ${e.index+1}`;return Ae(t,"track",22)}function Nn(e){let t=(e.name||`Track ${e.index+1}`).split("|")[0]?.trim()||e.name||`Track ${e.index+1}`;return Ae(t,"track",22)}function hi(e){return e.replace(/_/g," ").replace(/\bBasic Stereo Chorus Jazz Amp\b/gi,"Basic Chorus Amp").replace(/\bCabinet Mic Mixer\b/gi,"Cabinet Mixer").replace(/\bProducer Pal\b/gi,"Producer Pal").replace(/\bProducer_Pal\b/gi,"Producer Pal").replace(/\bVocal Harmony\b/gi,"Vocal Harm").replace(/\bTransform Se\b/gi,"Transform").replace(/\s+/g," ").trim()}function Ae(e,t,n){let a=(t==="device"?hi(e):e).replace(/\s+/g," ").trim();return ge(a,n)}function bi(e){return Ae(e.name||`Device ${e.index+1}`,"device",18)}function jn(e,t,n,a){let r=t.replaceAll("[","(").replaceAll("]",")").trim(),i=e.get(r)??0;return e.set(r,i+1),i===0?r:`${n}${a+1} \u2014 ${r}`}function vi(e){let t=e.devices.filter(n=>Re(n)).length;return[`dev:${e.devices.length}`,e.sends.length>0?`sends:${e.sends.length}`:null,t>0?`racks:${t}`:null].filter(n=>!!n)}function ki(e){let t=e.chainsSummary?.count??0,n=e.padsSummary?.count??0;return[t>0?`chains:${t}`:null,n>0?`pads:${n}`:null].filter(a=>!!a)}function Z(e,t){e.push(`  commit id:"${fe(t)}"`)}function xi(e){let t=["gitGraph"],n=new Map;Z(t,Ae(e.set.name||"Live Set","track",18));let a=(r,i,s)=>{t.push(`  branch "${r}" order:${s}`),t.push(`  checkout "${r}"`),Z(t,fi(i));for(let o of vi(i))Z(t,o);i.devices.length===0&&Z(t,"no-dev");for(let o of i.devices){Z(t,bi(o));for(let l of ki(o))Z(t,l)}t.push("  checkout main")};return e.tracks.forEach((r,i)=>{a(fe(jn(n,Nn(r),"T",i)),r,i+1)}),e.returnTracks.forEach((r,i)=>{a(fe(jn(n,Nn(r),"R",i)),r,e.tracks.length+i+1)}),e.masterTrack?(Z(t,Ae(e.masterTrack.name||"Main","track",20)),Z(t,`dev:${e.masterTrack.devices.length}`)):Z(t,"Main"),t.push(""),`${t.join(`
`)}
`}function yi(e){let t=e.devices.filter(n=>Re(n)).length;return ge([`${li(e.kind)} ${ge(e.name||`Track ${e.index+1}`,24)}`,oi(e.kind),`dev:${e.devices.length}`,`sends:${e.sends.length}`,t>0?`racks:${t}`:null].filter(Boolean).join(" \xB7 "),80)}function wi(e){let t=e.chainsSummary?.count??0,n=e.padsSummary?.count??0;return ge([`${ci(e)} ${ge(e.name||`Device ${e.index+1}`,22)}`,Re(e)?"Rack":"Device",t>0?`chains:${t}`:null,n>0?`pads:${n}`:null].filter(Boolean).join(" \xB7 "),72)}function Si(e){let t=["kanban"],n=[...e.tracks,...e.returnTracks,...e.masterTrack?[e.masterTrack]:[]];for(let[a,r]of n.entries()){let i=di(r,a).replaceAll("[","(").replaceAll("]",")");t.push(`  ${i}`),t.push(`    [${fe(yi(r)).replaceAll("[","(").replaceAll("]",")")}]`);for(let s of r.devices)t.push(`    [${fe(wi(s)).replaceAll("[","(").replaceAll("]",")")}]`)}return t.push(""),`${t.join(`
`)}
`}function Mi(e,t){switch(t){case"git":return xi(e);case"kanban":return Si(e);default:return gi(e)}}async function yt(e){let t=e.logPrefix??(e.fileSuffix?`[mermaid:${e.fileSuffix}]`:e.profile==="flow"?"[mermaid]":`[mermaid:${e.profile}]`),n=e.rootDirectory??qe,a=b=>{let x=(0,_.relative)(n,b);return x&&!x.startsWith("..")?x:b};console.log(`${t} Read JSON started: ${a(e.jsonPath)}`);let r=await(0,ee.readFile)(e.jsonPath,"utf8");console.log(`${t} Read JSON completed`);let i=JSON.parse(r);console.log(`${t} Generate Mermaid started`);let s=Mi(i,e.profile),o=(0,_.dirname)(e.outputPath);await(0,ee.mkdir)(o,{recursive:!0});let l=ii(i),c=e.fileSuffix?`_${e.fileSuffix}`:"",d=In(i.exportedAt,!1),f=In(i.exportedAt,!0),g=[`${l}_${d}${c}`,`${l}_${f}${c}`],k=null;for(let b of g){let x=(0,_.join)(o,`${b}.mmd`);if(!await En(x)){k=x;break}}if(!k){let b=2;for(;b<1e4;){let x=(0,_.join)(o,`${l}_${f}${c}-${b}.mmd`);if(!await En(x)){k=x;break}b+=1}}if(!k)throw new Error("Unable to reserve a unique Mermaid archive filename.");let u={latestPath:e.outputPath,archivePath:k};return await(0,ee.writeFile)(u.latestPath,s,"utf8"),await(0,ee.writeFile)(u.archivePath,s,"utf8"),console.log(`${t} Write Mermaid latest completed: ${a(u.latestPath)}`),console.log(`${t} Write Mermaid archive completed: ${a(u.archivePath)}`),console.log(`${t} Generate Mermaid completed`),u}async function Ti(){await yt({jsonPath:ni,outputPath:ai,profile:De,fileSuffix:xt,logPrefix:Ln,rootDirectory:qe})}var Pi=typeof __filename<"u"?(0,$e.pathToFileURL)(__filename).href:Fn.url,Di=process.argv[1]!=null&&Pi===(0,$e.pathToFileURL)(process.argv[1]).href;Di&&Ti().catch(e=>{let t=e instanceof Error?e.message:String(e);console.error(`${Ln} Generation failed: ${t}`),process.exitCode=1});var ce=require("node:fs/promises"),L=require("node:path"),Ie=require("node:url"),Kn={},Ai=typeof __dirname<"u"?__dirname:(0,L.dirname)((0,Ie.fileURLToPath)(Kn.url)),Ce=(0,L.resolve)(Ai,".."),wt=e=>{let t=process.argv.indexOf(e);return t>=0?process.argv[t+1]:void 0},be=wt("--profile")??"flow",$i=(0,L.resolve)(wt("--input")??(0,L.resolve)(Ce,be==="git"?"exports/session-map-git.mmd":be==="kanban"?"exports/session-map-kanban.mmd":"exports/session-map-flow.mmd")),Ri=(0,L.resolve)(wt("--output")??(0,L.resolve)(Ce,be==="git"?"exports/session-map-mermaid-git.html":be==="kanban"?"exports/session-map-mermaid-kanban.html":"exports/session-map-mermaid-flow.html")),Hn=`[mermaid-html:${be}]`;function he(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function Gn(e){return JSON.stringify(e).replaceAll("<","\\u003c").replaceAll(">","\\u003e").replaceAll("&","\\u0026").replaceAll("\u2028","\\u2028").replaceAll("\u2029","\\u2029")}function Ci(e){switch(e){case"git":return"Git / Metro";case"kanban":return"Kanban";default:return"Flow"}}function Ii(e){switch(e){case"git":return"Metro-style track/device map generated from the latest session-map.json.";case"kanban":return"Session-style kanban generated from the latest session-map.json.";default:return"Technical flow generated from the latest session-map.json."}}function Ei(e){switch(e){case"git":return"Reading guide";case"kanban":return"Reading guide";default:return"Reading guide"}}function Oi(e){switch(e){case"git":return["Git / Metro is a stylized track/device map, not an exact audio routing graph.","Each branch acts like a metro line for one track or return.","Devices appear as stations along the line, with short summary stops like sends or racks when useful."];case"kanban":return["Columns follow the exact Session View track order.","Devices stay under their owning track.","Returns come after regular tracks, then Main."];default:return["Tracks, devices and rack summaries are shown as a technical tree.","Chains and pads stay summarized to preserve the ultra-safe export."]}}function Ni(e){let{profile:t,mermaidSource:n,mermaidRuntime:a,inputFileName:r}=e,i=Gn(n),s=Ci(t),o=Gn(`
${a}
`),l=Oi(t).map(c=>`<li>${he(c)}</li>`).join("");return`<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ableton Session Mapper \u2014 ${he(s)}</title>
  <style>
    :root {
      color-scheme: dark;
      --live-bg: #b7b7b7;
      --live-panel: #cbcbcb;
      --live-panel-light: #d8d8d8;
      --live-panel-dark: #b4b4b4;
      --live-border: #8f8f8f;
      --live-text: #202020;
      --live-muted: #5f5f5f;
      --live-orange: #f5a623;
      --live-orange-dark: #d88900;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.18), transparent 24%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 24px),
        repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 24px),
        var(--live-bg);
      color: var(--live-text);
      font-family: "Avenir Next", "SF Pro Text", "Segoe UI", sans-serif;
    }
    .shell {
      max-width: 1520px;
      margin: 0 auto;
      padding: 18px;
    }
    .panel {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      margin-bottom: 12px;
      padding: 14px;
    }
    .eyebrow {
      margin: 0 0 4px;
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--live-orange-dark);
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.1;
    }
    .subline {
      margin: 6px 0 0;
      color: var(--live-muted);
      font-size: 13px;
      line-height: 1.45;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }
    .button {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1px solid #8d8d8d;
      background: linear-gradient(180deg, #ededed, #cfcfcf);
      color: #1d1d1d;
      text-decoration: none;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
    }
    .button.is-accent {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-dark));
      border-color: #9a6200;
      color: #111;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .legend {
      padding: 12px 14px;
    }
    .legend h2 {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .legend ul {
      margin: 0;
      padding-left: 18px;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.5;
    }
    .support {
      padding: 12px 14px;
      display: grid;
      gap: 6px;
      align-content: start;
    }
    .support strong {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .support p {
      margin: 0;
      color: var(--live-muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .diagram-shell {
      overflow: auto;
      padding: 14px;
      background: #0f1318;
      border: 1px solid #6d6d6d;
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    }
    #diagram {
      min-width: max-content;
    }
    .caption {
      margin: 10px 0 0;
      font-size: 11px;
      color: var(--live-muted);
    }
    .footer {
      margin-top: 10px;
      font-size: 11px;
      color: var(--live-muted);
      text-align: right;
    }
    .footer a { color: inherit; text-decoration: none; }
    @media (max-width: 980px) {
      .toolbar,
      .meta-grid {
        grid-template-columns: 1fr;
      }
      .actions { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="toolbar panel">
      <div>
        <p class="eyebrow">Session Mapper / Mermaid HTML</p>
        <h1>${he(s)}</h1>
        <p class="subline">${he(Ii(t))} SVG/PNG remain optional and can be refreshed manually.</p>
      </div>
      <div class="actions">
        <a class="button is-accent" href="${he(r??"session-map.mmd")}">Open .mmd</a>
      </div>
    </section>

    <section class="meta-grid">
      <article class="legend panel">
        <h2>${he(Ei(t))}</h2>
        <ul>${l}</ul>
      </article>
      <article class="support panel">
        <strong>Local preview</strong>
        <p>These Mermaid HTML pages stay external. No Ableton WebView is used.</p>
        <p>If your browser still blocks local scripts, run <strong>npm run serve:exports</strong> and reopen through localhost.</p>
      </article>
    </section>

    <section class="diagram-shell">
      <div id="diagram" class="mermaid"></div>
    </section>
    <p class="caption">Rendered externally from Mermaid source. HTML and .mmd are the main export-time views; SVG/PNG remain optional manual renders.</p>
    <p class="footer"><a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a></p>
  </div>
  <script>
    (() => {
      const script = document.createElement("script");
      script.text = ${o};
      document.head.appendChild(script);
    })();
  </script>
  <script>
    window.addEventListener("DOMContentLoaded", async () => {
      const source = ${i};
      if (!window.mermaid) {
        const target = document.getElementById("diagram");
        target.innerHTML = "<p style=\\"color:#f5a623;font:12px sans-serif;\\">Mermaid runtime unavailable in file:// mode. Run npm run serve:exports and open via http://localhost:5177/exports/\u2026</p>";
        return;
      }

      const mermaid = window.mermaid;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        securityLevel: "loose",
        flowchart: { useMaxWidth: false, htmlLabels: true },
        themeVariables: {
          background: "#0f1318",
          primaryTextColor: "#f5f7fa",
          secondaryTextColor: "#f5f7fa",
          lineColor: "#8ea2b8",
        }
      });

      const target = document.getElementById("diagram");
      target.textContent = source;
      try {
        await mermaid.run({ nodes: [target] });
      } catch (error) {
        target.innerHTML = "<p style=\\"color:#f5a623;font:12px sans-serif;\\">Mermaid render failed in this browser context. Run npm run serve:exports and open the localhost URL.</p>";
      }
    });
  </script>
</body>
</html>`}async function St(e){let t=e.logPrefix??`[mermaid-html:${e.profile}]`,n=e.rootDirectory??Ce,a=s=>{let o=(0,L.relative)(n,s);return o&&!o.startsWith("..")?o:s};console.log(`${t} Generate Mermaid HTML started`);let[r,i]=await Promise.all([(0,ce.readFile)(e.mermaidRuntimePath,"utf8"),(0,ce.readFile)(e.inputPath,"utf8")]);return await(0,ce.mkdir)((0,L.dirname)(e.outputPath),{recursive:!0}),await(0,ce.writeFile)(e.outputPath,Ni({profile:e.profile,mermaidSource:i,mermaidRuntime:r,inputFileName:(0,L.basename)(e.inputPath)}),"utf8"),console.log(`${t} Generate Mermaid HTML completed: ${a(e.outputPath)}`),e.outputPath}async function ji(){await St({profile:be,inputPath:$i,outputPath:Ri,mermaidRuntimePath:(0,L.resolve)(Ce,"node_modules/mermaid/dist/mermaid.min.js"),logPrefix:Hn,rootDirectory:Ce})}var _i=typeof __filename<"u"?(0,Ie.pathToFileURL)(__filename).href:Kn.url,Li=process.argv[1]!=null&&_i===(0,Ie.pathToFileURL)(process.argv[1]).href;Li&&ji().catch(e=>{let t=e instanceof Error?e.message:String(e);console.error(`${Hn} Generate Mermaid HTML failed: ${t}`),process.exitCode=1});var Bn=require("node:fs/promises"),F=require("node:path");async function p(e,t,n="Ableton property"){try{return await e()}catch(a){return console.warn(`[Ableton Session Mapper] Unable to read ${n}.`,a),t}}async function zn(e){for(let t of e)try{return await(0,Bn.access)(t),t}catch{continue}return null}async function Jn(e){let t=await p(()=>e.environment.storageDirectory,void 0,"environment.storageDirectory");if(!t)throw new Error("The extension storage directory is unavailable.");let n=(0,F.resolve)((0,F.dirname)(__dirname)),r=(process.env.SESSION_MAPPER_RUNTIME_MODE==="dev"?"dev":process.env.SESSION_MAPPER_RUNTIME_MODE==="installed"?"installed":null)??"installed",i=t,s=r==="dev"?t:null,o=(0,F.join)(t,"exports"),l=(0,F.join)(n,"assets"),c=(0,F.join)(t,"config"),d=await zn([(0,F.join)(l,"viewer-simple","styles.css"),(0,F.join)(i,"viewer-simple","styles.css")]);if(!d)throw new Error("viewer-simple/styles.css is unavailable in the current runtime.");let f=await zn([(0,F.join)(l,"vendor","mermaid.min.js"),(0,F.join)(i,"node_modules","mermaid","dist","mermaid.min.js")]);return{runtimeMode:r,extensionRoot:n,storageRoot:t,projectRoot:i,exportDirectory:o,assetsDirectory:l,configDirectory:c,viewerStylesPath:d,mermaidRuntimePath:f,workspaceRoot:s}}var Vi=(0,Xn.promisify)(Wn.execFile);async function I(e){let t=await Jn(e),n=t.exportDirectory;return{runtimeMode:t.runtimeMode,extensionRoot:t.extensionRoot,storageRoot:t.storageRoot,projectRoot:t.projectRoot,exportDirectory:n,assetsDirectory:t.assetsDirectory,configDirectory:t.configDirectory,viewerStylesPath:t.viewerStylesPath,mermaidRuntimePath:t.mermaidRuntimePath,workspaceRoot:t.workspaceRoot,sessionMapJsonPath:(0,S.join)(n,"session-map.json"),sessionMapHtmlPath:(0,S.join)(n,"session-map.html"),sessionGridHtmlPath:(0,S.join)(n,"session-map-session-grid.html"),sessionMapDiagramsPath:(0,S.join)(n,"session-map-diagrams.html"),sdkDiagnosticPath:(0,S.join)(n,"sdk-diagnostic.json"),rackDiagnosticPath:(0,S.join)(n,"rack-diagnostic.json"),sdkCapabilityMatrixJsonPath:(0,S.join)(n,"sdk-capability-matrix.json"),sdkCapabilityMatrixHtmlPath:(0,S.join)(n,"sdk-capability-matrix.html"),sdkCapabilityMatrixMarkdownPath:(0,S.join)(n,"sdk-capability-matrix.md")}}function Ee(e){return String(e).padStart(2,"0")}function Ze(e,t){let n=new Date(e),a=Number.isNaN(n.getTime())?new Date:n,r=[a.getFullYear(),Ee(a.getMonth()+1),Ee(a.getDate())].join("-"),i=[Ee(a.getHours()),Ee(a.getMinutes())];return t&&i.push(Ee(a.getSeconds())),`${r}_${i.join("-")}`}function Fi(e){return(e??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[<>:"/\\|?*\x00-\x1f]/g," ").replace(/[^A-Za-z0-9._ -]/g," ").trim().replace(/[ .]+/g,"-").replace(/-+/g,"-").replace(/^[-_.]+|[-_.]+$/g,"")}async function Oe(e){try{return await(0,M.access)(e),!0}catch{return!1}}function Gi(e){let t=Fi(e.set.name);return t?`${t}_Session-Map`:"Ableton-Session-Map"}async function Hi(e,t){let n=Gi(t),a=Ze(t.exportedAt,!1),r=Ze(t.exportedAt,!0),i=[`${n}_${a}`,`${n}_${r}`];for(let o of i){let l=(0,S.join)(e,`${o}.json`),c=(0,S.join)(e,`${o}.html`);if(!await Oe(l)&&!await Oe(c))return o}let s=2;for(;s<1e4;){let o=`${n}_${r}-${s}`,l=(0,S.join)(e,`${o}.json`),c=(0,S.join)(e,`${o}.html`);if(!await Oe(l)&&!await Oe(c))return o;s+=1}throw new Error("Unable to reserve a unique archive filename.")}async function Ki(e,t,n,a){let r=Ze(n,!1),i=Ze(n,!0),s=[`${t}_${r}`,`${t}_${i}`],o=async c=>{for(let d of a)if(await Oe((0,S.join)(e,`${c}.${d}`)))return!1;return!0};for(let c of s)if(await o(c))return c;let l=2;for(;l<1e4;){let c=`${t}_${i}-${l}`;if(await o(c))return c;l+=1}throw new Error(`Unable to reserve a unique archive filename for ${t}.`)}var zi=3,Un=64,Bi=32,Ji=16;function Mt(e,t){return(e??[]).slice(0,Bi).map(n=>{let a=t+1,r=a<zi,i=r?(n.chains??[]).slice(0,Un).map(o=>({...o,devices:Mt(o.devices,a)})):[],s=r?(n.pads??[]).slice(0,Un).map(o=>({...o,devices:Mt(o.devices,a)})):[];return{...n,parameters:(n.parameters??[]).slice(0,Ji),chains:i,pads:s}})}function Ui(e){let t=n=>({...n,devices:Mt(n.devices,0)});return{...e,tracks:e.tracks.map(t),returnTracks:e.returnTracks.map(t),masterTrack:e.masterTrack?t(e.masterTrack):null}}async function Wi(e){if(!e)return null;try{return JSON.parse(await(0,M.readFile)(e,"utf8"))}catch(t){if(t.code==="ENOENT")return null;throw t}}async function qn(e){return JSON.parse(await(0,M.readFile)(e,"utf8"))}async function Xi(e,t,n){await(0,M.writeFile)(e,n,"utf8"),await(0,M.writeFile)(t,n,"utf8")}async function Yn(e,t){let n=await I(e);await(0,M.mkdir)(n.exportDirectory,{recursive:!0});let a=await Hi(n.exportDirectory,t);return{latestJsonPath:n.sessionMapJsonPath,archiveJsonPath:(0,S.join)(n.exportDirectory,`${a}.json`),latestHtmlPath:n.sessionMapHtmlPath,archiveHtmlPath:(0,S.join)(n.exportDirectory,`${a}.html`)}}async function Zn(e,t){let n=await I(e);await(0,M.mkdir)(n.exportDirectory,{recursive:!0});let a=await Ki(n.exportDirectory,"sdk-capability-matrix",t.generatedAt,["json","html","md"]);return{latestJsonPath:n.sdkCapabilityMatrixJsonPath,archiveJsonPath:(0,S.join)(n.exportDirectory,`${a}.json`),latestHtmlPath:n.sdkCapabilityMatrixHtmlPath,archiveHtmlPath:(0,S.join)(n.exportDirectory,`${a}.html`),latestMarkdownPath:n.sdkCapabilityMatrixMarkdownPath,archiveMarkdownPath:(0,S.join)(n.exportDirectory,`${a}.md`)}}async function Qn(e,t){console.log(`[Ableton Session Mapper] Write JSON started: ${e.latestJsonPath}`),console.log(`[Ableton Session Mapper] Write JSON exportedAt: ${t.exportedAt}`);let n=`${JSON.stringify(t,null,2)}
`;await(0,M.writeFile)(e.latestJsonPath,n,"utf8"),await(0,M.writeFile)(e.archiveJsonPath,n,"utf8");let a=JSON.parse(await(0,M.readFile)(e.latestJsonPath,"utf8"));return console.log(`[Ableton Session Mapper] Write JSON latest completed: ${e.latestJsonPath}`),console.log(`[Ableton Session Mapper] Write JSON archive completed: ${e.archiveJsonPath}`),console.log(`[Ableton Session Mapper] Write JSON readback exportedAt: ${a.exportedAt??"missing"}`),e}async function ea(e,t,n,a){let r=await I(e),[i,s,o]=await Promise.all([qn(t),(0,M.readFile)(r.viewerStylesPath,"utf8"),Wi(a)]),l=bn(Ui(i),s,o);return await Xi(n.latestHtmlPath,n.archiveHtmlPath,l),console.log(`[Ableton Session Mapper] Generate HTML latest completed: ${n.latestHtmlPath}`),console.log(`[Ableton Session Mapper] Generate HTML archive completed: ${n.archiveHtmlPath}`),n}async function ve(e,t,n){let a=(0,S.join)(e,"node_modules","tsx","dist","cli.mjs"),r=(0,S.join)(e,t);await Vi(process.execPath,[a,r,...n],{cwd:e})}async function ta(e,t){let n=await I(e);return await ft({jsonPath:t,outputPath:n.sessionGridHtmlPath,logPrefix:"[session-grid]",rootDirectory:n.projectRoot}),n.sessionGridHtmlPath}async function na(e,t){let n=await I(e);return await $n({jsonPath:t,outputPath:n.sessionMapDiagramsPath,rootDirectory:n.projectRoot}),n.sessionMapDiagramsPath}async function aa(e){let t=await I(e);if(t.runtimeMode!=="dev"||!t.workspaceRoot){console.log("[Ableton Session Mapper] Mermaid SVG/PNG render skipped: available in dev/export workflow only.");return}await ve(t.workspaceRoot,"mermaid/generateMermaid.ts",["--profile","flow","--output","exports/session-map-flow.mmd","--file-suffix","flow"]),await ve(t.workspaceRoot,"mermaid/renderMermaid.ts",["--profile","flow","--input","exports/session-map-flow.mmd","--svg","exports/session-map-flow.svg","--png","exports/session-map-flow.png","--html","exports/session-map-mermaid-flow.html","--file-suffix","flow"]),await ve(t.workspaceRoot,"mermaid/generateMermaid.ts",["--profile","git","--output","exports/session-map-git.mmd","--file-suffix","git"]),await ve(t.workspaceRoot,"mermaid/renderMermaid.ts",["--profile","git","--input","exports/session-map-git.mmd","--svg","exports/session-map-git.svg","--png","exports/session-map-git.png","--html","exports/session-map-mermaid-git.html","--file-suffix","git"]),await ve(t.workspaceRoot,"mermaid/generateMermaid.ts",["--profile","kanban","--output","exports/session-map-kanban.mmd","--file-suffix","kanban"]),await ve(t.workspaceRoot,"mermaid/renderMermaid.ts",["--profile","kanban","--input","exports/session-map-kanban.mmd","--svg","exports/session-map-kanban.svg","--png","exports/session-map-kanban.png","--html","exports/session-map-mermaid-kanban.html","--file-suffix","kanban"])}async function ra(e){let t=await I(e),n=await qn(t.sessionMapJsonPath),a=["flow","git","kanban"];for(let r of a){let i=r,s=(0,S.join)(t.exportDirectory,r==="flow"?"session-map-flow.mmd":r==="git"?"session-map-git.mmd":"session-map-kanban.mmd"),o=await yt({jsonPath:t.sessionMapJsonPath,outputPath:s,profile:r,fileSuffix:i,logPrefix:r==="flow"?"[mermaid]":`[mermaid:${r}]`,rootDirectory:t.projectRoot});if(r==="git"){let l=Rn(n),c=Cn(l,{mmdFileName:(0,S.basename)(o.latestPath),svgFileName:"session-map-git.svg",pngFileName:"session-map-git.png"});await(0,M.writeFile)((0,S.join)(t.exportDirectory,"session-map-mermaid-git.html"),c,"utf8"),await(0,M.writeFile)((0,S.join)(t.exportDirectory,"session-map-git.svg"),kt(l),"utf8");continue}if(!t.mermaidRuntimePath){console.log(`[Ableton Session Mapper] Mermaid HTML skipped for ${r}: mermaid runtime unavailable in current runtime.`);continue}await St({profile:r,inputPath:o.latestPath,outputPath:(0,S.join)(t.exportDirectory,r==="flow"?"session-map-mermaid-flow.html":"session-map-mermaid-kanban.html"),mermaidRuntimePath:t.mermaidRuntimePath,logPrefix:`[mermaid-html:${r}]`,rootDirectory:t.projectRoot})}}async function ia(e,t){let n=await I(e);return await(0,M.mkdir)(n.exportDirectory,{recursive:!0}),await(0,M.writeFile)(n.sdkDiagnosticPath,`${JSON.stringify(t,null,2)}
`,"utf8"),n.sdkDiagnosticPath}async function sa(e,t){let n=await I(e);return await(0,M.mkdir)(n.exportDirectory,{recursive:!0}),await(0,M.writeFile)(n.rackDiagnosticPath,`${JSON.stringify(t,null,2)}
`,"utf8"),n.rackDiagnosticPath}async function oa(e,t,n,a){return await(0,M.writeFile)(e.latestJsonPath,`${JSON.stringify(t,null,2)}
`,"utf8"),await(0,M.writeFile)(e.archiveJsonPath,`${JSON.stringify(t,null,2)}
`,"utf8"),console.log(`[Ableton Session Mapper] Write capability matrix JSON completed: ${e.latestJsonPath}`),await(0,M.writeFile)(e.latestHtmlPath,n,"utf8"),await(0,M.writeFile)(e.archiveHtmlPath,n,"utf8"),console.log(`[Ableton Session Mapper] Write capability matrix HTML completed: ${e.latestHtmlPath}`),await(0,M.writeFile)(e.latestMarkdownPath,a,"utf8"),await(0,M.writeFile)(e.archiveMarkdownPath,a,"utf8"),console.log(`[Ableton Session Mapper] Write capability matrix Markdown completed: ${e.latestMarkdownPath}`),e}var la="Ableton Session Mapper",ke="1.3.0";var Ne=require("node:fs/promises"),C=require("node:path");function m(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function qi(e){return JSON.stringify(e).replaceAll("<","\\u003c").replaceAll(">","\\u003e").replaceAll("&","\\u0026").replaceAll("\u2028","\\u2028").replaceAll("\u2029","\\u2029")}function ca(e){if(!e)return"No export available yet";let t=new Date(e);return Number.isNaN(t.getTime())?e:t.toLocaleString("fr-FR")}function de(e,t=18){return e.length<=t?e:`${e.slice(0,t-1)}\u2026`}function Tt(e){let t=e.categorySource==="inferred"?' title="Category inferred from device name/track context"':"",n=e.categorySource==="manual"||e.categorySource==="unknown"?`<span class="device-source device-source-${m(e.categorySource)}" title="Device category source: ${m(e.categorySource)}">${m(e.categorySource)}</span>`:"";return`<div class="device-badge-row"${t}>
    <span class="device-type-badge device-type-${m(e.category)}">${m(e.categoryBadge)}</span>
    ${n}
  </div>`}function Qe(){return`<div class="device-legend">
    <span class="legend-title">Legend</span>
    <span class="device-type-badge device-type-instrument">INST</span>
    <span class="device-type-badge device-type-midi-effect">MIDI FX</span>
    <span class="device-type-badge device-type-audio-effect">AUDIO FX</span>
    <span class="device-type-badge device-type-max-for-live">M4L / M4L MIDI</span>
    <span class="device-type-badge device-type-rack">RACK</span>
    <span class="device-type-badge device-type-unknown">?</span>
    <small>Device categories may be inferred or manually overridden when the SDK does not expose a stable device class.</small>
  </div>`}function Yi(e){let t=e.exists?"":" disabled";return`<button class="action-button${e.key==="launcher"?" is-primary":""}" type="button" data-link-key="${m(e.key)}"${t}>${m(e.label)}</button>`}function Zi(e){let t=e.exists?"":" disabled",n=e.key==="launcher"?" is-primary":"";return`<div class="file-row">
    <div class="file-meta">
      <strong>${m(e.label)}</strong>
      <span>${m(e.fileName)}</span>
    </div>
    <div class="file-actions">
      <span class="file-status ${e.exists?"is-available":"is-missing"}">${e.exists?"available":"missing"}</span>
      <button class="mini-button${n}" type="button" data-link-key="${m(e.key)}"${t}>Open</button>
    </div>
  </div>`}function Qi(e){let t=e.warningMessage?`<div class="notice warning">${m(e.warningMessage)}</div>`:"";return`<div class="overview-grid">
      <article class="overview-card">
        <span class="label">Version</span>
        <strong>${m(e.appVersion)}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Set</span>
        <strong>${m(e.setName??"Untitled Set")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Export date</span>
        <strong>${m(ca(e.exportedAt))}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Mode</span>
        <strong>${m(e.scanMode)}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Status</span>
        <strong>${m(e.hasExport?"Ready":"Waiting for export")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Viewer</span>
        <strong>${m(e.internalVisualPreviewEnabled?"Internal preview enabled":"Metadata only")}</strong>
      </article>
      <article class="overview-card">
        <span class="label">Device types</span>
        <strong>INST / MIDI FX / AUDIO FX / M4L / RACK / ?</strong>
      </article>
    </div>
    <div class="notice">${m(e.statusMessage)}</div>
    ${Qe()}
    ${t}
    <div class="quick-open">
      <div class="section-header">
        <h3>Quick Open</h3>
        <p>External launcher remains available for full diagrams</p>
      </div>
      <div class="button-grid">
        ${e.quickLinks.map(n=>Yi(n)).join("")}
      </div>
    </div>`}function es(e){return e.internalVisualPreviewEnabled?!e.hasExport||e.sessionPreviewColumns.length===0?`<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`:`<div class="notice">
      Internal preview uses exported JSON. For full diagrams, open the external launcher.
    </div>
    ${Qe()}
    <div class="preview-metrics-inline">
      <span>tracks:${e.metrics.tracks}</span>
      <span>returns:${e.metrics.returns}</span>
      <span>devices:${e.metrics.devices}</span>
      <span>racks:${e.metrics.racks}</span>
      <span>sends:${e.metrics.sends}</span>
    </div>
    <div class="session-preview-scroll">
      <div class="session-preview-grid">
        ${e.sessionPreviewColumns.map(t=>`<section class="session-column session-column-${m(t.sectionType)} session-kind-${m(t.kind)}">
              <header class="session-column-header">
                <div class="session-column-title">
                  <strong>${m(t.name)}</strong>
                  <span class="kind-badge kind-${m(t.sectionType)}">${m(t.kind)}</span>
                </div>
                <p>${t.sectionType==="master"?"\u2605":t.index+1} \xB7 dev:${t.deviceCount} \xB7 sends:${t.sendCount} \xB7 racks:${t.rackCount}</p>
              </header>
              <div class="session-device-stack">
                ${t.deviceCards.length>0?t.deviceCards.map(n=>`<article class="session-device-card ${n.isRack?"is-rack":""} device-tone-${m(n.category)}">
                            ${Tt(n)}
                            <strong>${m(n.name)}</strong>
                            <span>${m(n.summary)}</span>
                          </article>`).join(""):'<div class="session-empty-card">No devices</div>'}
              </div>
            </section>`).join("")}
      </div>
    </div>`:`<div class="empty-state">
      <strong>Internal visual preview disabled.</strong>
      <span>The experimental viewer is currently limited to metadata tabs.</span>
    </div>`}function ts(e){return e.internalVisualPreviewEnabled?!e.hasExport||e.sessionPreviewColumns.length===0?`<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`:`<div class="notice">
      Metro preview is native HTML/CSS inside Live. Full Git / Metro Mermaid remains external.
    </div>
    ${Qe()}
    <div class="metro-list">
      ${e.sessionPreviewColumns.map(t=>`<section class="metro-row session-column-${m(t.sectionType)} session-kind-${m(t.kind)}">
            <div class="metro-track-name">
              <strong>${m(t.name)}</strong>
              <span>${m(t.kind)} \xB7 dev:${t.deviceCount}</span>
            </div>
            <div class="metro-line-shell">
              <div class="metro-line">
                <article class="metro-stop is-track">
                  <span class="metro-dot"></span>
                  <strong>${m(de(t.name,18))}</strong>
                  <small>${m(t.kind)}</small>
                </article>
                ${t.deviceCards.map(n=>`<article class="metro-stop ${n.isRack?"is-rack":""} metro-${m(n.category)}">
                      <span class="metro-dot metro-dot-${m(n.category)}"></span>
                      <strong>${m(de(n.name,18))}</strong>
                      <small>${m(n.categoryBadge)} \xB7 ${m(de(n.summary,22))}</small>
                    </article>`).join("")}
                ${t.deviceCards.length===0?`<article class="metro-stop is-empty">
                        <span class="metro-dot"></span>
                        <strong>No devices</strong>
                        <small>empty track</small>
                      </article>`:""}
              </div>
            </div>
          </section>`).join("")}
    </div>`:`<div class="empty-state">
      <strong>Internal visual preview disabled.</strong>
      <span>The experimental viewer is currently limited to metadata tabs.</span>
    </div>`}function ns(e){return!e.hasExport||e.outputs.length===0?`<div class="empty-state">
      <strong>No export generated yet.</strong>
      <span>Run Export Session Map first, then reopen this viewer.</span>
    </div>`:`<div class="notice">
      Routing I/O not exposed by current SDK version.
    </div>
    <div class="table-shell">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Track</th>
            <th>Kind</th>
            <th>Input</th>
            <th>Output</th>
            <th>Sends</th>
          </tr>
        </thead>
        <tbody>
          ${e.outputs.map(t=>`<tr>
                <td>${t.sectionType==="master"?"\u2605":t.index+1}</td>
                <td>${m(t.name)}</td>
                <td><span class="kind-badge kind-${m(t.sectionType)}">${m(t.kind)}</span></td>
                <td>${m(t.audioFrom)}</td>
                <td>${m(t.audioTo)}</td>
                <td>${m(t.sends)}</td>
              </tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${e.hasMissingRoutingData?'<div class="notice warning">Routing I/O non disponible dans cette version du SDK.</div>':""}`}function as(e){return!e.hasExport||e.deviceTracks.length===0?`<div class="empty-state">
      <strong>No devices to display yet.</strong>
      <span>The internal viewer only reflects the latest exported JSON.</span>
    </div>`:`<div class="device-list">
    ${Qe()}
    ${e.deviceTracks.map(t=>`<article class="device-card">
          <header class="device-card-header">
            <div>
              <h3>${m(t.name)}</h3>
              <p>${m(t.kind)} \xB7 dev:${t.deviceCount} \xB7 racks:${t.rackCount}</p>
            </div>
            <span class="kind-badge kind-${m(t.sectionType)}">${m(t.kind)}</span>
          </header>
          <div class="chip-group chip-group-devices">
            ${t.deviceItems.length>0?t.deviceItems.map(n=>`<span class="chip chip-device device-tone-${m(n.category)}">
                    ${Tt(n)}
                    <strong>${m(de(n.name,24))}</strong>
                    <em>${m(de(n.summary,34))}</em>
                  </span>`).join(""):'<span class="empty-inline">No devices</span>'}
          </div>
          ${t.rackItems.length>0?`<div class="rack-summary">
                  <span class="label">Racks</span>
                  <div class="chip-group chip-group-devices">${t.rackItems.map(n=>`<span class="chip chip-device chip-rack device-tone-rack">
                      ${Tt(n)}
                      <strong>${m(de(n.name,24))}</strong>
                      <em>${m(de(n.summary,34))}</em>
                    </span>`).join("")}</div>
                </div>`:""}
        </article>`).join("")}
  </div>`}function rs(e){return Array.from(new Set(e.files.map(n=>n.group))).map(n=>{let a=e.files.filter(r=>r.group===n);return`<section class="file-group">
        <div class="section-header">
          <h3>${m(n)}</h3>
          <p>${a.filter(r=>r.exists).length}/${a.length} available</p>
        </div>
        <div class="file-group-list">
          ${a.map(r=>Zi(r)).join("")}
        </div>
      </section>`}).join("")}function da(e){return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Mapper</title>
  <script>
    const viewerModel = ${qi(e)};
    const isWebKit = window.webkit?.messageHandlers?.live;
    const isWebView2 = window.chrome?.webview;

    function sendMessage(message) {
      if (isWebKit) {
        window.webkit.messageHandlers.live.postMessage(message);
      } else if (isWebView2) {
        window.chrome.webview.postMessage(message);
      }
    }

    function closeWithResult(result) {
      sendMessage({
        method: "close_and_send",
        params: [JSON.stringify(result)],
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-link-key]").forEach((button) => {
        button.addEventListener("click", () => {
          if (button.hasAttribute("disabled")) return;
          const key = button.getAttribute("data-link-key");
          closeWithResult({ action: "open-link", key });
        });
      });

      document.getElementById("refresh-viewer")?.addEventListener("click", () => {
        closeWithResult({ action: "refresh" });
      });

      document.getElementById("close-viewer")?.addEventListener("click", () => {
        closeWithResult({ action: "close" });
      });

      document.getElementById("cancel-viewer")?.addEventListener("click", () => {
        closeWithResult({ action: "cancel" });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeWithResult({ action: "cancel" });
        }
      });
    });
  </script>
  <style>
    :root {
      color-scheme: light dark;
      --live-bg: #8f8f8f;
      --live-panel: #b7b7b7;
      --live-panel-light: #c7c7c7;
      --live-panel-dark: #727272;
      --live-panel-deep: #616161;
      --live-border: #5e5e5e;
      --live-text: #111111;
      --live-muted: #383838;
      --live-orange: #f5a000;
      --live-orange-deep: #db8f00;
      --live-cyan: #00cfe8;
      --live-magenta: #d26ecf;
      --live-purple: #9384ff;
      --track-midi: #9bb4e8;
      --device-instrument: #f5a623;
      --device-midi-fx: #7755cc;
      --device-audio-fx: #00bcd4;
      --device-m4l: #ff4fd8;
      --device-rack: #d48a00;
      --device-unknown: #777777;
      --live-grid: rgba(0, 0, 0, 0.18);
      --live-shadow: rgba(0, 0, 0, 0.14);
      --live-slot: #d0d0d0;
      --live-slot-muted: #d7d7d7;
      --live-rack: #f3d099;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      background: var(--live-bg);
      color: var(--live-text);
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      font-size: 12px;
      -webkit-font-smoothing: antialiased;
    }
    body {
      background:
        linear-gradient(180deg, #9c9c9c 0%, #898989 100%);
      padding: 10px;
    }
    .shell {
      height: calc(100vh - 20px);
      max-width: 95vw;
      max-height: 92vh;
      display: grid;
      grid-template-rows: auto auto auto minmax(0, 1fr) auto;
      gap: 8px;
    }
    .hero, .metrics, .tab-bar, .panel-shell, .footer {
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 4px var(--live-shadow);
    }
    .hero {
      padding: 9px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      background: linear-gradient(180deg, #7a7a7a, #6f6f6f);
      color: #101010;
    }
    .eyebrow {
      margin: 0 0 3px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(17,17,17,0.7);
      font-size: 9px;
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: 18px;
      line-height: 1;
      letter-spacing: -0.02em;
      font-weight: 700;
    }
    .subline {
      margin: 4px 0 0;
      color: rgba(17,17,17,0.76);
      line-height: 1.35;
      font-size: 11px;
      max-width: 60ch;
    }
    .hero-meta {
      display: grid;
      grid-auto-flow: column;
      gap: 14px;
      align-items: center;
      color: rgba(17,17,17,0.76);
      font-size: 10px;
      line-height: 1.3;
      text-align: left;
    }
    .hero-meta div {
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 6px;
      padding: 6px;
      background: var(--live-panel-dark);
    }
    .metric {
      background: linear-gradient(180deg, #c9c9c9, #b8b8b8);
      border: 1px solid var(--live-border);
      padding: 8px 6px;
      text-align: center;
      border-radius: 3px;
      transition: border-color 120ms ease, background 120ms ease;
    }
    .metric:hover {
      border-color: var(--live-orange);
      background: linear-gradient(180deg, #d3d3d3, #c1c1c1);
    }
    .metric strong {
      display: block;
      font-size: 19px;
      margin-bottom: 2px;
      color: var(--live-text);
      line-height: 1;
    }
    .metric span {
      color: var(--live-muted);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
    .tab-toggle {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
    }
    .tab-bar {
      display: flex;
      gap: 6px;
      padding: 6px;
      flex-wrap: wrap;
      background: linear-gradient(180deg, #7c7c7c, #6e6e6e);
    }
    .tab-label, .action-button, .mini-button, .close-button, .cancel-button {
      border-radius: 4px;
      border: 1px solid var(--live-border);
      color: var(--live-text);
      background: linear-gradient(180deg, #909090, #7d7d7d);
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
      font-family: inherit;
    }
    .tab-label:hover, .action-button:hover, .mini-button:hover, .close-button:hover, .cancel-button:hover {
      background: linear-gradient(180deg, #a1a1a1, #8a8a8a);
      border-color: #4f4f4f;
    }
    .tab-label {
      min-height: 28px;
      padding: 0 12px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      font-weight: 700;
    }
    #internal-tab-session:checked ~ .tab-bar label[for="internal-tab-session"],
    #internal-tab-metro:checked ~ .tab-bar label[for="internal-tab-metro"],
    #internal-tab-outputs:checked ~ .tab-bar label[for="internal-tab-outputs"],
    #internal-tab-devices:checked ~ .tab-bar label[for="internal-tab-devices"],
    #internal-tab-files:checked ~ .tab-bar label[for="internal-tab-files"],
    #internal-tab-overview:checked ~ .tab-bar label[for="internal-tab-overview"] {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-deep));
      color: #111;
      border-color: #865100;
    }
    .panel-shell {
      min-height: 0;
      padding: 8px;
      overflow: auto;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.08), transparent 30%),
        linear-gradient(180deg, #bdbdbd, #b5b5b5);
    }
    .panel {
      display: none;
      gap: 8px;
      align-content: start;
    }
    #internal-tab-session:checked ~ .panel-shell .panel-session,
    #internal-tab-metro:checked ~ .panel-shell .panel-metro,
    #internal-tab-outputs:checked ~ .panel-shell .panel-outputs,
    #internal-tab-devices:checked ~ .panel-shell .panel-devices,
    #internal-tab-files:checked ~ .panel-shell .panel-files,
    #internal-tab-overview:checked ~ .panel-shell .panel-overview {
      display: grid;
    }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
    .overview-card, .device-card, .notice, .empty-state, .file-group {
      background: var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-radius: 4px;
    }
    .overview-card {
      padding: 10px;
    }
    .overview-card .label, .rack-summary .label {
      display: block;
      color: var(--live-muted);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .overview-card strong {
      display: block;
      font-size: 12px;
      line-height: 1.35;
      word-break: break-word;
    }
    .notice {
      padding: 9px 10px;
      line-height: 1.45;
      color: var(--live-muted);
      background: #c5c5c5;
    }
    .notice.warning {
      color: #5a3200;
      border-color: #a87d37;
      background: #d8c29c;
    }
    .device-legend {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border: 1px solid var(--live-border);
      border-radius: 4px;
      background: #d1d1d1;
      color: var(--live-muted);
      font-size: 10px;
    }
    .legend-title {
      font-weight: 700;
      color: var(--live-text);
      margin-right: 4px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .device-legend small {
      color: var(--live-muted);
      line-height: 1.3;
    }
    .device-badge-row {
      display: flex;
      align-items: center;
      gap: 5px;
      min-height: 14px;
    }
    .device-type-badge {
      display: inline-flex;
      align-items: center;
      min-height: 16px;
      padding: 0 5px;
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.22);
      font-size: 8px;
      line-height: 1;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #111;
    }
    .device-type-instrument {
      background: rgba(245,166,35,0.42);
      border-color: rgba(153,102,0,0.55);
    }
    .device-type-midi-effect {
      background: rgba(122,140,255,0.34);
      border-color: rgba(70,79,155,0.5);
    }
    .device-type-audio-effect {
      background: rgba(0,188,212,0.28);
      border-color: rgba(0,106,120,0.5);
    }
    .device-type-max-for-live {
      background: rgba(255,79,216,0.28);
      border-color: rgba(148,28,118,0.5);
    }
    .device-type-rack {
      background: rgba(212,138,0,0.3);
      border-color: rgba(130,84,0,0.56);
    }
    .device-type-unknown {
      background: rgba(119,119,119,0.24);
      border-color: rgba(79,79,79,0.48);
    }
    .device-source {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: rgba(17,17,17,0.56);
    }
    .device-source-manual {
      color: rgba(120, 38, 102, 0.88);
    }
    .device-source-sdk {
      color: rgba(17,17,17,0.68);
    }
    .device-source-unknown {
      color: rgba(17,17,17,0.42);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .section-header h3 {
      margin: 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--live-text);
    }
    .section-header p {
      margin: 0;
      color: var(--live-muted);
      font-size: 10px;
    }
    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }
    .action-button {
      min-height: 32px;
      padding: 0 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
    }
    .action-button.is-primary,
    .mini-button.is-primary,
    .close-button {
      background: linear-gradient(180deg, var(--live-orange), var(--live-orange-deep));
      border-color: #865100;
      color: #111;
    }
    .action-button.is-primary:hover,
    .mini-button.is-primary:hover,
    .close-button:hover {
      background: linear-gradient(180deg, #ffb019, #e39500);
    }
    .action-button:disabled, .mini-button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
      background: #a5a5a5;
      color: #5f5f5f;
      border-color: #7d7d7d;
    }
    .table-shell {
      overflow: auto;
      border: 1px solid var(--live-border);
      border-radius: 4px;
      background: #cbcbcb;
    }
    .preview-metrics-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      color: var(--live-muted);
      font-size: 10px;
    }
    .preview-metrics-inline span {
      padding: 3px 7px;
      border-radius: 3px;
      background: #cfcfcf;
      border: 1px solid var(--live-border);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }
    .session-preview-scroll,
    .kanban-scroll,
    .metro-line-shell {
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 2px;
    }
    .session-preview-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(176px, 210px);
      gap: 8px;
      align-items: start;
      min-height: 0;
    }
    .session-column,
    .kanban-column {
      background:
        repeating-linear-gradient(
          to bottom,
          rgba(0,0,0,0.02) 0,
          rgba(0,0,0,0.02) 27px,
          rgba(0,0,0,0.08) 28px
        ),
        var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-radius: 3px;
      overflow: hidden;
      min-height: 250px;
      display: grid;
      grid-template-rows: auto 1fr;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .session-column:hover,
    .kanban-column:hover {
      border-color: var(--live-orange);
      box-shadow: inset 0 0 0 1px rgba(245,160,0,0.38);
    }
    .session-kind-midi .session-column-header,
    .session-kind-midi .kanban-column-header {
      background: linear-gradient(180deg, #adc2f0, var(--track-midi));
    }
    .session-kind-audio .session-column-header,
    .session-kind-audio .kanban-column-header {
      background: linear-gradient(180deg, #c5cf8d, #b0ba78);
    }
    .session-column-return .session-column-header,
    .session-column-return .kanban-column-header {
      background: linear-gradient(180deg, #8de0ec, #72cad5);
    }
    .session-column-master .session-column-header,
    .session-column-master .kanban-column-header {
      background: linear-gradient(180deg, #dca1ce, #c989ba);
    }
    .session-kind-group .session-column-header,
    .session-kind-group .kanban-column-header,
    .session-kind-unknown .session-column-header,
    .session-kind-unknown .kanban-column-header {
      background: linear-gradient(180deg, #cacaca, #b7b7b7);
    }
    .session-column-header,
    .kanban-column-header {
      padding: 8px 8px 7px;
      border-bottom: 1px solid rgba(0,0,0,0.22);
    }
    .session-column-title {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      align-items: start;
    }
    .session-column-title strong,
    .kanban-column-header strong {
      display: block;
      font-size: 12px;
      line-height: 1.25;
      word-break: break-word;
    }
    .session-column-header p {
      margin: 5px 0 0;
      font-size: 10px;
      color: rgba(17,17,17,0.72);
      line-height: 1.35;
      font-weight: 600;
    }
    .session-device-stack,
    .kanban-column-body {
      display: grid;
      gap: 6px;
      padding: 8px;
      align-content: start;
      max-height: 590px;
      overflow-y: auto;
    }
    .session-device-card,
    .session-empty-card,
    .kanban-card {
      background: var(--live-slot);
      border: 1px solid rgba(0,0,0,0.2);
      border-radius: 2px;
      padding: 8px;
      display: grid;
      gap: 3px;
      line-height: 1.28;
      min-height: 46px;
    }
    .device-tone-instrument {
      background: linear-gradient(180deg, rgba(245,166,35,0.22), rgba(208,208,208,0.96));
    }
    .device-tone-midi-effect {
      background: linear-gradient(180deg, rgba(122,140,255,0.2), rgba(208,208,208,0.96));
    }
    .device-tone-audio-effect {
      background: linear-gradient(180deg, rgba(0,188,212,0.18), rgba(208,208,208,0.96));
    }
    .device-tone-max-for-live {
      background: linear-gradient(180deg, rgba(255,79,216,0.2), rgba(208,208,208,0.96));
    }
    .device-tone-rack {
      background: linear-gradient(180deg, rgba(212,138,0,0.24), rgba(243,208,153,0.96));
      border-color: #b77900;
      box-shadow: inset 0 0 0 1px rgba(245,160,0,0.16);
    }
    .device-tone-unknown {
      background: linear-gradient(180deg, rgba(119,119,119,0.16), rgba(208,208,208,0.96));
    }
    .session-device-card.is-rack,
    .kanban-card.is-rack {
      background: var(--live-rack);
      border-color: #b77900;
      box-shadow: inset 0 0 0 1px rgba(245,160,0,0.16);
    }
    .session-device-card strong,
    .kanban-card strong {
      font-size: 11px;
      color: var(--live-text);
    }
    .session-device-card span,
    .kanban-card span,
    .session-empty-card {
      color: var(--live-muted);
      font-size: 10px;
    }
    .kanban-grid {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(185px, 216px);
      gap: 8px;
      align-items: start;
    }
    .kanban-summary-card {
      background: #d6d6d6;
    }
    .metro-list {
      display: grid;
      gap: 8px;
    }
    .metro-row {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.09), transparent 34%),
        var(--live-panel-light);
      border: 1px solid var(--live-border);
      border-radius: 4px;
      padding: 10px;
      display: grid;
      grid-template-columns: 168px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    .metro-track-name strong {
      display: block;
      font-size: 12px;
      line-height: 1.25;
      margin-bottom: 3px;
    }
    .metro-track-name span {
      color: var(--live-muted);
      font-size: 10px;
    }
    .metro-line {
      display: flex;
      gap: 16px;
      align-items: center;
      min-width: max-content;
      padding: 8px 0 4px;
    }
    .metro-stop {
      position: relative;
      min-width: 116px;
      max-width: 156px;
      padding-top: 14px;
      display: grid;
      gap: 3px;
      color: var(--live-text);
    }
    .metro-stop::before {
      content: "";
      position: absolute;
      top: 5px;
      left: 0;
      right: -16px;
      height: 2px;
      background: rgba(0, 0, 0, 0.26);
      z-index: 0;
    }
    .metro-stop:last-child::before {
      right: 0;
    }
    .metro-stop strong, .metro-stop small, .metro-dot {
      position: relative;
      z-index: 1;
    }
    .metro-stop strong {
      font-size: 11px;
      line-height: 1.2;
    }
    .metro-stop small {
      color: var(--live-muted);
      font-size: 9px;
      line-height: 1.25;
    }
    .metro-dot {
      width: 11px;
      height: 11px;
      border-radius: 999px;
      background: var(--live-cyan);
      border: 1px solid rgba(17,17,17,0.6);
      box-shadow: 0 0 0 2px rgba(0,0,0,0.12);
    }
    .metro-stop.is-rack .metro-dot {
      background: var(--live-orange);
    }
    .metro-dot-instrument {
      background: var(--device-instrument);
    }
    .metro-dot-midi-effect {
      background: var(--device-midi-fx);
    }
    .metro-dot-audio-effect {
      background: var(--device-audio-fx);
    }
    .metro-dot-max-for-live {
      background: var(--device-m4l);
    }
    .metro-dot-rack {
      background: var(--device-rack);
      box-shadow: 0 0 0 2px rgba(212,138,0,0.18);
    }
    .metro-dot-unknown {
      background: var(--device-unknown);
    }
    .metro-stop.is-track .metro-dot {
      background: #f3f3f3;
    }
    .metro-stop.is-empty .metro-dot {
      background: #8d8d8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
      color: var(--live-text);
    }
    thead th {
      position: sticky;
      top: 0;
      background: var(--live-panel-deep);
      color: #f2f2f2;
      text-align: left;
      padding: 9px 10px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid var(--live-border);
    }
    tbody td {
      padding: 8px 10px;
      border-top: 1px solid rgba(0,0,0,0.12);
      vertical-align: top;
      line-height: 1.4;
      background: rgba(255,255,255,0.06);
    }
    tbody tr:nth-child(even) td {
      background: rgba(0,0,0,0.03);
    }
    tbody tr:hover td {
      background: rgba(245,160,0,0.1);
    }
    .kind-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 7px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid rgba(0,0,0,0.22);
      background: rgba(255,255,255,0.34);
      font-weight: 700;
      color: var(--live-text);
    }
    .kind-return { border-color: rgba(0, 122, 140, 0.42); background: rgba(0, 207, 232, 0.16); }
    .kind-master { border-color: rgba(150, 65, 135, 0.42); background: rgba(210, 110, 207, 0.16); }
    .kind-track { border-color: rgba(0,0,0,0.18); }
    .device-list {
      display: grid;
      gap: 8px;
    }
    .device-card {
      padding: 10px;
      background: #c3c3c3;
    }
    .device-card-header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: start;
      margin-bottom: 8px;
    }
    .device-card-header h3 {
      margin: 0;
      font-size: 12px;
      line-height: 1.2;
    }
    .device-card-header p {
      margin: 3px 0 0;
      color: var(--live-muted);
      font-size: 10px;
      line-height: 1.25;
    }
    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip-group-devices {
      gap: 8px;
    }
    .chip {
      padding: 5px 8px;
      border-radius: 2px;
      background: #d5d5d5;
      border: 1px solid rgba(0,0,0,0.18);
      line-height: 1.25;
      font-size: 10px;
      min-height: 24px;
      display: inline-flex;
      align-items: center;
    }
    .chip-device {
      display: grid;
      align-content: start;
      gap: 4px;
      min-width: 148px;
      max-width: 220px;
      background: #d6d6d6;
      padding: 7px 8px;
    }
    .chip-device strong {
      font-size: 10px;
      line-height: 1.2;
      color: var(--live-text);
    }
    .chip-device em {
      font-style: normal;
      font-size: 9px;
      line-height: 1.25;
      color: var(--live-muted);
    }
    .chip-rack {
      background: var(--live-rack);
      border-color: #b77900;
    }
    .rack-summary {
      margin-top: 8px;
    }
    .empty-inline {
      color: var(--live-muted);
      font-size: 10px;
    }
    .file-group {
      padding: 10px;
      background: #c2c2c2;
    }
    .file-group-list {
      display: grid;
      gap: 6px;
    }
    .file-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 8px 10px;
      border-radius: 3px;
      background: #d3d3d3;
      border: 1px solid rgba(0,0,0,0.14);
    }
    .file-meta {
      min-width: 0;
    }
    .file-meta strong {
      display: block;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .file-meta span {
      display: block;
      color: var(--live-muted);
      font-size: 10px;
      overflow-wrap: anywhere;
    }
    .file-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .file-status {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--live-muted);
      font-weight: 700;
    }
    .file-status.is-available { color: #2f5e2f; }
    .file-status.is-missing { color: #7c5c30; }
    .mini-button {
      min-height: 24px;
      padding: 0 10px;
      font-size: 10px;
      font-weight: 700;
    }
    .empty-state {
      padding: 14px 14px;
      display: grid;
      gap: 6px;
      color: var(--live-muted);
      background: #cfcfcf;
    }
    .footer {
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      background: linear-gradient(180deg, #b2b2b2, #aaaaaa);
    }
    .footer small {
      color: var(--live-muted);
      font-size: 9px;
      line-height: 1.35;
      max-width: 60%;
    }
    .footer-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .close-button, .cancel-button {
      min-height: 28px;
      padding: 0 11px;
      font-size: 10px;
      font-weight: 700;
    }
    .cancel-button {
      color: var(--live-text);
      background: linear-gradient(180deg, #b8b8b8, #a5a5a5);
    }
    .footer a {
      color: rgba(17,17,17,0.55);
      text-decoration: none;
      font-size: 9px;
      white-space: nowrap;
    }
    .footer a:hover {
      color: var(--live-orange-deep);
    }
    @media (max-width: 1024px) {
      .hero {
        flex-direction: column;
        align-items: start;
      }
      .hero-meta {
        grid-auto-flow: row;
        gap: 4px;
      }
    }
    @media (max-width: 860px) {
      .overview-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .hero-meta, .footer small {
        max-width: none;
      }
      .footer {
        flex-direction: column;
        align-items: start;
      }
      .metro-row {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Integrated Viewer \xB7 beta</p>
        <h1>Session Mapper</h1>
        <p class="subline">Lightweight internal hub for the latest Live Set export. External launcher remains available for full diagrams.</p>
      </div>
      <div class="hero-meta">
        <div>Version: ${m(e.appVersion)}</div>
        <div>Set: ${m(e.setName??"Untitled Set")}</div>
        <div>Export: ${m(ca(e.exportedAt))}</div>
        <div>Mode: ${m(e.scanMode)}</div>
      </div>
    </section>

    <section class="metrics" aria-label="Session metrics">
      <article class="metric"><strong>${e.metrics.tracks}</strong><span>Tracks</span></article>
      <article class="metric"><strong>${e.metrics.returns}</strong><span>Returns</span></article>
      <article class="metric"><strong>${e.metrics.devices}</strong><span>Devices</span></article>
      <article class="metric"><strong>${e.metrics.racks}</strong><span>Racks</span></article>
      <article class="metric"><strong>${e.metrics.sends}</strong><span>Sends</span></article>
    </section>

    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-session" checked>
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-metro">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-outputs">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-devices">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-files">
    <input class="tab-toggle" type="radio" name="internal-tab" id="internal-tab-overview">

    <nav class="tab-bar" aria-label="Internal viewer tabs">
      <label class="tab-label" for="internal-tab-session">Session</label>
      <label class="tab-label" for="internal-tab-metro">Git / Metro</label>
      <label class="tab-label" for="internal-tab-outputs">Outputs</label>
      <label class="tab-label" for="internal-tab-devices">Devices</label>
      <label class="tab-label" for="internal-tab-files">Files</label>
      <label class="tab-label" for="internal-tab-overview">Overview</label>
    </nav>

    <section class="panel-shell">
      <div class="panel panel-session">
        ${es(e)}
      </div>
      <div class="panel panel-metro">
        ${ts(e)}
      </div>
      <div class="panel panel-overview">
        ${Qi(e)}
      </div>
      <div class="panel panel-outputs">
        ${ns(e)}
      </div>
      <div class="panel panel-devices">
        ${as(e)}
      </div>
      <div class="panel panel-files">
        ${rs(e)}
      </div>
    </section>

    <section class="footer">
      <small>This integrated viewer stays intentionally lightweight: no Mermaid runtime, no embedded SVG, no heavy report rendering inside Live. Use the external launcher for full diagrams.</small>
      <div class="footer-actions">
        <button id="refresh-viewer" class="cancel-button" type="button">Refresh Metadata</button>
        <button id="cancel-viewer" class="cancel-button" type="button">Cancel</button>
        <button id="close-viewer" class="close-button" type="button">Close</button>
      </div>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </section>
  </div>
</body>
</html>`}var Pt=1400,Dt=950,ma=!0,Ct="Non expos\xE9 par le SDK",At=12,$t=8,Rt=16,is=["drum rack","instrument rack","simpler","sampler","wavetable","operator","analog","drift","meld","collision","tension","electric","external instrument","dexed","serum","massive","kontakt","pigments","drum synth","ds clap","ds kick","ds snare","ds hh","ds cymbal","ds tom"],ss=["arpeggiator","chord","scale","scale awareness","pitch","random","velocity","note length","note echo","midi monitor","mpe control","expression control","envelope midi","cc control","midi effect rack"],os=["bass","piano","e-piano","clap","kick","snare"],ls=["eq eight","auto filter","compressor","glue compressor","limiter","reverb","hybrid reverb","echo","delay","filter delay","shifter","chorus","phaser","flanger","saturator","overdrive","cabinet","amp","utility","gate","redux","roar","audio effect rack"],cs=["max for live","max midi effect","max audio effect","max instrument","m4l",".amxd","lfo","envelope follower","shaper","shaper midi","multimap","expression control","midi monitor","sting","sting!64","maxdevice"],ds=["max","maxdevice","max for live","amxd",".amxd","m4l"];function Et(e){switch(e){case"audio":return"audio";case"midi":return"midi";case"return":return"return";case"master":return"master";case"group":return"group";default:return"unknown"}}function ua(e){if(e==null)return null;let t=e.trim();return t.length>0?t:null}function pa(e){let t=ua(e.type),n=ua(e.channel);return!t&&!n?Ct:[t,n].filter(Boolean).join(" \xB7 ")}function us(e){return e.sends.length===0?"\u2014":e.sends.map(t=>`${t.name}: ${t.value==null?"\u2014":t.value.toFixed(3)}`).join(", ")}function xe(e){return e.type.toLowerCase().includes("rack")||!!e.chainsSummary?.count||!!e.padsSummary?.count}function ps(e){let t=[e.name,e.type];return e.chainsSummary?.count&&t.push(`chains:${e.chainsSummary.count}`),e.padsSummary?.count&&t.push(`pads:${e.padsSummary.count}`),e.scanStatus==="summary"&&t.push("summary"),t.join(" \xB7 ")}function ms(e){let t=[e.name];return e.chainsSummary?.count&&t.push(`chains:${e.chainsSummary.count}`),e.padsSummary?.count&&t.push(`pads:${e.padsSummary.count}`),e.scanWarning&&t.push(e.scanWarning),t.join(" \xB7 ")}function gs(e){let t=[e.name];return xe(e)?t.push("Rack"):t.push(e.type),e.chainsSummary?.count&&t.push(`chains:${e.chainsSummary.count}`),e.padsSummary?.count&&t.push(`pads:${e.padsSummary.count}`),t.join(" \xB7 ")}function et(e,t){return t.some(n=>e.includes(n))}function V(e,t,n,a){let r=e==="max-for-live"?"Max for Live":e==="midi-effect"?"MIDI FX":e==="audio-effect"?"Audio FX":e==="instrument"?"Instrument":e==="rack"?"Rack":"Unknown",i=e==="max-for-live"?a?.m4lKind==="midi"?"M4L MIDI":a?.m4lKind==="audio"?"M4L AUDIO":a?.m4lKind==="instrument"?"M4L INST":"M4L":e==="midi-effect"?"MIDI FX":e==="audio-effect"?"AUDIO FX":e==="instrument"?"INST":e==="rack"?"RACK":"?";return{category:e,categoryLabel:a?.label??r,categoryBadge:a?.badge??i,categorySource:t,categoryConfidence:n,...a?.m4lKind?{m4lKind:a.m4lKind}:{}}}function ga(e){let t=`${e.name} ${e.type}`.toLowerCase(),n=e,a=String(n.deviceType??n.className??n.kind??n.objectType??e.type??"").toLowerCase();return{rawName:t,rawType:a}}function fs(e,t){return e.includes("max midi effect")||t.includes("max midi effect")?"midi":e.includes("max audio effect")||t.includes("max audio effect")?"audio":e.includes("max instrument")||t.includes("max instrument")?"instrument":e.includes("shaper midi")||e.includes("midi monitor")||e.includes("multimap")||e.includes("expression control")||e.includes("sting")?"midi":"unknown"}function fa(e,t){return et(e,is)?!0:t.kind!=="midi"?!1:et(e,os)}function ha(e){return e.devices.findIndex(t=>{let{rawName:n,rawType:a}=ga(t);return a.includes("instrument")?!0:fa(n,e)})}function hs(e,t){if(!t||typeof t!="object")return null;let n=t,a=n.category;if(typeof a!="string"||!["instrument","midi-effect","audio-effect","max-for-live","rack","unknown"].includes(a))return console.warn(`[Ableton Session Mapper] Device classification override invalid category for ${e}.`),null;let i=["high","medium","low"],s=typeof n.confidence=="string"&&i.includes(n.confidence)?n.confidence:"high",o=["midi","audio","instrument","unknown"],l=typeof n.m4lKind=="string"&&o.includes(n.m4lKind)?n.m4lKind:void 0;return{category:a,...typeof n.label=="string"?{label:n.label}:{},...typeof n.badge=="string"?{badge:n.badge}:{},confidence:s,...l?{m4lKind:l}:{},...typeof n.notes=="string"?{notes:n.notes}:{}}}async function bs(e,t){let n=[(0,C.join)(t,"device-classification-overrides.json"),(0,C.join)(e,"config","device-classification-overrides.json")];for(let a of n)if(await nt(a))try{let r=await(0,Ne.readFile)(a,"utf8"),i=JSON.parse(r),s=new Map;for(let[o,l]of Object.entries(i.devices??{})){let c=hs(o,l);c&&s.set(o.trim(),c)}return console.log(`[Ableton Session Mapper] Device classification override loaded: ${a}`),{sourcePath:a,devices:s}}catch(r){return console.warn(`[Ableton Session Mapper] Device classification override invalid: ${a}`,r),{sourcePath:a,devices:new Map}}return console.log("[Ableton Session Mapper] Device classification override missing"),{sourcePath:null,devices:new Map}}function vs(e,t,n,a,r){let{rawName:i,rawType:s}=ga(e),o=r.overrides.devices.get(e.name.trim());if(o)return r.loggedManualMatches.has(e.name)||(console.log(`[Ableton Session Mapper] Device classification manual match: ${e.name}`),r.loggedManualMatches.add(e.name)),V(o.category,"manual",o.confidence??"high",{...o.m4lKind?{m4lKind:o.m4lKind}:{},...o.label?{label:o.label}:{},...o.badge?{badge:o.badge}:{}});if(s.includes("rack")||s.includes("drum")||xe(e))return V("rack",s.includes("rack")||s.includes("drum")?"sdk":"inferred",s.includes("rack")||s.includes("drum")?"high":"medium");let l=ds.some(d=>s.includes(d)),c=cs.some(d=>i.includes(d));if(l||c){!l&&!r.loggedInferredMatches.has(e.name)&&(console.log(`[Ableton Session Mapper] Device classification inferred: ${e.name} -> max-for-live`),r.loggedInferredMatches.add(e.name));let d=fs(i,s),f=i.includes("max midi effect")||i.includes("max audio effect")||i.includes("max instrument")||s.includes("max midi effect")||s.includes("max audio effect")||s.includes("max instrument")||i.includes(".amxd")||s.includes(".amxd")||s.includes("maxdevice")?"high":"medium";return V("max-for-live",l?"sdk":"inferred",f,{m4lKind:d})}return s.includes("instrument")?V("instrument","sdk","high"):s.includes("midi")&&s.includes("effect")?V("midi-effect","sdk","high"):s.includes("audio")&&s.includes("effect")?V("audio-effect","sdk","high"):et(i,ss)?(r.loggedInferredMatches.has(e.name)||(console.log(`[Ableton Session Mapper] Device classification inferred: ${e.name} -> midi-effect`),r.loggedInferredMatches.add(e.name)),V("midi-effect","inferred","high")):fa(i,t)?(r.loggedInferredMatches.has(e.name)||(console.log(`[Ableton Session Mapper] Device classification inferred: ${e.name} -> instrument`),r.loggedInferredMatches.add(e.name)),V("instrument","inferred",t.kind==="midi"?"high":"medium")):et(i,ls)?(r.loggedInferredMatches.has(e.name)||(console.log(`[Ableton Session Mapper] Device classification inferred: ${e.name} -> audio-effect`),r.loggedInferredMatches.add(e.name)),V("audio-effect","inferred","high")):t.kind==="audio"?V("audio-effect","inferred","medium"):t.kind==="midi"&&a>=0?n<a?V("midi-effect","inferred","medium"):n===a?V("instrument","inferred","high"):V("audio-effect","inferred","medium"):(r.loggedUnknownMatches.has(e.name)||(console.log(`[Ableton Session Mapper] Device classification inferred: ${e.name} -> unknown`),r.loggedUnknownMatches.add(e.name)),V("unknown","unknown","low"))}function It(e,t,n,a,r,i){let s=vs(e,t,n,a,i);return{name:e.name,summary:r,isRack:xe(e),...s}}function tt(e){return[...e.tracks.map(t=>({track:t,sectionType:"track"})),...e.returnTracks.map(t=>({track:t,sectionType:"return"})),...e.masterTrack?[{track:e.masterTrack,sectionType:"master"}]:[]]}async function nt(e){try{return await(0,Ne.access)(e),!0}catch{return!1}}async function ks(e){if(console.log("[Ableton Session Mapper] Read latest export metadata started"),!await nt(e))return console.log("[Ableton Session Mapper] Read latest export metadata completed (no export yet)"),{sessionMap:null,status:"missing"};try{let t=await(0,Ne.readFile)(e,"utf8"),n=JSON.parse(t);return console.log("[Ableton Session Mapper] Read latest export metadata completed"),{sessionMap:n,status:"ok"}}catch(t){return console.warn("[Ableton Session Mapper] Internal Viewer could not parse session-map.json.",t),console.log("[Ableton Session Mapper] Read latest export metadata completed (fallback)"),{sessionMap:null,status:"invalid"}}}function xs(e){return e?(console.log("[Ableton Session Mapper] Read latest export metadata started"),console.log("[Ableton Session Mapper] Read latest export metadata completed (fresh export)"),{sessionMap:e,status:"ok"}):null}async function ys(e,t,n,a,r){let i=[{key:"launcher",label:"Open External Launcher",path:r,openLabel:"External Launcher",group:"Core Outputs",quickOpen:!0},{key:"report",label:"Open HTML Report",path:n,openLabel:"HTML Report",group:"Core Outputs",quickOpen:!0},{key:"session-grid",label:"Open Session Grid",path:a,openLabel:"Session Grid",group:"Core Outputs",quickOpen:!0},{key:"json",label:"Open session-map.json",path:t,openLabel:"session-map.json",group:"Core Outputs"},{key:"capability-matrix-html",label:"Open SDK Capability Matrix",path:(0,C.join)(e,"sdk-capability-matrix.html"),openLabel:"SDK Capability Matrix",group:"Diagnostics"},{key:"capability-matrix-json",label:"Open SDK Capability Matrix JSON",path:(0,C.join)(e,"sdk-capability-matrix.json"),openLabel:"SDK Capability Matrix JSON",group:"Diagnostics"},{key:"sdk-diagnostic",label:"Open sdk-diagnostic.json",path:(0,C.join)(e,"sdk-diagnostic.json"),openLabel:"sdk-diagnostic.json",group:"Diagnostics"},{key:"rack-diagnostic",label:"Open rack-diagnostic.json",path:(0,C.join)(e,"rack-diagnostic.json"),openLabel:"rack-diagnostic.json",group:"Diagnostics"},{key:"flow-html",label:"Open Flow",path:(0,C.join)(e,"session-map-mermaid-flow.html"),openLabel:"Flow",group:"Mermaid Flow",quickOpen:!0},{key:"flow-svg",label:"Open Flow SVG",path:(0,C.join)(e,"session-map-flow.svg"),openLabel:"Flow SVG",group:"Mermaid Flow"},{key:"flow-png",label:"Open Flow PNG",path:(0,C.join)(e,"session-map-flow.png"),openLabel:"Flow PNG",group:"Mermaid Flow"},{key:"git-html",label:"Open Git / Metro",path:(0,C.join)(e,"session-map-mermaid-git.html"),openLabel:"Git / Metro",group:"Mermaid Git / Metro",quickOpen:!0},{key:"git-svg",label:"Open Git / Metro SVG",path:(0,C.join)(e,"session-map-git.svg"),openLabel:"Git / Metro SVG",group:"Mermaid Git / Metro"},{key:"git-png",label:"Open Git / Metro PNG",path:(0,C.join)(e,"session-map-git.png"),openLabel:"Git / Metro PNG",group:"Mermaid Git / Metro"},{key:"kanban-html",label:"Open Kanban",path:(0,C.join)(e,"session-map-mermaid-kanban.html"),openLabel:"Kanban",group:"Mermaid Kanban",quickOpen:!0},{key:"kanban-svg",label:"Open Kanban SVG",path:(0,C.join)(e,"session-map-kanban.svg"),openLabel:"Kanban SVG",group:"Mermaid Kanban"},{key:"kanban-png",label:"Open Kanban PNG",path:(0,C.join)(e,"session-map-kanban.png"),openLabel:"Kanban PNG",group:"Mermaid Kanban"}],s=await Promise.all(i.map(async o=>({...o,exists:await nt(o.path)})));return console.log("[Ableton Session Mapper] Internal Viewer files built"),console.log("[Ableton Session Mapper] Internal Viewer files model completed"),s}function ws(e){if(console.log("[Ableton Session Mapper] Internal Viewer outputs model started"),!e)return console.log("[Ableton Session Mapper] Internal Viewer outputs model completed"),{outputs:[],hasMissingRoutingData:!1};let t=tt(e).map(({track:a,sectionType:r})=>({index:a.index,name:a.name,kind:Et(a.kind),midiFrom:"\u2014",midiTo:"\u2014",audioFrom:pa(a.input),audioTo:pa(a.output),monitor:"\u2014",source:"SDK",sends:us(a),sectionType:r})),n=t.length>0&&t.every(a=>a.audioFrom===Ct&&a.audioTo===Ct);return n&&console.log("[Ableton Session Mapper] Internal Viewer missing routing data detected"),console.log("[Ableton Session Mapper] Internal Viewer outputs built"),console.log("[Ableton Session Mapper] Internal Viewer outputs model completed"),{outputs:t,hasMissingRoutingData:n}}function Ss(e,t){if(!e)return console.log("[Ableton Session Mapper] Internal Viewer devices built"),[];let n=tt(e).map(({track:a,sectionType:r})=>{let i=a.devices.filter(c=>xe(c)),s=ha(a),o=a.devices.slice(0,At).map((c,d)=>It(c,a,d,s,ps(c),t));a.devices.length>At&&o.push({name:"More devices",summary:`+${a.devices.length-At} more devices`,isRack:!1,category:"unknown",categoryLabel:"Unknown",categoryBadge:"?",categorySource:"unknown",categoryConfidence:"low"});let l=i.slice(0,$t).map(c=>It(c,a,a.devices.indexOf(c),s,ms(c),t));return i.length>$t&&l.push({name:"More racks",summary:`+${i.length-$t} more racks`,isRack:!0,category:"rack",categoryLabel:"Rack",categoryBadge:"RACK",categorySource:"inferred",categoryConfidence:"medium"}),{index:a.index,name:a.name,kind:Et(a.kind),deviceCount:a.devices.length,rackCount:i.length,deviceItems:o,rackItems:l,sectionType:r}});return console.log("[Ableton Session Mapper] Internal Viewer devices built"),n}function Ms(e,t){if(!ma||!e)return console.log("[Ableton Session Mapper] Internal Viewer session preview built"),console.log("[Ableton Session Mapper] Internal Viewer kanban preview built"),console.log("[Ableton Session Mapper] Internal Viewer metro preview built"),[];let n=tt(e).map(({track:a,sectionType:r})=>{let i=a.devices.filter(l=>xe(l)).length,s=ha(a),o=a.devices.slice(0,Rt).map((l,c)=>It(l,a,c,s,gs(l),t));return a.devices.length>Rt&&o.push({name:"More devices",summary:`+${a.devices.length-Rt} more devices`,isRack:!1,category:"unknown",categoryLabel:"Unknown",categoryBadge:"?",categorySource:"unknown",categoryConfidence:"low"}),{index:a.index,name:a.name,kind:Et(a.kind),sectionType:r,deviceCount:a.devices.length,sendCount:a.sends.length,rackCount:i,deviceCards:o}});return console.log("[Ableton Session Mapper] Internal Viewer session preview built"),console.log("[Ableton Session Mapper] Internal Viewer kanban preview built"),console.log("[Ableton Session Mapper] Internal Viewer metro preview built"),n}function Ts(e,t,n,a){let r=e.sessionMap,i=r?tt(r).map(h=>h.track):[],s=i.reduce((h,y)=>h+y.devices.length,0),o=i.reduce((h,y)=>h+y.devices.filter(T=>xe(T)).length,0),l=i.reduce((h,y)=>h+y.sends.length,0),{outputs:c,hasMissingRoutingData:d}=ws(r),f=Ss(r,a),g=Ms(r,a),k=t.filter(h=>h.quickOpen).map(({key:h,label:y,exists:T})=>({key:h,label:y,exists:T})),u=t.map(({key:h,label:y,path:T,exists:O,group:w})=>({key:h,label:y,fileName:(0,C.basename)(T),exists:O,group:w})),b="Latest export metadata loaded. Use Quick Open or Files to jump to external outputs.",x=null;return e.status==="missing"?(b="No export generated yet. Run Export Session Map first, then reopen this integrated viewer.",x="No export generated yet."):e.status==="invalid"&&(b="Latest session-map.json could not be parsed. Regenerate the export, then reopen this viewer.",x="Latest session-map.json is missing or invalid."),console.log("[Ableton Session Mapper] Internal Viewer tabs mode: css-only"),console.log("[Ableton Session Mapper] Internal Viewer no inline JS tabs"),console.log("[Ableton Session Mapper] Internal Viewer tab model completed"),{appVersion:ke,setName:r?.set.name??null,exportedAt:r?.exportedAt??null,statusMessage:b,warningMessage:x,scanMode:r?.scan.mode??"ultra-safe",metrics:{tracks:r?.tracks.length??0,returns:r?.returnTracks.length??0,devices:s,racks:o,sends:l},quickLinks:k,sessionPreviewColumns:g,outputs:c,connections:[],manualRoutingStatus:r?.manualRouting?.status??"missing",manualRoutingStale:r?.manualRouting?.stale??!1,manualRoutingSetMatch:r?.manualRouting?.setMatch??!1,manualRoutingWarnings:r?.manualRouting?.warnings??[],routingOverridesPath:r?.manualRouting?.sourcePath??"",routingOverridesExists:!1,routingOverridesModifiedAt:r?.manualRouting?.sourceModifiedAt??null,sessionExportComparedAt:r?.manualRouting?.sessionMapModifiedAt??null,missingFromCurrent:r?.manualRouting?.missingFromCurrent??[],missingFromOverrides:r?.manualRouting?.missingFromOverrides??[],sidechains:(r?.manualRouting?.sidechains??[]).map(h=>({targetTrack:h.targetTrack,targetDevice:h.targetDevice,sourceTrack:h.sourceTrack,enabled:h.enabled===!0?"enabled":h.enabled===!1?"disabled":"unknown",notes:h.notes})),deviceTracks:f,files:u,hasExport:e.status==="ok",hasMissingRoutingData:d,internalVisualPreviewEnabled:ma}}async function Ot(e,t,n){let a=await I(e),r=xs(n?.sessionMapOverride);for(;;){let s={overrides:await bs(a.projectRoot,a.exportDirectory),loggedManualMatches:new Set,loggedInferredMatches:new Set,loggedUnknownMatches:new Set},o=await ys(a.exportDirectory,a.sessionMapJsonPath,a.sessionMapHtmlPath,a.sessionGridHtmlPath,a.sessionMapDiagramsPath),l=r??await ks(a.sessionMapJsonPath);r=null;let c=Ts(l,o,a.exportDirectory,s);console.log("[Ableton Session Mapper] Build internal viewer model completed");let d=da(c);console.log(`[Ableton Session Mapper] Internal Viewer requested modal size: ${Pt}x${Dt}`),console.log(`[Ableton Session Mapper] Internal Viewer modal size applied: ${Pt}x${Dt}`),console.log("[Ableton Session Mapper] Internal Viewer modal size may be limited by Live"),console.log("[Ableton Session Mapper] Show internal viewer modal started");let f=e.ui.showModalDialog(`data:text/html,${encodeURIComponent(d)}`,Pt,Dt);console.log("[Ableton Session Mapper] Internal Viewer modal shown");let g=await f;console.log("[Ableton Session Mapper] Show internal viewer modal completed");let k=null;try{k=JSON.parse(g)}catch(b){console.warn("[Ableton Session Mapper] Internal Viewer returned invalid JSON.",b);return}if(k?.action==="refresh")continue;if(k?.action!=="open-link"||!k.key)return;let u=o.find(b=>b.key===k?.key);if(!u){console.warn(`[Ableton Session Mapper] Internal Viewer requested unknown target: ${k.key}`);return}if(console.log(`[Ableton Session Mapper] Open external view requested: ${u.openLabel}`),!u.exists||!await nt(u.path)){console.warn(`[Ableton Session Mapper] Open external view skipped missing file: ${u.path}`);return}try{t(u.path,u.openLabel),console.log(`[Ableton Session Mapper] Open external view completed: ${u.path}`)}catch(b){console.warn("[Ableton Session Mapper] Open external view failed.",b)}return}}var Ps={maxTracks:20,maxDevices:80,maxParameters:200,maxDurationMs:15e3},E={inputType:["inputRoutingType","input_routing_type","currentInputRouting","current_input_routing"],inputChannel:["inputRoutingChannel","input_routing_channel"],outputType:["outputRoutingType","output_routing_type","currentOutputRouting","current_output_routing"],outputChannel:["outputRoutingChannel","output_routing_channel"],sidechain:["sidechain","sideChain","sidechainRouting","sidechain_routing","hasSidechain","has_sidechain"],monitorMode:["monitorMode","monitor_mode","monitoringState","monitoring_state"]};function H(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function jt(e){return e instanceof Error?e.message:String(e)}function je(e){try{return typeof e!="object"||e===null?typeof e:e.constructor?.name??"Object"}catch{return"UnknownObject"}}function _e(e,t=140){return e.length<=t?e:`${e.slice(0,t-1)}\u2026`}function ue(e,t=0,n=new WeakSet){if(e==null)return e??null;if(typeof e=="bigint")return e.toString();if(["string","number","boolean"].includes(typeof e))return e;if(typeof e=="function")return`[Function ${e.name||"anonymous"}]`;if(typeof e!="object")return String(e);if(n.has(e))return"[Circular]";if(n.add(e),t>=2)return`[${je(e)}]`;if(Array.isArray(e))return{length:e.length,items:e.slice(0,8).map(r=>ue(r,t+1,n)),truncated:e.length>8};let a={objectType:je(e)};for(let r of["name","className","type","value"])try{let i=Reflect.get(e,r);if(i===void 0)continue;a[r]=ue(i,t+1,n)}catch{}return a}async function Ds(e,t){try{if(!(t in e))return{exists:!1}}catch(n){return{exists:!1,error:jt(n)}}try{return{exists:!0,value:await Promise.resolve(Reflect.get(e,t))}}catch(n){return{exists:!0,error:jt(n)}}}async function at(e,t){let n=[],a=[],r=!1,i;for(let s of e)for(let o of t){let l=await Ds(s,o);if(l.exists){if(r=!0,i??=o,l.error){a.push(`${o}: ${l.error}`);continue}l.value!==void 0&&l.value!==null&&n.push(l.value)}}return{found:n.length>0,hasProperty:r,...i?{property:i}:{},values:n,errors:a}}function va(e){return Date.now()-e.startedAt>=e.limits.maxDurationMs}async function D(e,t){let n=Date.now();try{let a=await t();return{capability:e,status:a.status,evidence:a.evidence??"",valuePreview:a.valuePreview??null,notes:a.notes??"",durationMs:Date.now()-n,risk:a.risk??"low"}}catch(a){return{capability:e,status:"unknown",evidence:"Probe failed",valuePreview:null,notes:jt(a),durationMs:Date.now()-n,risk:"medium"}}}function K(e,t,n="Skipped in shallow capability mode"){return Promise.resolve({capability:e,status:"not-tested",evidence:n,valuePreview:null,notes:t,durationMs:0,risk:"low"})}function Nt(e,t,n="Disabled in diagnostic mode to protect Live stability"){return Promise.resolve({capability:e,status:"unsafe",evidence:n,valuePreview:null,notes:t,durationMs:0,risk:"high"})}async function As(e){let t=await p(()=>e.application.song,null,"application.song");if(!t)throw new Error("The current Live Set is unavailable.");return t}async function ka(e){return p(()=>Reflect.get(e,"tracks"),[],"song.tracks")}async function xa(e){return p(()=>Reflect.get(e,"returnTracks")??Reflect.get(e,"return_tracks"),[],"song.returnTracks")}async function ya(e){return p(()=>Reflect.get(e,"mainTrack")??Reflect.get(e,"masterTrack")??Reflect.get(e,"master_track"),null,"song.mainTrack")}async function $s(e,t){let n=(await ka(e)).slice(0,t.limits.maxTracks),a=Math.max(0,t.limits.maxTracks-n.length),r=(await xa(e)).slice(0,a),i=a>r.length?await ya(e):null;return[...n.map((s,o)=>({track:s,role:"track",index:o})),...r.map((s,o)=>({track:s,role:"return",index:o})),...i?[{track:i,role:"master",index:0}]:[]]}async function Rs(e){return p(()=>Reflect.get(e,"devices"),[],"track.devices")}async function wa(e,t){let n=[];for(let{track:a}of e){if(n.length>=t.limits.maxDevices||va(t))break;let r=await Rs(a);for(let i of r){if(n.length>=t.limits.maxDevices)break;n.push(i),t.inspectedDevices+=1}}return n}function Cs(e,t){return t==="return"?"return":t==="master"?"master":e instanceof re?"audio":e instanceof ie?"midi":je(e)}async function v(e,t,n,a){return D(e,async()=>{let r=await at(t,n);return r.found?{status:"supported",evidence:`Read via ${r.property??n[0]}`,valuePreview:ue(r.values[0])}:r.hasProperty?{status:"partial",evidence:`Property exists (${r.property??n[0]}) but no stable value was returned`,valuePreview:r.errors.length>0?r.errors:null,notes:a,risk:"medium"}:{status:"unavailable",evidence:"Not exposed by current SDK scan",valuePreview:null,notes:a,risk:"low"}})}function Le(e,t=5){return e.slice(0,t).map(n=>_e(String(n)))}async function Is(e){console.log("[Ableton Session Mapper] Probe Set started");let t=await Promise.all([v("Set name",[e],["name"],"Set name is not exposed on this SDK object."),D("Tempo",async()=>{let n=await p(()=>Reflect.get(e,"tempo"),null,"song.tempo");return typeof n=="number"?{status:"supported",evidence:"Read from song.tempo",valuePreview:n}:{status:"unavailable",evidence:"Not exposed by current SDK scan",valuePreview:null}}),v("Time signature",[e],["signatureNumerator","signature_numerator","timeSignature","time_signature"],"No stable time signature property found."),v("Key / scale",[e],["scaleName","scale_name","key","musicalKey","scale"],"No key/scale property found on the current song object."),D("Arrangement / session info",async()=>{let n=await p(()=>Reflect.get(e,"scenes"),[],"song.scenes"),a=await ka(e);return a.length>0||n.length>0?{status:n.length>0?"supported":"partial",evidence:n.length>0?"Tracks and scenes are readable from the song object":"Tracks readable but scenes missing",valuePreview:{tracks:a.length,scenes:n.length}}:{status:"unavailable",evidence:"No arrangement/session collection found",valuePreview:null}})]);return console.log("[Ableton Session Mapper] Probe Set completed"),{name:"Set",items:t}}async function Es(e){console.log("[Ableton Session Mapper] Probe Tracks started");let t=e.map(i=>i.track),n=await Promise.all(e.map(({track:i})=>p(()=>i.name,null,"track.name"))),a=await Promise.all(t.map(i=>at([i],["groupTrack","group_track"]))),r=await Promise.all([D("Track list",async()=>({status:e.length>0?"supported":"unavailable",evidence:`Read from first ${e.length} tracks`,valuePreview:e.length})),D("Track order",async()=>({status:e.length>0?"supported":"unavailable",evidence:"Order preserved from song.tracks / returnTracks / mainTrack",valuePreview:Le(n.filter(i=>typeof i=="string"))})),D("Track name",async()=>({status:n.some(i=>typeof i=="string"&&i.length>0)?"supported":"partial",evidence:`Read from first ${e.length} tracks`,valuePreview:Le(n.filter(i=>typeof i=="string"))})),D("Track type audio/midi/return/master",async()=>({status:"supported",evidence:"Derived from SDK track classes and role",valuePreview:e.slice(0,6).map(({track:i,role:s})=>Cs(i,s))})),v("Track color",t,["color","colorIndex","color_index"],"Track color is not exposed by the current SDK scan."),v("Mute",t,["mute","muted"],"No stable mute property found."),v("Solo",t,["solo"],"No stable solo property found."),v("Arm",t,["arm","armed"],"No stable arm property found."),v("Fold",t,["isFoldable","is_foldable","foldState","fold_state"],"Fold information is not consistently exposed."),D("Group membership",async()=>{let i=a.filter(o=>o.hasProperty||o.found);if(i.length===0)return{status:"unavailable",evidence:"No groupTrack property found",valuePreview:null};let s=a.filter(o=>o.found).length;return{status:(s>0,"partial"),evidence:`groupTrack property visible on ${i.length}/${e.length} sampled tracks`,valuePreview:{groupedTracks:s},notes:"Only parent-link visibility is tested here.",risk:"medium"}}),D("Parent group",async()=>{let i=await Promise.all(e.slice(0,8).map(async({track:s})=>{let o=await at([s],["groupTrack","group_track"]);return o.found?ue(o.values[0]):null}));return i.some(Boolean)?{status:"partial",evidence:"Parent group links are readable on some tracks",valuePreview:i.filter(Boolean),notes:"Parent group object is visible, but mapping completeness depends on the current Set.",risk:"medium"}:{status:"unavailable",evidence:"No parent group value returned on sampled tracks",valuePreview:null}}),D("Child tracks",async()=>{let i=a.filter(s=>s.found).length;return i>0?{status:"partial",evidence:"Child relationships can be derived indirectly from groupTrack links",valuePreview:{derivedChildren:i},notes:"No direct childTracks collection was found.",risk:"medium"}:{status:"unavailable",evidence:"No direct child tracks collection found",valuePreview:null}})]);return console.log("[Ableton Session Mapper] Probe Tracks completed"),{name:"Tracks",items:r}}async function Os(e,t){console.log("[Ableton Session Mapper] Probe Mixer started");let n=(await Promise.all(t.map(async({track:i})=>p(()=>Reflect.get(i,"mixer"),null,"track.mixer")))).filter(i=>typeof i=="object"&&i!==null),a=t[0]?.track??null,r=await Promise.all([v("Volume",n,["volume"],"Mixer volume is not exposed on sampled tracks."),v("Pan",n,["panning","pan"],"Mixer panning is not exposed on sampled tracks."),D("Sends count",async()=>{if(!a)return{status:"unavailable",evidence:"No sampled track available"};let i=await p(()=>Reflect.get(a,"sends"),[],"track.sends");return{status:Array.isArray(i)?"supported":"unavailable",evidence:"Read from first sampled track",valuePreview:Array.isArray(i)?i.length:null}}),D("Send names",async()=>{if(!a)return{status:"unavailable",evidence:"No sampled track available"};let i=await p(()=>Reflect.get(a,"sends"),[],"track.sends"),s=i.map(o=>typeof o?.name=="string"?o.name:null).filter(o=>!!o);return s.length>0?{status:"supported",evidence:"Read send names from first sampled track",valuePreview:Le(s)}:{status:i.length>0?"partial":"unavailable",evidence:i.length>0?"Send objects exist but names were empty":"No sends on sampled track",valuePreview:null}}),D("Send values",async()=>{if(!a)return{status:"unavailable",evidence:"No sampled track available"};let i=await p(()=>Reflect.get(a,"sends"),[],"track.sends"),s=i.map(o=>typeof o?.value=="number"?o.value:null).filter(o=>o!==null);return s.length>0?{status:"supported",evidence:"Read send values from first sampled track",valuePreview:s.slice(0,8)}:{status:i.length>0?"partial":"unavailable",evidence:i.length>0?"Send objects exist but values were empty":"No sends on sampled track",valuePreview:null}}),D("Return tracks",async()=>{let i=await xa(e);return{status:i.length>=0?"supported":"unavailable",evidence:"Read from song.returnTracks",valuePreview:i.length}}),D("Master track",async()=>{let i=await ya(e);return i?{status:"supported",evidence:"Read from song.mainTrack",valuePreview:ue(i)}:{status:"unavailable",evidence:"No mainTrack returned by song object",valuePreview:null}})]);return console.log("[Ableton Session Mapper] Probe Mixer completed"),{name:"Mixer",items:r}}async function Ns(e){console.log("[Ableton Session Mapper] Probe Routing I/O started");let t=e.map(({track:a})=>a),n=await Promise.all([v("Audio From",t,[...E.inputType,...E.inputChannel],"Not exposed by current SDK scan"),v("Audio To",t,[...E.outputType,...E.outputChannel],"Not exposed by current SDK scan"),v("MIDI From",t,[...E.inputType,...E.inputChannel],"Not exposed by current SDK scan"),v("MIDI To",t,[...E.outputType,...E.outputChannel],"Not exposed by current SDK scan"),v("External In",t,["externalInput","external_input",...E.inputType],"Not exposed by current SDK scan"),v("External Out",t,["externalOutput","external_output",...E.outputType],"Not exposed by current SDK scan"),v("Monitor mode",t,E.monitorMode,"Monitor mode is not exposed by the sampled tracks."),v("Sidechain source",t,E.sidechain,"Sidechain source is not exposed by current SDK scan"),v("Sidechain enabled",t,["hasSidechain","has_sidechain","sidechainEnabled","sidechain_enabled"],"Sidechain enabled state is not exposed by current SDK scan"),v("Group routing",t,["groupTrack","group_track",...E.outputType],"Group routing is not directly exposed."),v("Return routing",t,[...E.outputType],"Return routing is not exposed by current SDK scan"),v("Master routing",t,[...E.outputType],"Master routing is not exposed by current SDK scan")]);return console.log("[Ableton Session Mapper] Probe Routing I/O completed"),{name:"Routing I/O",items:n}}async function js(e,t){console.log("[Ableton Session Mapper] Probe Devices started");let n=await wa(e,t),a=n.map(s=>s),r=[];for(let s of n){if(va(t)||t.inspectedParameters>=t.limits.maxParameters)break;let o=await p(()=>Reflect.get(s,"parameters"),[],"device.parameters");for(let l of o){if(t.inspectedParameters>=t.limits.maxParameters)break;typeof l=="object"&&l!==null&&(r.push(l),t.inspectedParameters+=1)}}let i=await Promise.all([D("Device list",async()=>({status:n.length>0?"supported":"unavailable",evidence:`Read from ${Math.min(e.length,t.limits.maxTracks)} sampled tracks`,valuePreview:n.length})),D("Device order",async()=>({status:n.length>0?"supported":"unavailable",evidence:"Order preserved from track.devices",valuePreview:n.slice(0,8).map(s=>_e(s.name))})),D("Device name",async()=>({status:n.some(s=>typeof s.name=="string"&&s.name.length>0)?"supported":"partial",evidence:`Read from ${n.length} sampled devices`,valuePreview:n.slice(0,8).map(s=>_e(s.name))})),v("Device type/class",a,["className","type"],"Device class/type is not stably exposed on sampled devices."),D("Is rack",async()=>{let s=n.filter(o=>o instanceof J||/rack/i.test(je(o)));return{status:s.length>0?"supported":"partial",evidence:"Derived from RackDevice instances and object type names",valuePreview:s.slice(0,6).map(o=>o.name)}}),v("Device enabled",a,["isActive","is_active","enabled"],"Device enabled state is not consistently exposed."),D("Device parameters",async()=>({status:r.length>0?"supported":"partial",evidence:`Read from up to ${t.limits.maxParameters} sampled parameters`,valuePreview:r.length})),v("Parameter name",r,["name"],"Parameter names are not exposed on sampled parameters."),v("Parameter value",r,["value"],"Parameter values are not exposed on sampled parameters."),v("Parameter min/max",r,["min","max"],"Parameter min/max are not exposed on sampled parameters."),v("Parameter automation state",r,["automationState","automation_state","isAutomated","is_automated"],"Automation state is not exposed on sampled parameters.")]);return console.log("[Ableton Session Mapper] Probe Devices completed"),{name:"Devices",items:i}}async function _s(e,t){console.log("[Ableton Session Mapper] Probe Racks started");let a=(await wa(e,t)).filter(o=>o instanceof J||/rack/i.test(je(o))),r=a.map(o=>o),i=[];for(let o of a){let l=await p(()=>Reflect.get(o,"parameters"),[],"rack.parameters");for(let c of l)typeof c?.name=="string"&&/macro/i.test(c.name)&&i.push(c)}let s=await Promise.all([D("Rack detection",async()=>({status:a.length>0?"supported":"partial",evidence:"Rack-like devices detected from sampled device list",valuePreview:a.slice(0,8).map(o=>_e(o.name))})),v("Rack chains count",r,["chains"],"Chains are not exposed on sampled racks."),D("Chain names",async()=>{let o=[];for(let l of r){let c=await p(()=>Reflect.get(l,"chains"),[],"rack.chains");for(let d of c)typeof d?.name=="string"&&d.name.length>0&&o.push(d.name)}return o.length>0?{status:"partial",evidence:"Chain names readable from shallow rack scan",valuePreview:Le(o)}:{status:r.length>0?"partial":"unavailable",evidence:r.length>0?"Racks found but chain names were empty":"No racks sampled",valuePreview:null}}),Nt("Chain devices","Deep chain-device recursion is intentionally disabled because earlier scans could stall or freeze Live."),Nt("Nested racks","Nested rack recursion remains disabled in capability-matrix mode."),v("Drum rack pads",r,["drumPads","visibleDrumPads","pads"],"Pad collections are not exposed on sampled racks."),D("Pad names",async()=>{let o=[];for(let l of r){let c=await p(()=>Reflect.get(l,"drumPads")??Reflect.get(l,"visibleDrumPads")??Reflect.get(l,"pads"),[],"rack.pads");for(let d of c)typeof d?.name=="string"&&d.name.length>0&&o.push(d.name)}return o.length>0?{status:"partial",evidence:"Pad names readable from shallow pad collections",valuePreview:Le(o)}:{status:r.length>0?"partial":"unavailable",evidence:r.length>0?"Pad collections were empty":"No racks sampled",valuePreview:null}}),Nt("Pad chains","Per-pad chain traversal is intentionally skipped in shallow capability mode."),D("Macro controls",async()=>({status:i.length>0||r.length>0?"partial":"unavailable",evidence:r.length>0?"Scanned shallow rack parameters for names matching Macro":"No racks sampled",valuePreview:i.slice(0,8).map(o=>ue(o)),notes:"Only visible macro-like parameter names are counted here.",risk:"medium"})),v("Rack variations",r,["variations","variation","selectedVariation","selected_variation"],"Rack variations are not exposed on sampled racks.")]);return console.log("[Ableton Session Mapper] Probe Racks completed"),{name:"Racks",items:s}}async function Ls(e){console.log("[Ableton Session Mapper] Probe Clips started");let n=(await p(()=>Reflect.get(e,"scenes"),[],"song.scenes")).filter(r=>typeof r=="object"&&r!==null).slice(0,2),a=await Promise.all([D("Session clips",async()=>{if(n.length===0)return{status:"not-tested",evidence:"No scenes available to probe safely",valuePreview:null,notes:"Result depends on the currently opened Set."};let r=await at(n,["clipSlots","clip_slots"]);return r.found||r.hasProperty?{status:(r.found,"partial"),evidence:`Scene clip-slot collections visible via ${r.property??"clipSlots"}`,valuePreview:ue(r.values[0]??null),notes:"Only shallow clip-slot collections are tested.",risk:"medium"}:{status:"unavailable",evidence:"No clipSlots collection found on sampled scenes",valuePreview:null}}),v("Clip slots",n,["clipSlots","clip_slots"],"Clip-slot collections are not exposed on sampled scenes."),K("Clip names","Clip object traversal is skipped by default to avoid context-dependent scans."),K("Clip colors","Clip color probing is skipped in shallow capability mode."),K("MIDI clip notes","Reading note lists can be expensive and is not part of the default capability scan."),K("Audio clip metadata","Audio clip metadata remains untested in shallow capability mode."),K("Arrangement clips","Arrangement clip traversal is not enabled by default."),K("Clip start/end","Clip timing fields are not traversed in the default safe scan."),K("Loop start/end","Loop timing fields are not traversed in the default safe scan."),K("Warp info","Warp-related clip probing remains disabled by default.")]);return console.log("[Ableton Session Mapper] Probe Clips completed"),{name:"Clips",items:a}}async function Vs(e){console.log("[Ableton Session Mapper] Probe Arrangement started");let t=await Promise.all([v("Arrangement locators",[e],["locators","arrangementLocators","arrangement_locators"],"Arrangement locators are not exposed on the current song object."),K("Arrangement clips","Arrangement clip traversal remains disabled in capability-matrix mode."),K("Automation lanes","Automation-lane probing remains disabled in capability-matrix mode."),v("Selected arrangement region",[e],["selection","arrangementSelection","arrangement_selection"],"Arrangement selection is not exposed on the current song object."),v("Current song position",[e],["currentSongTime","current_song_time","songTime","song_time"],"Current song position is not exposed on the current song object.")]);return console.log("[Ableton Session Mapper] Probe Arrangement completed"),{name:"Arrangement",items:t}}async function Fs(e){console.log("[Ableton Session Mapper] Probe Browser / Files started");let t=await Promise.all([v("Project path",[e],["projectPath","project_path"],"Project path is not exposed on the current song object."),v("Set path",[e],["filePath","file_path","path"],"Set path is not exposed on the current song object."),v("Sample references",[e],["sampleReferences","sample_references"],"Sample references are not exposed on the current song object."),v("Missing media",[e],["missingMedia","missing_media"],"Missing media is not exposed on the current song object."),v("Device preset paths",[e],["presetPath","preset_path","devicePresetPaths"],"Device preset paths are not exposed on the current song object.")]);return console.log("[Ableton Session Mapper] Probe Browser / Files completed"),{name:"Browser / Files",items:t}}function Gs(e){let t={supported:0,partial:0,unavailable:0,unsafe:0,unknown:0,notTested:0};for(let n of e.flatMap(a=>a.items))switch(n.status){case"supported":t.supported+=1;break;case"partial":t.partial+=1;break;case"unavailable":t.unavailable+=1;break;case"unsafe":t.unsafe+=1;break;case"unknown":t.unknown+=1;break;case"not-tested":t.notTested+=1;break}return t}async function Sa(e){console.log("[Ableton Session Mapper] SDK Capability Matrix started");let t=await As(e),n={startedAt:Date.now(),inspectedDevices:0,inspectedParameters:0,limits:Ps},a=await $s(t,n),r=await Promise.all([Is(t),Es(a),Os(t,a),Ns(a),js(a,n),_s(a,n),Ls(t),Vs(t),Fs(t)]),i={version:"0.9.0",generatedAt:new Date().toISOString(),mode:"sdk-capability-matrix",safety:{deepRackScan:!1,recursiveScan:!1,maxTracks:n.limits.maxTracks,maxDevices:n.limits.maxDevices,maxParameters:n.limits.maxParameters,maxDurationMs:n.limits.maxDurationMs},summary:Gs(r),sections:r};return console.log("[Ableton Session Mapper] SDK Capability Matrix completed"),i}function Hs(e){return e==null?"\u2014":typeof e=="string"?e:JSON.stringify(e)}function ba(e){return`status-${e}`}function Ma(e){let t=[["supported",e.summary.supported],["partial",e.summary.partial],["unavailable",e.summary.unavailable],["unsafe",e.summary.unsafe],["unknown",e.summary.unknown],["not-tested",e.summary.notTested]].map(([a,r])=>`<article class="metric-card ${ba(a)}">
        <strong>${r}</strong>
        <span>${H(String(a))}</span>
      </article>`).join(""),n=e.sections.map(a=>`<section class="section-card">
        <header class="section-head">
          <h2>${H(a.name)}</h2>
          <span>${a.items.length} capabilities</span>
        </header>
        <div class="table-shell">
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Notes</th>
                <th>Duration</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              ${a.items.map(r=>`<tr>
                    <td>
                      <strong>${H(r.capability)}</strong>
                      <div class="preview">${H(_e(Hs(r.valuePreview),120))}</div>
                    </td>
                    <td><span class="status-badge ${ba(r.status)}">${H(r.status)}</span></td>
                    <td>${H(r.evidence||"\u2014")}</td>
                    <td>${H(r.notes||"\u2014")}</td>
                    <td>${r.durationMs} ms</td>
                    <td>${H(r.risk)}</td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </section>`).join("");return`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SDK Capability Matrix</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #121212;
      --panel: #1d1d1d;
      --panel-2: #252525;
      --border: rgba(255,255,255,0.08);
      --text: #f2efe8;
      --muted: #aaa59c;
      --accent: #f5a623;
      --supported: #53c26b;
      --partial: #e4bf54;
      --unavailable: #8f8f8f;
      --unsafe: #f18d32;
      --unknown: #7a7a7a;
      --not-tested: #6d8fb7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top right, rgba(245,166,35,0.10), transparent 28%),
        linear-gradient(180deg, #252525, #121212);
      color: var(--text);
      padding: 24px;
    }
    .page {
      max-width: 1440px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }
    .hero, .summary, .section-card, .safety-card {
      background: rgba(29,29,29,0.95);
      border: 1px solid var(--border);
      border-radius: 18px;
    }
    .hero, .safety-card, .section-card { padding: 18px; }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 11px;
    }
    h1, h2 { margin: 0; }
    .hero p, .safety-card p, .section-head span { color: var(--muted); }
    .summary {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 1px;
      padding: 1px;
      background: rgba(255,255,255,0.04);
    }
    .metric-card {
      background: var(--panel);
      padding: 16px 12px;
      text-align: center;
    }
    .metric-card strong { display: block; font-size: 26px; margin-bottom: 4px; }
    .metric-card span { text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: var(--muted); }
    .status-supported { color: var(--supported); }
    .status-partial { color: var(--partial); }
    .status-unavailable { color: var(--unavailable); }
    .status-unsafe { color: var(--unsafe); }
    .status-unknown { color: var(--unknown); }
    .status-not-tested { color: var(--not-tested); }
    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;
    }
    .table-shell { overflow: auto; border-radius: 14px; border: 1px solid var(--border); }
    table { width: 100%; min-width: 980px; border-collapse: collapse; background: var(--panel); }
    th, td { padding: 12px; text-align: left; vertical-align: top; }
    th {
      background: var(--panel-2);
      color: var(--accent);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    td { border-top: 1px solid rgba(255,255,255,0.05); font-size: 13px; line-height: 1.45; }
    .status-badge {
      display: inline-flex;
      border-radius: 999px;
      padding: 4px 8px;
      border: 1px solid currentColor;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
    }
    .preview {
      margin-top: 6px;
      color: var(--muted);
      font-size: 11px;
      overflow-wrap: anywhere;
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <p class="eyebrow">SDK Capability Matrix</p>
      <h1>Ability map of the current Ableton Extensions SDK surface</h1>
      <p>Generated at ${H(e.generatedAt)} \xB7 mode: ${H(e.mode)}</p>
    </section>

    <section class="summary">
      ${t}
    </section>

    <section class="safety-card">
      <h2>Safety guardrails</h2>
      <p>deepRackScan=${String(e.safety.deepRackScan)} \xB7 recursiveScan=${String(e.safety.recursiveScan)} \xB7 maxTracks=${e.safety.maxTracks} \xB7 maxDevices=${e.safety.maxDevices} \xB7 maxParameters=${e.safety.maxParameters} \xB7 maxDurationMs=${e.safety.maxDurationMs}</p>
    </section>

    ${n}
  </div>
</body>
</html>`}function Ta(e){let t=[];t.push("# SDK Capability Matrix"),t.push(""),t.push(`Generated at: ${e.generatedAt}`),t.push(""),t.push("## Summary"),t.push(""),t.push("| Status | Count |"),t.push("| --- | ---: |"),t.push(`| supported | ${e.summary.supported} |`),t.push(`| partial | ${e.summary.partial} |`),t.push(`| unavailable | ${e.summary.unavailable} |`),t.push(`| unsafe | ${e.summary.unsafe} |`),t.push(`| unknown | ${e.summary.unknown} |`),t.push(`| not-tested | ${e.summary.notTested} |`),t.push("");for(let n of e.sections){t.push(`## ${n.name}`),t.push(""),t.push("| Capability | Status | Evidence | Notes | Duration | Risk |"),t.push("| --- | --- | --- | --- | ---: | --- |");for(let a of n.items)t.push(`| ${a.capability.replaceAll("|","\\|")} | ${a.status} | ${String(a.evidence||"\u2014").replaceAll("|","\\|")} | ${String(a.notes||"\u2014").replaceAll("|","\\|")} | ${a.durationMs} ms | ${a.risk} |`);t.push("")}t.push("## Supported"),t.push("");for(let n of e.sections.flatMap(a=>a.items).filter(a=>a.status==="supported"))t.push(`- ${n.capability}`);t.push(""),t.push("## Partial"),t.push("");for(let n of e.sections.flatMap(a=>a.items).filter(a=>a.status==="partial"))t.push(`- ${n.capability}`);t.push(""),t.push("## Unavailable"),t.push("");for(let n of e.sections.flatMap(a=>a.items).filter(a=>a.status==="unavailable"))t.push(`- ${n.capability}`);t.push(""),t.push("## Unsafe"),t.push("");for(let n of e.sections.flatMap(a=>a.items).filter(a=>a.status==="unsafe"))t.push(`- ${n.capability}`);t.push(""),t.push("## Unknown / Not tested"),t.push("");for(let n of e.sections.flatMap(a=>a.items).filter(a=>a.status==="unknown"||a.status==="not-tested"))t.push(`- ${n.capability} (${n.status})`);return t.push(""),`${t.join(`
`)}
`}var pe=require("node:fs/promises"),_t=require("node:path"),Ks="routing-overrides.json";function zs(e=null){return{kind:e,midiFrom:null,midiTo:null,audioFrom:null,audioTo:null,monitor:null,sends:{},group:null,notes:""}}function Bs(e,t){let n=zs(t?.kind??null),a=t?.sends&&typeof t.sends=="object"&&!Array.isArray(t.sends)?Object.fromEntries(Object.entries(t.sends).map(([r,i])=>[r,typeof i=="number"?i:null])):{};return{kind:t?.kind??n.kind,midiFrom:typeof t?.midiFrom=="string"?t.midiFrom:null,midiTo:typeof t?.midiTo=="string"?t.midiTo:null,audioFrom:typeof t?.audioFrom=="string"?t.audioFrom:null,audioTo:typeof t?.audioTo=="string"?t.audioTo:null,monitor:typeof t?.monitor=="string"?t.monitor:null,sends:a,group:typeof t?.group=="string"?t.group:null,notes:typeof t?.notes=="string"?t.notes:""}}function Js(e){return Array.isArray(e)?e.filter(t=>t&&typeof t=="object").map(t=>({targetTrack:typeof t.targetTrack=="string"?t.targetTrack:"",targetDevice:typeof t.targetDevice=="string"?t.targetDevice:"",sourceTrack:typeof t.sourceTrack=="string"?t.sourceTrack:"",enabled:typeof t.enabled=="boolean"?t.enabled:(t.enabled===null,null),notes:typeof t.notes=="string"?t.notes:""})).filter(t=>t.targetTrack.length>0||t.sourceTrack.length>0||t.targetDevice.length>0):[]}function Us(e){return Array.isArray(e)?e.filter(t=>t&&typeof t=="object").map(t=>({from:typeof t.from=="string"?t.from:"",to:typeof t.to=="string"?t.to:"",type:t.type==="audio"||t.type==="midi"||t.type==="sidechain"||t.type==="unknown"?t.type:"unknown",label:typeof t.label=="string"?t.label:""})).filter(t=>t.from.length>0||t.to.length>0||t.label.length>0):[]}function Ws(e){return(0,_t.join)(e,Ks)}async function Da(e){let t=Ws(e),n=(0,_t.join)(e,"session-map.json");console.log("[Ableton Session Mapper] Load routing overrides started");try{await(0,pe.access)(t)}catch{return console.log("[Ableton Session Mapper] Routing overrides missing"),{status:"missing",stale:!1,setMatch:!1,sourcePath:t,sourceModifiedAt:null,sessionMapModifiedAt:null,currentTrackCount:0,overrideTrackCount:0,missingFromCurrent:[],missingFromOverrides:[],warnings:[],tracks:{},sidechains:[],connections:[]}}try{let[a,r]=await Promise.all([(0,pe.stat)(t),(0,pe.stat)(n).catch(()=>null)]),i=await(0,pe.readFile)(t,"utf8"),s=JSON.parse(i),o=[];s.version&&s.version!=="1.0.0"&&o.push(`routing-overrides.json version ${s.version} differs from expected 1.0.0`),s.source&&s.source!=="manual-routing-overrides"&&o.push(`routing-overrides.json source is ${s.source}, expected manual-routing-overrides`);let l=Object.fromEntries(Object.entries(s.tracks??{}).map(([c,d])=>[c,Bs(c,d)]));return console.log("[Ableton Session Mapper] Routing overrides loaded"),{status:"loaded",stale:!1,setMatch:!1,sourcePath:t,sourceModifiedAt:a.mtime.toISOString(),sessionMapModifiedAt:r?.mtime.toISOString()??null,currentTrackCount:0,overrideTrackCount:Object.keys(l).length,missingFromCurrent:[],missingFromOverrides:[],warnings:o,tracks:l,sidechains:Js(s.sidechains),connections:Us(s.connections)}}catch(a){let r=a instanceof Error?a.message:String(a);return console.warn(`[Ableton Session Mapper] Routing overrides invalid: ${r}`),{status:"invalid",stale:!1,setMatch:!1,sourcePath:t,sourceModifiedAt:null,sessionMapModifiedAt:null,currentTrackCount:0,overrideTrackCount:0,missingFromCurrent:[],missingFromOverrides:[],warnings:[`routing-overrides.json invalid: ${r}`],tracks:{},sidechains:[],connections:[]}}}function Xs(e){return!!(e.input.type||e.input.channel||e.output.type||e.output.channel)}function Pa(e,t){let n=[e,t].filter(a=>!!(a&&a.trim().length>0));return n.length>0?n.join(" / "):null}function qs(e,t){return t?{source:"manual",audioFrom:t.audioFrom,audioTo:t.audioTo,midiFrom:t.midiFrom,midiTo:t.midiTo,monitor:t.monitor,group:t.group,notes:t.notes}:Xs(e)?{source:"sdk",audioFrom:Pa(e.input.type,e.input.channel),audioTo:Pa(e.output.type,e.output.channel),midiFrom:null,midiTo:null,monitor:null,group:null,notes:""}:{source:"none",audioFrom:null,audioTo:null,midiFrom:null,midiTo:null,monitor:null,group:null,notes:""}}function Ys(e){return[...e.tracks,...e.returnTracks,...e.masterTrack?[e.masterTrack]:[]]}function Zs(e,t){console.log("[Ableton Session Mapper] Routing overrides health check started");let n=[...t.warnings],a=Ys(e),r=a.map(u=>u.name),i=Object.keys(t.tracks),s=new Set(r),o=new Set(i),l=u=>{n.includes(u)||n.push(u)},c=a.map(u=>u.name).filter((u,b,x)=>x.indexOf(u)!==b);for(let u of new Set(c))l(`Manual routing override may be ambiguous because track name is duplicated: ${u}`);let d=i.filter(u=>!s.has(u)),f=r.filter(u=>!o.has(u));for(let u of d)s.has(u)||l(`Manual routing override references missing track: ${u}`);f.length>0&&l(`Current Set has tracks missing from routing-overrides.json: ${f.join(", ")}`);for(let u of t.connections)u.from&&!s.has(u.from)&&l(`Manual connection source missing: ${u.from}`),u.to&&!s.has(u.to)&&l(`Manual connection target missing: ${u.to}`);for(let u of t.sidechains)u.sourceTrack&&!s.has(u.sourceTrack)&&l(`Manual sidechain source missing: ${u.sourceTrack}`),u.targetTrack&&!s.has(u.targetTrack)&&l(`Manual sidechain target missing: ${u.targetTrack}`);console.log("[Ableton Session Mapper] Routing overrides mtime checked");let g=t.status==="loaded"&&!!(t.sourceModifiedAt&&t.sessionMapModifiedAt)&&new Date(t.sourceModifiedAt).getTime()<new Date(t.sessionMapModifiedAt).getTime();g&&l("routing-overrides.json is older than session-map.json. Run npm run refresh:routing-overrides.");let k=d.length===0&&f.length===0;return console.log(`[Ableton Session Mapper] Routing overrides stale: ${g}`),console.log(`[Ableton Session Mapper] Routing overrides set match: ${k}`),console.log(`[Ableton Session Mapper] Missing override tracks: ${d.length}`),console.log(`[Ableton Session Mapper] Missing current tracks in overrides: ${f.length}`),console.log("[Ableton Session Mapper] Routing overrides health check completed"),{warnings:n,setMatch:k,stale:g,missingFromCurrent:d,missingFromOverrides:f,currentTrackCount:r.length,overrideTrackCount:i.length}}function Aa(e,t){console.log("[Ableton Session Mapper] Merge manual routing started");let n=Zs(e,t),a=i=>({...i,routing:qs(i,t.tracks[i.name])}),r={...e,manualRouting:{...t,stale:n.stale,setMatch:n.setMatch,currentTrackCount:n.currentTrackCount,overrideTrackCount:n.overrideTrackCount,missingFromCurrent:n.missingFromCurrent,missingFromOverrides:n.missingFromOverrides,warnings:n.warnings},tracks:e.tracks.map(a),returnTracks:e.returnTracks.map(a),masterTrack:e.masterTrack?a(e.masterTrack):null};return console.log("[Ableton Session Mapper] Merge manual routing completed"),console.log(`[Ableton Session Mapper] Manual routing warnings: ${n.warnings.length}`),r}var Qs=["name","className","chains","chain","children","devices","drumPads","visibleDrumPads","pads","selectedChain","chainSelector","mixer","canonicalParent","parent","parameters","canHaveChains","can_have_chains"],eo=["name","devices","mixer","receivingNote","note","midiNote"];function te(e){try{return typeof e!="object"||e===null?typeof e:e.constructor?.name??"Object"}catch{return"UnknownObject"}}function to(e){let t=new Set,n=e;for(let a=0;a<8&&n;a+=1)try{for(let r of Object.getOwnPropertyNames(n))r!=="constructor"&&t.add(r);if(n=Object.getPrototypeOf(n),!n||n===Object.prototype)break}catch{break}return[...t].sort()}function Lt(e){if(e==null)return e??null;if(typeof e=="bigint")return e.toString();if(typeof e=="function")return`[Function ${e.name||"anonymous"}]`;if(typeof e!="object")return e;if(Array.isArray(e))return{length:e.length,items:e.slice(0,24).map(n=>Lt(n)),truncated:e.length>24};let t={objectType:te(e)};for(let n of["handle","name","value","className"])try{let a=Reflect.get(e,n);if(a===void 0)continue;n==="handle"&&typeof a=="object"&&a!==null?t.handleId=Reflect.get(a,"id")?.toString()??null:t[n]=Lt(a)}catch{}return t}async function Ra(e,t){if(!await p(()=>t in e,!1,`${te(e)}.${t}.exists`))return{property:t,status:"missing"};try{let a=await Promise.resolve(Reflect.get(e,t));return{property:t,status:"available",value:Lt(a)}}catch(a){return{property:t,status:"error",error:a instanceof Error?a.message:String(a)}}}async function Ft(e){return(await p(()=>Reflect.get(e,"handle"),void 0,`${te(e)}.handle`))?.id?.toString()??null}function no(e){if(typeof e!="number"||!Number.isFinite(e))return null;let n=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][(e%12+12)%12],a=Math.floor(e/12)-2;return`${n}${a}`}async function Vt(e,t){for(let n of t){let a=await p(()=>Reflect.get(e,n),void 0,`${te(e)}.${n}`);if(Array.isArray(a))return a.filter(r=>typeof r=="object"&&r!==null)}return[]}async function $a(e,t){let n=await p(()=>Reflect.get(e,"name"),void 0,`${te(e)}.name`),a=await p(async()=>{for(let i of["receivingNote","note","midiNote"]){let s=Reflect.get(e,i);if(typeof s=="number")return s}return null},null,`${te(e)}.note`),r=await Vt(e,["devices"]);return{id:await Ft(e),name:n??null,objectType:te(e),index:t,note:no(a),deviceCount:r.length,properties:await Promise.all(eo.map(i=>Ra(e,i)))}}async function ao(e,t,n,a,r,i){let s=await Vt(e,["chains","chain"]),o=await Vt(e,["drumPads","visibleDrumPads","pads","children"]);return{id:await Ft(e),name:await p(()=>e.name,null,"rack.name"),objectType:te(e),trackId:n,trackName:t,trackRole:a,trackIndex:r,deviceIndex:i,availableProperties:to(e),properties:await Promise.all(Qs.map(l=>Ra(e,l))),chains:await Promise.all(s.map((l,c)=>$a(l,c))),pads:await Promise.all(o.map((l,c)=>$a(l,c)))}}function ro(e){let t=te(e);return/rack/i.test(t)}function io(e){return e.reduce((t,n)=>t+n.properties.filter(a=>a.status==="error").length+n.chains.reduce((a,r)=>a+r.properties.filter(i=>i.status==="error").length,0)+n.pads.reduce((a,r)=>a+r.properties.filter(i=>i.status==="error").length,0),0)}async function Ca(e){let t=await p(()=>e.application.song,null,"application.song");if(!t)throw new Error("The current Live Set is unavailable.");let n=await p(()=>t.tracks,[],"song.tracks"),a=await p(()=>t.returnTracks,[],"song.returnTracks"),r=await p(()=>t.mainTrack,null,"song.mainTrack"),i=[],s=async(o,l,c)=>{let d=await p(()=>c.name,null,"track.name"),f=await Ft(c),g=await p(()=>c.devices,[],"track.devices");for(let[k,u]of g.entries())ro(u)&&i.push(await ao(u,d,f,o,l,k))};return await Promise.all(n.map((o,l)=>s("track",l,o))),await Promise.all(a.map((o,l)=>s("return",l,o))),r&&await s("master",0,r),{version:"0.4.0",generatedAt:new Date().toISOString(),sdkApiVersion:"1.0.0",summary:{racksInspected:i.length,chainsFound:i.reduce((o,l)=>o+l.chains.length,0),padsFound:i.reduce((o,l)=>o+l.pads.length,0),propertyErrors:io(i)},racks:i}}var so=["name","mute","solo","arm","mutedViaSolo","groupTrack","group_track","isFoldable","is_foldable","devices","mixer","mixerDevice","mixer_device","inputRoutingType","input_routing_type","currentInputRouting","current_input_routing","inputRoutingChannel","input_routing_channel","availableInputRoutingTypes","available_input_routing_types","availableInputRoutingChannels","available_input_routing_channels","outputRoutingType","output_routing_type","currentOutputRouting","current_output_routing","outputRoutingChannel","output_routing_channel","availableOutputRoutingTypes","available_output_routing_types","availableOutputRoutingChannels","available_output_routing_channels","sends","sidechain","sideChain","sidechainRouting","sidechain_routing"],oo=["name","parameters","chains","canHaveChains","can_have_chains","className","type","isActive","is_active","sidechain","sideChain","hasSidechain","has_sidechain","sidechainRouting","sidechain_routing","inputRoutingType","input_routing_type","inputRoutingChannel","input_routing_channel"],lo=["volume","panning","sends","crossfader","cueVolume","cue_volume","inputRoutingType","input_routing_type","outputRoutingType","output_routing_type","sidechain","sideChain","sidechainRouting","sidechain_routing"],co=["devices","mixer","mixerDevice","mixer_device","name","receivingNote","receiving_note","sends","inputRoutingType","input_routing_type","outputRoutingType","output_routing_type","sidechain","sideChain"],uo=["tempo","tracks","returnTracks","return_tracks","mainTrack","masterTrack","master_track","scenes","name","filePath","file_path"];function Ht(e){return e instanceof Error?e.message:String(e)}function rt(e){try{return typeof e!="object"||e===null?typeof e:e.constructor?.name??"Object"}catch{return"UnknownObject"}}function Ve(e){let t=new Set;try{for(let a of Object.getOwnPropertyNames(e))t.add(a)}catch{}let n=e;for(let a=0;a<8&&n;a+=1)try{if(n=Object.getPrototypeOf(n),!n||n===Object.prototype)break;for(let r of Object.getOwnPropertyNames(n))r!=="constructor"&&t.add(r)}catch{break}return[...t].sort()}function Kt(e,t=0,n=new WeakSet){if(e==null)return e??null;if(typeof e=="bigint")return e.toString();if(["string","number","boolean"].includes(typeof e))return e;if(typeof e=="function")return`[Function ${e.name||"anonymous"}]`;if(typeof e!="object")return String(e);if(n.has(e))return"[Circular]";if(n.add(e),t>=2)return`[${rt(e)}]`;if(Array.isArray(e))return{length:e.length,items:e.slice(0,64).map(r=>Kt(r,t+1,n)),truncated:e.length>64};let a={objectType:rt(e)};for(let r of["handle","id","name","value","type","channel"])try{let i=Reflect.get(e,r);if(i===void 0)continue;if(r==="handle"&&typeof i=="object"&&i!==null){let s=Reflect.get(i,"id");a.handleId=typeof s=="bigint"?s.toString():s}else a[r]=Kt(i,t+1,n)}catch(i){a[`${r}Error`]=Ht(i)}return a}async function se(e,t){let n=!1;try{n=t in e}catch(a){return{diagnostic:{property:t,status:"error",error:Ht(a)}}}if(!n)return{diagnostic:{property:t,status:"missing"}};try{let a=await Promise.resolve(Reflect.get(e,t));return{rawValue:a,diagnostic:{property:t,status:"available",value:Kt(a)}}}catch(a){return{diagnostic:{property:t,status:"error",error:Ht(a)}}}}async function Fe(e,t){return Promise.all(t.map(async n=>(await se(e,n)).diagnostic))}async function Ge(e){let t=await se(e,"handle"),n=await se(e,"name"),a=null;try{a=t.rawValue?.id?.toString()??null}catch{a=null}return{objectType:rt(e),id:a,name:typeof n.rawValue=="string"?n.rawValue:null}}async function Ia(e){return e?{...await Ge(e),availableProperties:Ve(e),properties:await Fe(e,lo)}:null}async function Ea(e,t){let n=await se(e,"chains"),a=Array.isArray(n.rawValue)?n.rawValue:[],r=await Promise.all(a.map((i,s)=>po(i,s)));return{...await Ge(e),index:t,isRack:e instanceof J||n.diagnostic.status==="available",availableProperties:Ve(e),properties:await Fe(e,oo),chains:r}}async function po(e,t){let n=await se(e,"devices"),a=await se(e,"mixer"),r=Array.isArray(n.rawValue)?await Promise.all(n.rawValue.map((i,s)=>Ea(i,s))):[];return{...await Ge(e),index:t,availableProperties:Ve(e),properties:await Fe(e,co),devices:r,mixer:await Ia(typeof a.rawValue=="object"&&a.rawValue!==null?a.rawValue:null)}}async function Gt(e,t,n){let a=await se(e,"devices"),r=await se(e,"mixer"),i=Array.isArray(a.rawValue)?await Promise.all(a.rawValue.map((o,l)=>Ea(o,l))):[],s=e instanceof re?"AudioTrack":e instanceof ie?"MidiTrack":rt(e);return{...await Ge(e),index:t,role:n,detectedType:n==="return"?"ReturnTrack":n==="master"?"MasterTrack":s,availableProperties:Ve(e),properties:await Fe(e,so),devices:i,mixer:await Ia(typeof r.rawValue=="object"&&r.rawValue!==null?r.rawValue:null)}}function Oa(e){return e.reduce((t,n)=>t+1+n.chains.reduce((a,r)=>a+Oa(r.devices),0),0)}function Na(e){return e.reduce((t,n)=>t+n.chains.length+n.chains.reduce((a,r)=>a+Na(r.devices),0),0)}function ja(e){return e.reduce((t,n)=>t+(n.isRack?1:0)+n.chains.reduce((a,r)=>a+ja(r.devices),0),0)}function zt(e,t){if(Array.isArray(e))return e.reduce((a,r)=>a+zt(r,t),0);if(typeof e!="object"||e===null)return 0;let n=e;return(n.status===t?1:0)+Object.values(n).reduce((a,r)=>a+zt(r,t),0)}function mo(e){let t=/(input|output).*routing|routing.*(type|channel)|sidechain/i;return e.reduce((n,a)=>n+a.properties.filter(r=>t.test(r.property)&&r.status==="available"&&r.value!==null&&r.value!==void 0).length,0)}async function _a(e){let t=await p(()=>e.application.song,null,"application.song");if(!t)throw new Error("The current Live Set is unavailable.");let n=await p(()=>t.tracks,[],"song.tracks"),a=await p(()=>t.returnTracks,[],"song.returnTracks"),r=await p(()=>t.mainTrack,null,"song.mainTrack"),i=[...await Promise.all(n.map((l,c)=>Gt(l,c,"track"))),...await Promise.all(a.map((l,c)=>Gt(l,c,"return"))),...r?[await Gt(r,0,"master")]:[]],s={...await Ge(t),availableProperties:Ve(t),properties:await Fe(t,uo)},o={song:s,tracks:i};return{version:"0.3.0",generatedAt:new Date().toISOString(),sdkApiVersion:"1.0.0",summary:{tracksInspected:i.length,routingsFound:mo(i),devicesInspected:i.reduce((l,c)=>l+Oa(c.devices),0),racksDetected:i.reduce((l,c)=>l+ja(c.devices),0),chainsDetected:i.reduce((l,c)=>l+Na(c.devices),0),propertyErrors:zt(o,"error")},song:s,tracks:i}}var go=12,fo=0,ho="ultra-safe",bo=!1,vo=!1,La=32,ko=64,Ga=500,xo=1e4,yo=/^(Device On|Chain Selector|Chain Volume|Chain Pan|Volume|Pan|Panning|Dry\/Wet|Output|Input|On|Activator)$/i,wo=/(^|\s)Macro(\s|$|\s*\d+)/i,So=["chains","chain"];function Ha(){return{totalScannedDevices:0,partial:!1,warnings:[],deadlineAt:Date.now()+xo}}function st(e,t){e.partial=!0,e.warnings.includes(t)||e.warnings.push(t),console.warn(`[Ableton Session Mapper] ${t}`)}function oe(e){return Date.now()>=e.deadlineAt}function it(e){return e?.id.toString()??"unknown"}async function Mo(e,t){for(let n of t){let a=await p(()=>Reflect.get(e,n),void 0,`${e.constructor.name}.${n}`);if(typeof a=="boolean")return a}return null}async function Bt(e,t){return p(()=>Reflect.get(e,t),void 0,`${e.constructor.name}.${t}`)}async function To(e,t){for(let n of t){let a=await Bt(e,n);if(Array.isArray(a))return a.filter(r=>typeof r=="object"&&r!==null)}return[]}async function Va(e,t){for(let n of t){let a=await Bt(e,n);if(typeof a=="number"&&Number.isFinite(a))return a}return null}async function Po(e){let{parameter:t,index:n,name:a,isMacro:r}=e,i=await p(()=>t.handle,null,"parameter.handle");return{id:it(i),index:n,name:a,value:await p(()=>t.getValue(),null,`parameter.${a}.value`),min:await p(()=>t.min,null,`parameter.${a}.min`),max:await p(()=>t.max,null,`parameter.${a}.max`),isQuantized:await p(()=>t.isQuantized,null,`parameter.${a}.isQuantized`),isMacro:r}}async function Do(e){let t=await p(()=>e.parameters,[],"device.parameters"),n=await Promise.all(t.map(async(c,d)=>{let f=await p(()=>c.name,`Parameter ${d+1}`,"parameter.name");return{parameter:c,index:d,name:f,isMacro:wo.test(f)}})),a=n.find(c=>/^(Device On|Device Activator|On|Activator)$/i.test(c.name)),r=a?await p(()=>a.parameter.getValue(),null,`parameter.${a.name}.value`):null,i=typeof r=="number"?r>0:null,s=n.filter(c=>c.isMacro),o=n.filter(c=>!c.isMacro&&!yo.test(c.name)),l=[...s,...o].filter((c,d,f)=>f.findIndex(g=>g.parameter===c.parameter)===d).slice(0,go);return{parameters:await Promise.all(l.map(Po)),enabled:i}}async function Ao(e,t){let n=await Bt(e,"name"),a=await Va(e,["receivingNote"]),r=await Va(e,["note","midiNote"]),i=await p(()=>Reflect.get(e,"devices"),void 0,`${e.constructor.name}.devices`);return{index:t,name:typeof n=="string"&&n.length>0?n:`Chain ${String(t+1).padStart(2,"0")}`,note:r,receivingNote:a,deviceCount:Array.isArray(i)?i.length:null}}async function Fa(e,t){let n=[];for(let[a,r]of e.slice(0,t).entries())n.push(await Ao(r,a));return{count:e.length,items:n}}async function $o(e,t,n){console.log(`[Ableton Session Mapper] Scan rack summary started: ${t}`);let a=await To(e,So),r=await Fa(a,La),i=e.constructor.name==="DrumRack"?{count:a.length,items:(await Fa(a,ko)).items.map(s=>({...s,note:s.receivingNote??s.note}))}:null;return a.length>La&&st(n,`Rack summary truncated for ${t}`),console.log(`[Ableton Session Mapper] Scan rack summary completed: ${t} (chains=${r.count}, pads=${i?.count??0})`),{chainsSummary:r,padsSummary:i}}async function Ro(e,t,n){let a=await p(()=>e.handle,null,"device.handle"),r=await p(()=>e.constructor.name,"Device","device.type"),i=await p(()=>e.name,"Unnamed device","device.name");if(oe(n))return st(n,"Global scan timeout"),{id:it(a),index:t,name:i,type:r,enabled:null,parameters:[],chains:[],pads:[],scanStatus:"partial",scanWarning:"Global scan timeout",chainsSummary:null,padsSummary:null};if(n.totalScannedDevices+=1,n.totalScannedDevices>Ga)return st(n,"Global scanned device limit reached"),{id:it(a),index:t,name:i,type:r,enabled:null,parameters:[],chains:[],pads:[],scanStatus:"partial",scanWarning:"Global scanned device limit reached",chainsSummary:null,padsSummary:null};let s=await Do(e),o=await Mo(e,["isActive","active","enabled"]),l=e instanceof J||/rack/i.test(r),c=l?await $o(e,i,n):{chainsSummary:null,padsSummary:null};return{id:it(a),index:t,name:i,type:r,enabled:o??s.enabled,parameters:s.parameters,chains:[],pads:[],scanStatus:l?"summary":"complete",scanWarning:null,chainsSummary:c.chainsSummary,padsSummary:c.padsSummary}}async function Ka(e,t){if(!e?.length)return[];let n=[];for(let[a,r]of e.entries()){if(oe(t)){st(t,"Global scan timeout");break}n.push(await Ro(r,a,t))}return n}function za(e){return{mode:ho,maxDeviceDepth:fo,scanInternalChainDevices:bo,scanNestedRacks:vo,partial:e.partial,warnings:[...e.warnings],totalScannedDevices:e.totalScannedDevices,maxTotalScannedDevices:Ga}}var Ba=()=>({type:null,channel:null});async function Jt(e){return Ba()}async function Ut(e){return Ba()}async function Wt(e){let t=await p(()=>e.mixer,null,"track.mixer");if(!t)return[];let n=await p(()=>t.sends,[],"track.mixer.sends");return Promise.all(n.map(async(a,r)=>({id:(await p(()=>a.handle,null,"send.handle"))?.id.toString()??`send-${r}`,index:r,name:await p(()=>a.name,`Send ${r+1}`,"send.name"),value:await p(()=>a.getValue(),null,"send.value")})))}async function ye(e){return e?(await p(()=>e.handle,null,"track.handle"))?.id.toString()??null:null}async function Ja(e,t,n){if(t==="return")return"return";if(t==="master")return"master";let a=await ye(e);return a&&n.has(a)?"group":e instanceof re?"audio":e instanceof ie?"midi":"unknown"}async function Ua(e){let t=await Promise.all(e.map(async n=>{let a=await p(()=>n.groupTrack,null,"track.groupTrack");return ye(a)}));return new Set(t.filter(n=>n!==null))}async function Xt(e,t,n,a,r){let i=await p(()=>e.name,"Unnamed track","track.name");console.log(`[Ableton Session Mapper] Scan track started: ${i} (#${t}, ${n})`);let s=await p(()=>e.groupTrack,null,"track.groupTrack"),o=await p(()=>e.devices,[],"track.devices");if(oe(r))return console.log(`[Ableton Session Mapper] Scan track completed: ${i} (timed out before devices)`),{id:await ye(e)??`${n}-${t}`,index:t,name:i,kind:await Ja(e,n,a),color:null,isMuted:await p(()=>e.mute,null,"track.mute"),isSoloed:await p(()=>e.solo,null,"track.solo"),isArmed:await p(()=>e.arm,null,"track.arm"),groupTrackId:await ye(s),input:await Jt(e),output:await Ut(e),devices:[],sends:await Wt(e)};let l={id:await ye(e)??`${n}-${t}`,index:t,name:i,kind:await Ja(e,n,a),color:null,isMuted:await p(()=>e.mute,null,"track.mute"),isSoloed:await p(()=>e.solo,null,"track.solo"),isArmed:await p(()=>e.arm,null,"track.arm"),groupTrackId:await ye(s),input:await Jt(e),output:await Ut(e),devices:await Ka(o,r),sends:await Wt(e)};return console.log(`[Ableton Session Mapper] Scan track completed: ${i} (devices=${l.devices.length}, sends=${l.sends.length})`),l}async function qt(e,t,n,a){let r=[];for(let[i,s]of e.entries()){if(oe(a))break;r.push(await Xt(s,i,t,n,a))}return r}async function Wa(e){let t=await p(()=>e.application.song,null,"application.song");if(!t)throw new Error("The current Live Set is unavailable.");let n=await p(()=>t.tracks,[],"song.tracks"),a=await p(()=>t.returnTracks,[],"song.returnTracks"),r=await p(()=>t.mainTrack,null,"song.mainTrack"),i=await Ua(n),s=Ha(),o=await qt(n,"regular",i,s),l=oe(s)?[]:await qt(a,"return",i,s),c=r&&!oe(s)?await Xt(r,0,"master",i,s):null;return console.log("[Ableton Session Mapper] Scan Live Set completed"),{version:ke,exportedAt:new Date().toISOString(),set:{name:null,tempo:await p(()=>t.tempo,null,"song.tempo")},scan:za(s),tracks:o,returnTracks:l,masterTrack:c}}var Yt="abletonSessionMapper.exportSessionMap",Zt="abletonSessionMapper.openInternalViewerExperimental",Xa="abletonSessionMapper.exportJson",qa="abletonSessionMapper.exportSdkDiagnostic",Ya="abletonSessionMapper.exportRackDiagnostic",Qt="abletonSessionMapper.exportSdkCapabilityMatrix",z=process.env.ENABLE_DIAGNOSTIC_ACTIONS==="true",He=process.env.ENABLE_CAPABILITY_MATRIX==="true",en=process.env.ENABLE_OPEN_HTML!=="false",lt=process.env.GENERATE_DIAGRAMS_ON_EXPORT==="true",tn=process.env.GENERATE_MERMAID_HTML_ON_EXPORT!=="false",Ke=process.env.ENABLE_INTERNAL_VIEWER_DEV_ACTION==="true",nn=process.env.OPEN_INTERNAL_MODAL_ON_EXPORT!=="false",an=process.env.FALLBACK_TO_EXTERNAL_LAUNCHER!=="false",Za="Export Session Map",Qa="Open Internal Viewer Experimental",Co=["AudioTrack","MidiTrack","AudioClip","MidiClip","ClipSlot","Scene","AudioTrack.ArrangementSelection","MidiTrack.ArrangementSelection","ClipSlotSelection"];function ze(e){return e instanceof Error?e.stack?{message:e.message,stack:e.stack}:{message:e.message}:{message:String(e)}}function Io(e){console.log(`[Ableton Session Mapper] Action started: ${e}`)}function Eo(e,t){console.log(`[Ableton Session Mapper] Action completed: ${e}${t?` (${t})`:""}`)}function Se(e,t){let n=ze(t);console.error(`[Ableton Session Mapper] Action failed: ${e}: ${n.message}`),n.stack&&console.error(n.stack)}function Oo(e,t){if(console.warn(`[Ableton Session Mapper] ${e}`),t){let n=ze(t);console.warn(`[Ableton Session Mapper] ${n.message}`),n.stack&&console.warn(n.stack)}}async function we(e,t){Io(e);try{let n=await t();Eo(e,typeof n=="string"&&n.length>0?n:void 0)}catch(n){Se(e,n)}}function ot(e,t){console.log(`[Ableton Session Mapper] Open ${t} started: ${e}`);try{if(process.platform!=="darwin"){Oo(`Automatic HTML opening is currently configured for macOS only. ${t} available at: ${e}`);return}let n=(0,tr.spawn)("open",[e],{detached:!0,stdio:"ignore"});n.on("error",a=>{let r=ze(a);console.warn(`[Ableton Session Mapper] Open ${t} failed: ${r.message}`),console.warn(`[Ableton Session Mapper] ${t} available at: ${e}`),r.stack&&console.warn(r.stack)}),n.unref(),console.log(`[Ableton Session Mapper] Open ${t} completed`)}catch(n){let a=ze(n);console.warn(`[Ableton Session Mapper] Open ${t} failed: ${a.message}`),console.warn(`[Ableton Session Mapper] ${t} available at: ${e}`),a.stack&&console.warn(a.stack)}}async function er(e,t,n){let a=null,r=null,i=null,s=null,o=null,l=!1,c=await I(e);if(console.log(`[Ableton Session Mapper] Runtime mode: ${c.runtimeMode}`),console.log(`[Ableton Session Mapper] Resolved extension root: ${c.extensionRoot}`),console.log(`[Ableton Session Mapper] Resolved storage root: ${c.storageRoot}`),console.log(`[Ableton Session Mapper] Resolved project root: ${c.projectRoot}`),console.log(`[Ableton Session Mapper] Resolved exports directory: ${c.exportDirectory}`),await e.ui.withinProgressDialog(n?"Exporting and generating Session Map\u2026":"Exporting Ableton Session Map\u2026",{progress:0},async(f,g)=>{try{if(await f("Scanning Live Set\u2026",20),g.aborted)return;console.log("[Ableton Session Mapper] Scan Live Set started");let k=await Wa(e);console.log("[Ableton Session Mapper] Scan Live Set completed");let u=await Da(c.exportDirectory),b=Aa(k,u);o=b,console.log(`[Ableton Session Mapper] Scan Live Set exportedAt: ${b.exportedAt}`),l=b.scan.partial;let x=await Yn(e,b);if(a=x.latestJsonPath,r=x.archiveJsonPath,i=x.latestHtmlPath,s=x.archiveHtmlPath,await f("Writing JSON\u2026",55),g.aborted)return;console.log(`[Ableton Session Mapper] Write JSON target: ${c.sessionMapJsonPath}`);let h=await Qn(x,b);if(a=h.latestJsonPath,r=h.archiveJsonPath,i=h.latestHtmlPath,s=h.archiveHtmlPath,console.log(`[Ableton Session Mapper] Exported JSON: ${h.latestJsonPath}`),n){if(await f("Generating HTML viewer\u2026",80),g.aborted)return;console.log("[Ableton Session Mapper] Generate HTML started");let y=await ea(e,h.archiveJsonPath,h);if(a=y.latestJsonPath,r=y.archiveJsonPath,i=y.latestHtmlPath,s=y.archiveHtmlPath,console.log(`[Ableton Session Mapper] Generated HTML: ${y.latestHtmlPath??"missing"}`),console.log("[Ableton Session Mapper] Generate HTML completed"),await f("Generating Session Grid\u2026",88),g.aborted)return;console.log("[Ableton Session Mapper] Generate Session Grid started");let T=await ta(e,h.archiveJsonPath);if(console.log(`[Ableton Session Mapper] Generated Session Grid: ${T}`),console.log("[Ableton Session Mapper] Generate Session Grid completed"),tn){if(await f("Generating Mermaid HTML views\u2026",93),g.aborted)return;console.log("[Ableton Session Mapper] Generate Mermaid HTML on export enabled"),console.log("[Ableton Session Mapper] Generate Mermaid flow started"),console.log("[Ableton Session Mapper] Generate Mermaid git started"),console.log("[Ableton Session Mapper] Generate Mermaid kanban started"),await ra(e),console.log("[Ableton Session Mapper] Generate Mermaid flow completed"),console.log("[Ableton Session Mapper] Generate Mermaid git completed"),console.log("[Ableton Session Mapper] Generate Mermaid kanban completed"),lt||console.log("[Ableton Session Mapper] Mermaid SVG/PNG render skipped on export")}if(lt){if(await f("Generating Mermaid diagrams\u2026",94),g.aborted)return;console.log("[Ableton Session Mapper] Generate Mermaid Diagrams started"),await aa(e),console.log("[Ableton Session Mapper] Generate Mermaid Diagrams completed")}if(await f("Generating launcher\u2026",98),g.aborted)return;console.log("[Ableton Session Mapper] Generate Diagrams Index started");let O=await na(e,h.archiveJsonPath);console.log(`[Ableton Session Mapper] Generated Diagrams Index: ${O}`),console.log("[Ableton Session Mapper] Generate Diagrams Index completed")}await f("Complete",100)}catch(k){throw Se(t,k),k}}),n){let g=(await I(e)).sessionMapDiagramsPath;if(nn){console.log("[Ableton Session Mapper] Open integrated modal after export started");try{await Ot(e,ot,{sessionMapOverride:o}),console.log("[Ableton Session Mapper] Open integrated modal after export completed")}catch(k){let u=ze(k);console.error(`[Ableton Session Mapper] Open integrated modal failed: ${u.message}`),u.stack&&console.error(u.stack),an?(console.log("[Ableton Session Mapper] Fallback to external launcher started"),ot(g,"External Launcher"),console.log("[Ableton Session Mapper] Fallback to external launcher completed")):console.log(`[Ableton Session Mapper] External launcher available at: ${g}`)}}else en?ot(g,"External Launcher"):console.log(`[Ableton Session Mapper] External launcher available at: ${g}`)}return{paths:a&&r?{latestJsonPath:a,archiveJsonPath:r,...i&&s?{latestHtmlPath:i,archiveHtmlPath:s}:{}}:null,partial:l,sessionMap:o}}async function No(e){let t=null,n=await I(e);return console.log(`[Ableton Session Mapper] Resolved project root: ${n.projectRoot}`),console.log(`[Ableton Session Mapper] Resolved exports directory: ${n.exportDirectory}`),await e.ui.withinProgressDialog("Inspecting Ableton SDK data\u2026",{progress:0},async(a,r)=>{try{if(await a("Inspecting tracks, devices and routing candidates\u2026",25),r.aborted)return;let i=await _a(e);if(await a("Writing SDK diagnostic JSON\u2026",80),r.aborted)return;t=await ia(e,i),console.log(`[Ableton Session Mapper] Exported SDK Diagnostic JSON: ${t}`),await a("Diagnostic complete",100)}catch(i){throw Se("Export SDK Diagnostic JSON",i),i}}),t}async function jo(e){let t=null,n=await I(e);return console.log(`[Ableton Session Mapper] Resolved project root: ${n.projectRoot}`),console.log(`[Ableton Session Mapper] Resolved exports directory: ${n.exportDirectory}`),await e.ui.withinProgressDialog("Inspecting rack devices\u2026",{progress:0},async(a,r)=>{try{if(await a("Inspecting racks, chains and pads\u2026",25),r.aborted)return;let i=await Ca(e);if(await a("Writing rack diagnostic JSON\u2026",80),r.aborted)return;t=await sa(e,i),console.log(`[Ableton Session Mapper] Exported Rack Diagnostic JSON: ${t}`),await a("Diagnostic complete",100)}catch(i){throw Se("Export Rack Diagnostic JSON",i),i}}),t}async function _o(e){let t=null,n=await I(e);return console.log(`[Ableton Session Mapper] Resolved project root: ${n.projectRoot}`),console.log(`[Ableton Session Mapper] Resolved exports directory: ${n.exportDirectory}`),await e.ui.withinProgressDialog("Generating SDK Capability Matrix\u2026",{progress:0},async(a,r)=>{try{if(await a("Scanning SDK capabilities\u2026",20),r.aborted)return;let i=await Sa(e),s=Ma(i),o=Ta(i),l=await Zn(e,i);if(await a("Writing capability matrix reports\u2026",80),r.aborted)return;await oa(l,i,s,o),t=l.latestHtmlPath,await a("Capability matrix complete",100)}catch(i){throw Se("Generate SDK Capability Matrix",i),i}}),t}function Lo(e){let t=gn(e,"1.0.0");t.commands.registerCommand(Yt,()=>{we("Export Session Map",async()=>(await er(t,"Export Session Map",!0)).partial?"partial":void 0)}),(z||Ke)&&t.commands.registerCommand(Zt,()=>{we("Open Internal Viewer",async()=>{console.log("[Ableton Session Mapper] Open Internal Viewer started"),await Ot(t,ot),console.log("[Ableton Session Mapper] Open Internal Viewer completed")})}),z&&(t.commands.registerCommand(Xa,()=>{we("Export JSON",async()=>(await er(t,"Export JSON",!1)).partial?"partial":void 0)}),t.commands.registerCommand(qa,()=>{we("Export SDK Diagnostic JSON",async()=>{let a=await No(t);a&&console.log(`[Ableton Session Mapper] SDK diagnostic available at: ${a}`)})}),t.commands.registerCommand(Ya,()=>{we("Export Rack Diagnostic JSON",async()=>{let a=await jo(t);a&&console.log(`[Ableton Session Mapper] Rack diagnostic available at: ${a}`)})})),(z||He)&&t.commands.registerCommand(Qt,()=>{we("Generate SDK Capability Matrix",async()=>{let a=await _o(t);a&&console.log(`[Ableton Session Mapper] Capability matrix available at: ${a}`)})});let n=z?[[Za,Yt],...z||Ke?[[Qa,Zt]]:[],["Export JSON",Xa],["Export SDK Diagnostic JSON",qa],["Export Rack Diagnostic JSON",Ya],...z||He?[["Generate SDK Capability Matrix",Qt]]:[]]:[[Za,Yt],...z||Ke?[[Qa,Zt]]:[],...He?[["Generate SDK Capability Matrix",Qt]]:[]];for(let a of Co)for(let[r,i]of n)t.ui.registerContextMenuAction(a,r,i).catch(s=>{Se(`Register ${a}/${r}`,s)});console.log(`[Ableton Session Mapper] ${la} v${ke}`),console.log("[Ableton Session Mapper] Extension activated. Right-click a supported track, clip, clip slot, scene, or arrangement selection."),console.log("[Ableton Session Mapper] Lightweight integrated modal enabled for Session Mapper. Heavy Mermaid/SVG rendering remains external."),console.log("[Ableton Session Mapper] WebView disabled for heavy integrated rendering."),console.log(`[Ableton Session Mapper] Diagnostic actions ${z?"enabled":"disabled"}${z?" via ENABLE_DIAGNOSTIC_ACTIONS=true":""}.`),console.log(`[Ableton Session Mapper] SDK Capability Matrix ${He?"enabled":"disabled"}${He?" via ENABLE_CAPABILITY_MATRIX=true":""}.`),console.log(`[Ableton Session Mapper] External HTML auto-open ${en?"enabled":"disabled"}${en?" (set ENABLE_OPEN_HTML=false to disable)":" via ENABLE_OPEN_HTML=false"}.`),console.log(`[Ableton Session Mapper] Integrated modal on export ${nn?"enabled":"disabled"}${nn?" (set OPEN_INTERNAL_MODAL_ON_EXPORT=false to use the external launcher by default)":" via OPEN_INTERNAL_MODAL_ON_EXPORT=false"}.`),console.log(`[Ableton Session Mapper] Fallback to external launcher ${an?"enabled":"disabled"}${an?" (recommended)":" via FALLBACK_TO_EXTERNAL_LAUNCHER=false"}.`),console.log(`[Ableton Session Mapper] Mermaid diagram generation on export ${lt?"enabled":"disabled"}${lt?" via GENERATE_DIAGRAMS_ON_EXPORT=true":" by default"}.`,`[Ableton Session Mapper] Mermaid HTML generation on export ${tn?"enabled":"disabled"}${tn?" by default":" via GENERATE_MERMAID_HTML_ON_EXPORT=false"}.`),console.log(`[Ableton Session Mapper] Internal Viewer dev action ${z||Ke?"enabled":"disabled"}${Ke?" via ENABLE_INTERNAL_VIEWER_DEV_ACTION=true":""}.`)}0&&(module.exports={activate});
