"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import type { VmEntry } from "@/app/api/vms/route";

const STATE_COLOR: Record<VmEntry["state"], string> = {
  poweredOn:  "#00e5ff",
  poweredOff: "#606060",
  paused:     "#ffcc00",
  suspended:  "#9966ff",
};

const STATE_ICON: Record<VmEntry["state"], string> = {
  poweredOn:  "▶",
  poweredOff: "■",
  paused:     "⏸",
  suspended:  "⏸",
};

const STATE_KEY: Record<VmEntry["state"], string> = {
  poweredOn:  "state.running",
  poweredOff: "state.stopped",
  paused:     "state.paused",
  suspended:  "state.suspended",
};

const QUICK_ACTION: Record<VmEntry["state"], { key: string; action: string } | null> = {
  poweredOn:  { key: "action.stop",   action: "stop" },
  poweredOff: { key: "action.start",  action: "start" },
  paused:     { key: "action.resume", action: "resume" },
  suspended:  { key: "action.start",  action: "start" },
};

interface Props {
  vm: VmEntry;
  onStateChange: () => void;
}

export function VmCard({ vm, onStateChange }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();
  const color = STATE_COLOR[vm.state];
  const icon = STATE_ICON[vm.state];
  const stateLabel = t(STATE_KEY[vm.state]);
  const actionDef = QUICK_ACTION[vm.state];

  async function handleAction(e: React.MouseEvent) {
    e.stopPropagation();
    if (!actionDef || busy) return;
    setBusy(true);
    await fetch(`/api/vms/${vm.id}/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: actionDef.action }),
    });
    setBusy(false);
    onStateChange();
  }

  return (
    <div
      onClick={() => router.push(`/vms/${vm.id}`)}
      style={{
        border: "1px solid var(--bg-border)",
        padding: "1.25rem",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        transition: "border-color 0.1s",
        position: "relative",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--bg-border)")
      }
    >
      {/* VM 이름 */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "0.03em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {vm.name}
      </div>

      {/* 상태 뱃지 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "13px",
          color,
        }}
      >
        <span style={{ fontSize: "10px" }}>{icon}</span>
        <span>{stateLabel}</span>
      </div>

      {/* IP */}
      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        {vm.ip ?? "—"}
      </div>

      {/* 빠른 액션 버튼 */}
      {actionDef && (
        <button
          onClick={handleAction}
          disabled={busy}
          style={{
            marginTop: "0.5rem",
            background: "transparent",
            border: `1px solid ${busy ? "var(--bg-border)" : color}`,
            color: busy ? "var(--text-muted)" : color,
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            padding: "0.3rem 0.6rem",
            cursor: busy ? "not-allowed" : "pointer",
            letterSpacing: "0.04em",
            alignSelf: "flex-start",
            transition: "opacity 0.1s",
          }}
        >
          {busy ? "···" : `[${t(actionDef.key)}]`}
        </button>
      )}
    </div>
  );
}
