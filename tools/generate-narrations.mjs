import { execFile } from "node:child_process";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function generateNarrations() {
  const narrations = JSON.parse(
    await readFile(path.join(projectDir, "tools", "narrations.json"), "utf8"),
  );
  const audioDir = path.join(projectDir, "assets", "audio");
  const force = process.argv.includes("--force");
  await mkdir(audioDir, { recursive: true });

  for (const [id, narration] of Object.entries(narrations)) {
    const output = path.join(audioDir, `${id}.mp3`);
    if (!force) {
      try {
        if ((await stat(output)).size > 0) continue;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }

    await execFileAsync(
      process.env.PYTHON || "python",
      [
        "-m",
        "edge_tts",
        "--voice",
        "es-AR-ElenaNeural",
        "--rate=-8%",
        "--text",
        narration.text,
        "--write-media",
        output,
      ],
      { windowsHide: true, maxBuffer: 1024 * 1024 },
    );
    console.log(`Narración generada: ${narration.title}`);
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) await generateNarrations();
