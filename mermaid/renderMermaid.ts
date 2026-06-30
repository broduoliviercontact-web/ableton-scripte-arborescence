import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { writeDiagramsIndex } from "../launcher/diagramsIndexTemplate.js";

const execFileAsync = promisify(execFile);

type MermaidProfile = "flow" | "git" | "kanban";

interface RenderPaths {
  latestMmdPath: string;
  archiveMmdPath: string;
  latestSvgPath: string;
  archiveSvgPath: string;
  latestPngPath: string;
  archivePngPath: string;
  latestHtmlPath: string;
}

const mermaidDirectory = dirname(fileURLToPath(import.meta.url));
const rootDirectory = resolve(mermaidDirectory, "..");

const argumentValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const profile = (argumentValue("--profile") as MermaidProfile | undefined) ?? "flow";
const profileFileSuffix = argumentValue("--file-suffix") ?? "";
const latestMmdPath = resolve(
  argumentValue("--input") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.mmd"
        : profile === "kanban"
          ? "exports/session-map-kanban.mmd"
          : "exports/session-map.mmd",
    ),
);
const latestSvgPath = resolve(
  argumentValue("--svg") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.svg"
        : profile === "kanban"
          ? "exports/session-map-kanban.svg"
          : "exports/session-map.svg",
    ),
);
const latestPngPath = resolve(
  argumentValue("--png") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-git.png"
        : profile === "kanban"
          ? "exports/session-map-kanban.png"
          : "exports/session-map.png",
    ),
);
const latestHtmlPath = resolve(
  argumentValue("--html") ??
    resolve(
      rootDirectory,
      profile === "git"
        ? "exports/session-map-mermaid-git.html"
        : profile === "kanban"
          ? "exports/session-map-mermaid-kanban.html"
          : "exports/session-map-mermaid.html",
    ),
);
const mermaidCliPath = resolve(rootDirectory, "node_modules/@mermaid-js/mermaid-cli/src/cli.js");
const mermaidConfigPath = resolve(rootDirectory, "mermaid/mermaid.config.json");
const logPrefix = profileFileSuffix
  ? `[mermaid:${profileFileSuffix}]`
  : profile === "flow"
    ? "[mermaid]"
    : `[mermaid:${profile}]`;

function logPath(path: string): string {
  const rel = relative(rootDirectory, path);
  return rel && !rel.startsWith("..") ? rel : path;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function deriveArchiveMmdPath(outputDirectory: string): Promise<string> {
  const latestMermaid = await readFile(latestMmdPath, "utf8");
  const entries = await readdir(outputDirectory);
  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".mmd") && entry !== basename(latestMmdPath))
      .map(async (entry) => {
        const fullPath = join(outputDirectory, entry);
        const metadata = await stat(fullPath);
        return { fullPath, mtimeMs: metadata.mtimeMs };
      }),
  );

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const candidate of candidates) {
    const archivedMermaid = await readFile(candidate.fullPath, "utf8");
    if (archivedMermaid === latestMermaid) {
      return candidate.fullPath;
    }
  }

  throw new Error(
    `Unable to match ${logPath(latestMmdPath)} to an archived .mmd export. Run the corresponding generate:mermaid command first.`,
  );
}

async function resolveRenderPaths(): Promise<RenderPaths> {
  const outputDirectory = dirname(latestMmdPath);
  await mkdir(outputDirectory, { recursive: true });
  const archiveMmdPath = await deriveArchiveMmdPath(outputDirectory);
  const archiveStem = archiveMmdPath.replace(/\.mmd$/i, "");

  return {
    latestMmdPath,
    archiveMmdPath,
    latestSvgPath,
    archiveSvgPath: `${archiveStem}.svg`,
    latestPngPath,
    archivePngPath: `${archiveStem}.png`,
    latestHtmlPath,
  };
}

