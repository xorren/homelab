"use client";

import { useEffect, useRef, useCallback } from "react";

interface Props {
  vmId: string;
  ip: string;
  user: string;
  onClose: () => void;
}

const WS_PORT = 3001;

export function SshTerminal({ vmId, ip, user, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // xterm 인스턴스는 ref로 관리 (리렌더링 방지)
  const xtermRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(() => {
    wsRef.current?.close();
    xtermRef.current?.dispose();
    wsRef.current = null;
    xtermRef.current = null;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    // xterm.js는 SSR 불가 — 동적 import
    Promise.all([
      import("@xterm/xterm"),
      import("@xterm/addon-fit"),
    ]).then(([{ Terminal }, { FitAddon }]) => {
      if (disposed || !containerRef.current) return;

      const term = new Terminal({
        theme: {
          background: "#0a0a0a",
          foreground: "#00e5ff",
          cursor: "#00e5ff",
          selectionBackground: "#00e5ff33",
          black: "#0a0a0a",
          brightBlack: "#303030",
        },
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        scrollback: 1000,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current!);
      fitAddon.fit();

      xtermRef.current = term;

      // WebSocket 연결
      const wsUrl = `ws://localhost:${WS_PORT}/ssh?vmId=${encodeURIComponent(vmId)}&ip=${encodeURIComponent(ip)}&user=${encodeURIComponent(user)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(data);
        });

        term.onResize(({ cols, rows }) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "resize", cols, rows }));
          }
        });
      };

      ws.onmessage = (e) => term.write(e.data);

      ws.onclose = () => {
        if (!disposed) term.write("\r\n[disconnected]\r\n");
      };

      ws.onerror = () => {
        term.write("\r\nerror: WebSocket connection failed\r\nIs the SSH server running? (npm run dev)\r\n");
      };

      // 컨테이너 리사이즈 감지
      const ro = new ResizeObserver(() => fitAddon.fit());
      ro.observe(containerRef.current!);

      return () => ro.disconnect();
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [vmId, ip, user, cleanup]);

  return (
    <div
      style={{
        marginTop: "1.5rem",
        border: "1px solid var(--bg-border)",
        background: "#0a0a0a",
      }}
    >
      {/* 터미널 타이틀 바 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.4rem 0.75rem",
          borderBottom: "1px solid var(--bg-border)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            fontFamily: "var(--font-mono)",
          }}
        >
          ssh {user}@{ip}
        </span>
        <button
          onClick={() => { cleanup(); onClose(); }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            cursor: "pointer",
            padding: "0",
            lineHeight: 1,
          }}
          title="터미널 닫기"
        >
          [×]
        </button>
      </div>

      {/* xterm.js 마운트 포인트 */}
      <div
        ref={containerRef}
        style={{ padding: "0.25rem", height: "380px" }}
      />
    </div>
  );
}
