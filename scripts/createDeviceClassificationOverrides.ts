import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = process.cwd();
const exportDirectory = join(projectRoot, "exports");
const examplePath = join(exportDirectory, "device-classification-overrides.example.json");

const template = {
  version: "1.0.0",
  devices: {
    "STING!64": {
      category: "max-for-live",
      label: "Max for Live",
      badge: "M4L MIDI",
      m4lKind: "midi",
      confidence: "high",
      notes: "Manual classification override",
    },
    "DS Clap": {
      category: "instrument",
      label: "Instrument",
      badge: "INST",
      confidence: "high",
      notes: "Manual classification override",
    },
  },
};

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(exportDirectory, { recursive: true });

if (await pathExists(examplePath)) {
  console.log(`[Ableton Session Mapper] Device classification overrides example already exists: ${examplePath}`);
  process.exit(0);
}

await writeFile(examplePath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
console.log(`[Ableton Session Mapper] Device classification overrides example created: ${examplePath}`);