async function ensureRendererInstalled(): Promise<void> {
  if (!(await pathExists(mermaidCliPath))) {
    throw new Error(
      "Mermaid CLI is not installed. Run `npm install` at the project root, then retry the render command.",
    );
  }
  if (!(await pathExists(mermaidConfigPath))) {
    throw new Error(
      "Missing Mermaid config file at mermaid/mermaid.config.json.",
    );
  }
}

async function renderWithMermaidCli(
  inputPath: string,
  outputPath: string,
  format: "svg" | "png",
): Promise<void> {
  const width = profile === "kanban" ? "4200" : profile === "git" ? "4400" : "3200";
  const height = profile === "kanban" ? "2400" : profile === "git" ? "2800" : "2200";
  const scale = profile === "kanban" ? "3.2" : profile === "git" ? "3.4" : "3";
  await execFileAsync(
    process.execPath,
    [
      mermaidCliPath,
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--outputFormat",
      format,
      "--configFile",
      mermaidConfigPath,
      "--backgroundColor",
      "#0b0f17",
      "--width",
      width,
      "--height",
      height,
      "--scale",
      scale,
      "--quiet",
    ],
    { cwd: rootDirectory },
  );
}

function htmlTitle(): string {
  return profileFileSuffix
    ? `Ableton Session Mapper — Mermaid ${profileFileSuffix.toUpperCase()}`
    : profile === "git"
      ? "Ableton Session Mapper — Mermaid Git"
      : profile === "kanban"
        ? "Ableton Session Mapper — Mermaid Kanban"
        : "Ableton Session Mapper — Mermaid Diagram";
}

function relativeName(path: string): string {
  return basename(path);
}

function buildProfileEnhancerScript(): string {
  if (profile !== "kanban") {
    return "";
  }

  return `
    <script>
      (() => {
        const styleMap = {
          "track-midi": { fill: "#1d2436", stroke: "#8b7dff", text: "#eef2ff" },
          "track-audio": { fill: "#1d2630", stroke: "#6ba7ff", text: "#f3f7ff" },
          "track-return": { fill: "#10252c", stroke: "#47c8f0", text: "#e6fbff" },
          "track-master": { fill: "#2c1b14", stroke: "#f5a623", text: "#fff5e9" },
          "track-group": { fill: "#262132", stroke: "#b493ff", text: "#f5f0ff" },
          "device-rack": { fill: "#2b2216", stroke: "#d8a24a", text: "#fff5df" },
          "device-standard": { fill: "#1b1f28", stroke: "#7b8598", text: "#f3f4f6" }
        };

        const classifyCard = (text) => {
          const value = String(text || "").trim();
          if (value.startsWith("MIDI ")) return "track-midi";
          if (value.startsWith("AUD ")) return "track-audio";
          if (value.startsWith("RET ")) return "track-return";
          if (value.startsWith("MAIN ")) return "track-master";
          if (value.startsWith("GRP ")) return "track-group";
          if (value.startsWith("RACK ")) return "device-rack";
          if (value.startsWith("DEV ")) return "device-standard";
          return null;
        };

        const applyStyle = (node, styleKey) => {
          const style = styleMap[styleKey];
          if (!style) return;
          node.classList.add(styleKey);
          node.querySelectorAll("rect, polygon").forEach((shape) => {
            shape.setAttribute("fill", style.fill);
            shape.setAttribute("stroke", style.stroke);
            shape.setAttribute("stroke-width", "1.4");
          });
          node.querySelectorAll("text").forEach((textNode) => {
            textNode.setAttribute("fill", style.text);
          });
          node.querySelectorAll("foreignObject div, foreignObject span, foreignObject p").forEach((label) => {
            label.style.color = style.text;
          });
        };

        const enhanceKanban = () => {
          const svg = document.querySelector(".diagram svg");
          if (!svg) return;
          svg.querySelectorAll("g.node").forEach((node) => {
            const styleKey = classifyCard(node.textContent || "");
            if (styleKey) applyStyle(node, styleKey);
          });
        };

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", enhanceKanban, { once: true });
        } else {
          enhanceKanban();
        }
      })();
    </script>`;
}

