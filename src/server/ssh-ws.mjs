/**
 * SSH WebSocket 서버 (포트 3001)
 * 클라이언트: ws://localhost:3001/ssh/{vmId}?ip={ip}&user={user}
 * node-pty로 ssh 프로세스를 스폰하고 WebSocket과 브리지.
 */

import { WebSocketServer } from "ws";
import pty from "node-pty";

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT, path: "/ssh" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://localhost`);
  const vmId = url.searchParams.get("vmId");
  const ip = url.searchParams.get("ip");
  const user = url.searchParams.get("user") || "root";

  if (!vmId || !ip) {
    ws.send("\r\nerror: missing vmId or ip\r\n");
    ws.close(1008, "missing params");
    return;
  }

  ws.send(`Connecting to ${user}@${ip}...\r\n`);

  let ptyProc;
  try {
    ptyProc = pty.spawn("ssh", [
      "-o", "StrictHostKeyChecking=no",
      "-o", "ConnectTimeout=10",
      "-o", "BatchMode=no",
      `${user}@${ip}`,
    ], {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      env: { ...process.env, TERM: "xterm-color" },
    });
  } catch (err) {
    ws.send(`\r\nerror: failed to spawn ssh — ${err.message}\r\n`);
    ws.close(1011, "spawn failed");
    return;
  }

  ptyProc.onData((data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });

  ptyProc.onExit(({ exitCode }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(`\r\n[connection closed — exit ${exitCode}]\r\n`);
      ws.close();
    }
  });

  ws.on("message", (msg) => {
    const raw = msg.toString();
    // 리사이즈 메시지: JSON {"type":"resize","cols":N,"rows":N}
    try {
      const parsed = JSON.parse(raw);
      if (parsed.type === "resize" && parsed.cols && parsed.rows) {
        ptyProc.resize(parsed.cols, parsed.rows);
        return;
      }
    } catch {}
    ptyProc.write(raw);
  });

  ws.on("close", () => ptyProc.kill());
  ws.on("error", () => ptyProc.kill());
});

console.log(`[homelab] SSH WebSocket server on port ${PORT}`);
