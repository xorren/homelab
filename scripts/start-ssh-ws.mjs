#!/usr/bin/env node
/**
 * SSH WebSocket 서버를 백그라운드에서 실행.
 * 이미 포트 3001이 열려 있으면 스킵.
 */

import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as net from "net";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_PATH = join(ROOT, "src", "server", "ssh-ws.mjs");
const PORT = 3001;
const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 8000;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(500);
    sock.on("connect", () => { sock.destroy(); resolve(true); });
    sock.on("error", () => resolve(false));
    sock.on("timeout", () => resolve(false));
    sock.connect(port, "127.0.0.1");
  });
}

async function waitForPort() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (await isPortOpen(PORT)) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

if (await isPortOpen(PORT)) {
  console.log("[homelab] SSH WS server already running.");
  process.exit(0);
}

console.log("[homelab] Starting SSH WebSocket server...");
const child = spawn(process.execPath, [SERVER_PATH], {
  detached: true,
  stdio: "ignore",
});
child.unref();

const ready = await waitForPort();
if (ready) {
  console.log("[homelab] SSH WebSocket server ready.");
} else {
  console.warn("[homelab] SSH WebSocket server did not start in time. Continuing anyway.");
}
process.exit(0);
