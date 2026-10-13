import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pipeline } from "node:stream/promises";
import dotenv from "dotenv";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voiceId = "1u9q7vX1Lcx74yAcFPt7";

export async function generateTinaAudio() {
  dotenv.config({ path: path.join(projectDir, ".env.local") });
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Falta ELEVENLABS_API_KEY en .env.local. Agregá tu clave localmente y volvé a ejecutar el generador.");
  }

  const guides = JSON.parse(
    await readFile(path.join(projectDir, "assets", "data", "tina-guides.json"), "utf8"),
  );
  const outputDir = path.join(projectDir, "assets", "audio", "tina");
  const force = process.argv.includes("--force");
  await mkdir(outputDir, { recursive: true });

  const client = new ElevenLabsClient({ apiKey });
  for (const [id, guide] of Object.entries(guides)) {
    const outputPath = path.join(outputDir, `${id}.mp3`);
    if (!force) {
      try {
        if ((await stat(outputPath)).size > 0) continue;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }

    const temporaryPath = `${outputPath}.tmp`;
    try {
      const audioStream = await client.textToSpeech.convert(voiceId, {
        text: guide.text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
        voiceSettings: {
          stability: 0.42,
          similarityBoost: 0.78,
          style: 0.35,
          speed: 1.05,
        },
      });
      await pipeline(audioStream, createWriteStream(temporaryPath));
      await rename(temporaryPath, outputPath);
      console.log(`Audio de Tina generado: ${guide.audio}`);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw new Error(`No se pudo generar el audio de Tina para "${id}".`, { cause: error });
    }
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) await generateTinaAudio();
