"use client";

import { useEffect, useState, useCallback } from "react";
import { VmCard } from "./VmCard";
import { useTranslation } from "@/hooks/useTranslation";
import type { VmEntry } from "@/app/api/vms/route";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; vms: VmEntry[] };

export function VmGrid() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const { t } = useTranslation();

  const fetchVms = useCallback(async () => {
    try {
      const res = await fetch("/api/vms");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState({
          status: "error",
          message: (data as { error?: string }).error ?? "fetch failed",
        });
        return;
      }
      const vms: VmEntry[] = await res.json();
      setState({ status: "ok", vms });
    } catch {
      setState({ status: "error", message: "vmrest unreachable" });
    }
  }, []);

  useEffect(() => {
    fetchVms();
    const id = setInterval(fetchVms, 10_000);
    return () => clearInterval(id);
  }, [fetchVms]);

  return (
    <div>
      {/* 오류 배너 */}
      {state.status === "error" && (
        <div
          style={{
            borderLeft: "1px solid #ff4444",
            padding: "0.5rem 0.75rem",
            marginBottom: "1.5rem",
            color: "#ff4444",
            fontSize: "12px",
            background: "rgba(255,68,68,0.05)",
          }}
        >
          ! {t("vms.errorBanner", { message: state.message })}
        </div>
      )}

      {/* 제목 */}
      <h1
        style={{
          color: "var(--accent)",
          fontSize: "13px",
          letterSpacing: "0.1em",
          marginBottom: "1.25rem",
          fontWeight: 400,
        }}
      >
        {t("vms.title")}
      </h1>

      {/* 로딩 */}
      {state.status === "loading" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                border: "1px dashed var(--bg-border)",
                padding: "1.25rem",
                height: "120px",
              }}
            />
          ))}
        </div>
      )}

      {/* VM 없음 */}
      {state.status === "ok" && state.vms.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          {t("vms.empty")}
        </p>
      )}

      {/* 카드 그리드 */}
      {state.status === "ok" && state.vms.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {state.vms.map((vm) => (
            <VmCard key={vm.id} vm={vm} onStateChange={fetchVms} />
          ))}
        </div>
      )}
    </div>
  );
}
