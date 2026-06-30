import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type MermaidProfile = "flow" | "git" | "kanban";

const mermaidDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(mermaidDirectory, "..");

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const profile = (argumentValue("--profile") as MermaidProfile | undefined) ?? "flow";
const inputPath = resolve(
  argumentValue("--input") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.mmd"
        : profile === "kanban"
          ? "exports/session-map-kanban.mmd"
          : "exports/session-map-flow.mmd",
    ),
);
const outputPath = resolve(
  argumentValue("--output") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-mermaid-git.html"
        : profile === "kanban"
          ? "exports/session-map-mermaid-kanban.html"
          : "exports/session-map-mermaid-flow.html",
    ),
);
const logPrefix = `[mermaid-html:${profile}]`;

function logPath(path: string): string {
  const rel = relative(rootDirectory, path);
  return rel && !rel.startsWith("..") ? rel : path;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeJsonForScript(value: string): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function profileTitle(): string {
  switch (profile) {
    case "git":
      return "Git / Metro";
    case "kanban":
      return "Kanban";
    default:
      return "Flow";
  }
}

function profileDescription(): string {
  switch (profile) {
    case "git":
      return "Metro view generated from the latest session-map.json.";
    case "kanban":
      return "Session-style kanban generated from the latest session-map.json.";
    default:
      return "Technical flow generated from the latest session-map.json.";
  }
}

function buildHtml(mermaidSource: string): string {
  const diagramSource = safeJsonForScript(mermaidSource);
  const title = profileTitle();
  const mermaidRuntime = safeJsonForScript(
    `\n${readFileSyncMermaidMin()}\n`,
  );

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ableton Session Mapper — ${escapeHtml(title)}</title>
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
      max-width: 1600px;
      margin: 0 auto;
      padding: 18px;
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
      margin-bottom: 12px;
      padding: 14px;
      background: var(--live-panel);
      border: 1px solid var(--live-border);
      border-radius: 6px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
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
      font-size: 12px;
      color: var(--live-muted);
    }
  </style>
</head>
<body>
  <div class="shell">
    <section class="toolbar">
      <div>
        <p class="eyebrow">Session Mapper / Mermaid HTML</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="subline">${escapeHtml(profileDescription())} SVG/PNG remain optional and can be refreshed manually.</p>
      </div>
      <div class="actions">
        <a class="button is-accent" href="${escapeHtml(basename(inputPath))}">Open .mmd</a>
      </div>
    </section>
    <section class="diagram-shell">
      <div id="diagram" class="mermaid"></div>
    </section>
    <p class="caption">Rendered externally from Mermaid source. No Ableton WebView used. If your browser still blocks local scripts, run <strong>npm run serve:exports</strong>.</p>
  </div>
  <script>
    (() => {
      const script = document.createElement("script");
      script.text = ${mermaidRuntime};
      document.head.appendChild(script);
    })();
  </script>
  <script>
    window.addEventListener("DOMContentLoaded", async () => {
      const source = ${diagramSource};
      if (!window.mermaid) {
        const target = document.getElementById("diagram");
        target.innerHTML = "<p style=\\"color:#f5a623;font:12px sans-serif;\\">Mermaid runtime unavailable in file:// mode. Run npm run serve:exports and open via http://localhost:5177/exports/…</p>";
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
</html>`;
}

let cachedMermaidMin: string | null = null;

function readFileSyncMermaidMin(): string {
  if (cachedMermaidMin) return cachedMermaidMin;
  throw new Error("Mermaid runtime cache not initialized.");
}

async function main(): Promise<void> {
  console.log(`${logPrefix} Generate Mermaid HTML started`);
  cachedMermaidMin = await readFile(resolve(rootDirectory, "node_modules/mermaid/dist/mermaid.min.js"), "utf8");
  const mermaidSource = await readFile(inputPath, "utf8");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buildHtml(mermaidSource), "utf8");
  console.log(`${logPrefix} Generate Mermaid HTML completed: ${logPath(outputPath)}`);
}

main().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`${logPrefix} Generate Mermaid HTML failed: ${detail}`);
  process.exitCode = 1;
});
