import { spawn, ChildProcess } from "child_process";

interface ProcessInfo {
  proc: ChildProcess;
  startedAt: number;
  log: string[];
}

// 모듈 레벨 맵 — Next.js 서버 프로세스 재시작 시 초기화됨
const running = new Map<string, ProcessInfo>();

export function startProcess(id: string, command: string): number {
  if (running.has(id)) throw new Error("Already running");
  const proc = spawn(command, [], { shell: true, detached: false });
  const info: ProcessInfo = { proc, startedAt: Date.now(), log: [] };
  proc.stdout?.on("data", (d: Buffer) => {
    info.log.push(d.toString());
    if (info.log.length > 200) info.log.shift();
  });
  proc.stderr?.on("data", (d: Buffer) => {
    info.log.push("[err] " + d.toString());
    if (info.log.length > 200) info.log.shift();
  });
  proc.on("exit", () => { running.delete(id); });
  running.set(id, info);
  return proc.pid ?? 0;
}

export function stopProcess(id: string): void {
  const info = running.get(id);
  if (!info) throw new Error("Not running");
  info.proc.kill();
  running.delete(id);
}

export function getStatus(id: string): "running" | "stopped" {
  return running.has(id) ? "running" : "stopped";
}

export function getLogs(id: string): string[] {
  return running.get(id)?.log.slice(-50) ?? [];
}

export function getAllStatuses(ids: string[]): Record<string, "running" | "stopped"> {
  const result: Record<string, "running" | "stopped"> = {};
  for (const id of ids) {
    result[id] = running.has(id) ? "running" : "stopped";
  }
  return result;
}
