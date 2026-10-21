import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import extract from "extract-zip";

const adapterDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(adapterDir, "..");
const archivePath = path.join(repositoryRoot, "NexusTiers-ticket-system-complete.zip");
const workspaceDir = path.join(adapterDir, ".runtime");
const markerPath = path.join(workspaceDir, ".source-sha256");
const entryPath = path.join(workspaceDir, "artifacts", "api-server", "dist", "index.mjs");
const pnpmPath = path.join(adapterDir, "node_modules", ".bin", process.platform === "win32" ? "pnpm.cmd" : "pnpm");

const requiredVariables = ["DATABASE_URL", "DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);
if (missingVariables.length > 0) {
  console.error("Missing required Botkeep secrets: " + missingVariables.join(", "));
  process.exit(1);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(path.basename(command) + " exited with status " + result.status);
  }
}

const archive = await readFile(archivePath).catch(() => {
  throw new Error("Repository archive is missing: " + archivePath);
});
const sourceHash = createHash("sha256").update(archive).digest("hex");
const savedHash = await readFile(markerPath, "utf8").catch(() => "");
const dependenciesInstalled = await exists(path.join(workspaceDir, "node_modules", ".pnpm"));
const appBuilt = await exists(entryPath);

if (savedHash.trim() !== sourceHash || !dependenciesInstalled || !appBuilt) {
  console.log("Preparing NexusTierss from the repository archive; the first start can take a few minutes.");
  await rm(workspaceDir, { recursive: true, force: true });
  await mkdir(workspaceDir, { recursive: true });
  await extract(archivePath, { dir: workspaceDir });
  run(pnpmPath, ["install", "--frozen-lockfile"], workspaceDir, { NODE_ENV: "development", NODE_OPTIONS: "--max-old-space-size=384" });
  run(pnpmPath, ["run", "typecheck:libs"], workspaceDir, { NODE_ENV: "production", NODE_OPTIONS: "--max-old-space-size=384" });
  run(pnpmPath, ["--filter", "@workspace/api-server", "run", "build"], workspaceDir, {
    NODE_ENV: "production",
    NODE_OPTIONS: "--max-old-space-size=384",
    PORT: "4173",
    BASE_PATH: "/",
  });
  await writeFile(markerPath, sourceHash + "\n", "utf8");
}

const serverEnv = { ...process.env, NODE_ENV: "production", PORT: process.env.PORT || "8080" };
console.log("Starting NexusTierss API and Discord bot.");
const child = spawn(process.execPath, ["--enable-source-maps", "artifacts/api-server/dist/index.mjs"], {
  cwd: workspaceDir,
  env: serverEnv,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error("Could not start the NexusTierss server:", error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