function buildHtmlPage(svgMarkup: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${htmlTitle()}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #0f1115;
      color: #f2f2f2;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .shell {
      max-width: 1800px;
      margin: 0 auto;
      padding: 24px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    a {
      color: #f5a623;
      text-decoration: none;
      border: 1px solid rgba(245, 166, 35, 0.35);
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(245, 166, 35, 0.08);
    }
    a:hover {
      background: rgba(245, 166, 35, 0.16);
    }
    .diagram {
      overflow: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      background: #111318;
      padding: 16px;
    }
    .diagram svg {
      width: max-content;
      min-width: 100%;
      height: auto;
      display: block;
    }
    .caption {
      margin-top: 12px;
      color: #9ca3af;
      font-size: 13px;
    }
    footer {
      margin-top: 18px;
      display: flex;
      justify-content: flex-end;
    }
    footer a {
      font-size: 12px;
      color: #7c8799;
      background: transparent;
      border: 0;
      padding: 0;
    }
    footer a:hover {
      color: #f5a623;
      background: transparent;
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="toolbar">
      <h1>${htmlTitle()}</h1>
      <div class="links">
        <a href="${relativeName(latestMmdPath)}">Open .mmd</a>
        <a href="${relativeName(latestSvgPath)}">Open SVG</a>
        <a href="${relativeName(latestPngPath)}">Open PNG</a>
      </div>
    </div>
    <div class="diagram">
${svgMarkup}
    </div>
    <p class="caption">Rendered externally from Mermaid. No Ableton WebView used.</p>
    <footer>
      <a href="https://deerflow.tech" target="_blank" rel="noopener noreferrer">Created By Deerflow</a>
    </footer>
  </div>
  ${buildProfileEnhancerScript()}
</body>
</html>
`;
}

async function main(): Promise<void> {
  await ensureRendererInstalled();
  const paths = await resolveRenderPaths();

  console.log(`${logPrefix} Render Mermaid started`);

  console.log(`${logPrefix} Render SVG started`);
  await renderWithMermaidCli(paths.latestMmdPath, paths.latestSvgPath, "svg");
  const latestSvg = await readFile(paths.latestSvgPath, "utf8");
  await writeFile(paths.archiveSvgPath, latestSvg, "utf8");
  console.log(`${logPrefix} Render SVG completed: ${logPath(paths.latestSvgPath)}`);
  console.log(`${logPrefix} SVG archive completed: ${logPath(paths.archiveSvgPath)}`);

  console.log(`${logPrefix} Render PNG started`);
  await renderWithMermaidCli(paths.latestMmdPath, paths.latestPngPath, "png");
  const latestPng = await readFile(paths.latestPngPath);
  await writeFile(paths.archivePngPath, latestPng);
  console.log(`${logPrefix} Render PNG completed: ${logPath(paths.latestPngPath)}`);
  console.log(`${logPrefix} PNG archive completed: ${logPath(paths.archivePngPath)}`);

  const html = buildHtmlPage(latestSvg);
  await writeFile(paths.latestHtmlPath, html, "utf8");
  console.log(`${logPrefix} Mermaid HTML completed: ${logPath(paths.latestHtmlPath)}`);
  const indexHtmlPath = resolve(rootDirectory, "exports/session-map-diagrams.html");
  await writeDiagramsIndex({
    jsonPath: resolve(rootDirectory, "exports/session-map.json"),
    outputPath: indexHtmlPath,
    rootDirectory,
  });
  console.log(`${logPrefix} Diagram index completed: ${logPath(indexHtmlPath)}`);
  console.log(`${logPrefix} Render Mermaid completed`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${logPrefix} Render Mermaid failed: ${message}`);
  console.error(
    `${logPrefix} The .mmd export is still available. If the renderer is missing or broken, run \`npm install\` and retry the render command.`,
  );
  process.exitCode = 1;
});
