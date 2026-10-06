#!/usr/bin/env node
/**
 * vmrest.exe를 백그라운드에서 실행하고 준비될 때까지 대기.
 * .env.local의 VMREST_PATH, VMREST_USER, VMREST_PASS를 읽는다.
 */

import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const VMREST_PATH =
  process.env.VMREST_PATH ||
  "C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrest.exe";

const VMREST_URL = "http://localhost:8697/api/vms";
const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 15000;

async function isVmrestReady() {
  const user = process.env.VMREST_USER || "admin";
  const pass = process.env.VMREST_PASS || "";
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");
  try {
    const res = await fetch(VMREST_URL, {
      headers: { Authorization: `Basic ${auth}` },
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForVmrest() {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (await isVmrestReady()) return true;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

if (!existsSync(VMREST_PATH)) {
  console.warn(`[homelab] vmrest.exe not found at: ${VMREST_PATH}`);
  console.warn("[homelab] Set VMREST_PATH in .env.local. Skipping vmrest start.");
  process.exit(0);
}

if (await isVmrestReady()) {
  console.log("[homelab] vmrest already running.");
  process.exit(0);
}

console.log("[homelab] Starting vmrest...");
const child = spawn(VMREST_PATH, [], {
  detached: true,
  stdio: "ignore",
  windowsHide: true,
});
child.unref();

const ready = await waitForVmrest();
if (ready) {
  console.log("[homelab] vmrest ready.");
} else {
  console.warn("[homelab] vmrest did not start in time. Continuing anyway.");
}
process.exit(0);
