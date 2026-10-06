"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface HostResources {
  cpu: { usage: number };
  ram: { used: number; total: number; unit: string };
  disks: { mount: string; used: number; total: number; unit: string }[];
}

function Bar({ pct }: { pct: number }) {
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  const color = pct > 85 ? "#ff4444" : pct > 60 ? "#ffcc00" : "#00e5ff";
  return (
    <span style={{ color, fontFamily: "var(--font-mono)", fontSize: "11px" }}>
      {"█".repeat(filled)}
      <span style={{ color: "var(--bg-border)" }}>{"░".repeat(empty)}</span>
      {" "}
      {pct}%
    </span>
  );
}

export function HostPanel() {
  const [data, setData] = useState<HostResources | null>(null);
  const [error, setError] = useState(false);
  const { t } = useTranslation();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/host/resources");
      if (!res.ok) { setError(true); return; }
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5_000);
    return () => clearInterval(id);
  }, [fetchData]);

  return (
    <div
      style={{
        borderTop: "1px solid var(--bg-border)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        gap: "2rem",
        flexWrap: "wrap",
        alignItems: "center",
        fontSize: "12px",
      }}
    >
      <span style={{ color: "var(--text-muted)", letterSpacing: "0.08em", fontSize: "11px" }}>
        {t("host.label")}
      </span>

      {error && (
        <span style={{ color: "#ff4444" }}>{t("host.error")}</span>
      )}

      {data && (
        <>
          {/* CPU */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)" }}>cpu</span>
            <Bar pct={data.cpu.usage} />
          </div>

          {/* RAM */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)" }}>ram</span>
            <span style={{ color: "var(--text)" }}>
              {data.ram.used} / {data.ram.total} {data.ram.unit}
            </span>
          </div>

          {/* 디스크 */}
          {data.disks.slice(0, 3).map((disk) => (
            <div key={disk.mount} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)" }}>{disk.mount}</span>
              <span style={{ color: "var(--text)" }}>
                {disk.used}/{disk.total}{disk.unit}{" "}
                <span style={{ color: "var(--text-muted)" }}>
                  ({Math.round((disk.used / disk.total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
        </>
      )}

      {!data && !error && (
        <span style={{ color: "var(--text-muted)" }}>···</span>
      )}
    </div>
  );
}
