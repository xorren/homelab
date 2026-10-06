"use client";

import { useState, useEffect, useCallback } from "react";
import { SshTerminal } from "./SshTerminal";
import { useTranslation } from "@/hooks/useTranslation";
import type { VmEntry } from "@/app/api/vms/route";

type VmState = VmEntry["state"];

const STATE_COLOR: Record<VmState, string> = {
  poweredOn:  "#00e5ff",
  poweredOff: "#606060",
  paused:     "#ffcc00",
  suspended:  "#9966ff",
};

const STATE_ICON: Record<VmState, string> = {
  poweredOn:  "▶",
  poweredOff: "■",
  paused:     "⏸",
  suspended:  "⏸",
};

const STATE_KEY: Record<VmState, string> = {
  poweredOn:  "state.running",
  poweredOff: "state.stopped",
  paused:     "state.paused",
  suspended:  "state.suspended",
};

interface ButtonDef { key: string; action: string; accent?: boolean }
const BUTTONS: Record<VmState, ButtonDef[]> = {
  poweredOn:  [{ key: "action.stop",  action: "stop" }, { key: "action.pause", action: "pause" }],
  poweredOff: [{ key: "action.start", action: "start", accent: true }],
  paused:     [{ key: "action.resume", action: "resume", accent: true }, { key: "action.stop", action: "stop" }],
  suspended:  [{ key: "action.start", action: "start", accent: true }],
};

interface Props {
  vmId: string;
  vmName: string;
}

export function VmPowerPanel({ vmId, vmName }: Props) {
  const [state, setState] = useState<VmState | null>(null);
  const [ip, setIp] = useState<string | null>(null);
  const [overrideIp, setOverrideIp] = useState<string | null>(null);
  const [overrideInput, setOverrideInput] = useState("");
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [sshUser, setSshUser] = useState("root");
  const [showUserInput, setShowUserInput] = useState(false);
  const { t } = useTranslation();

  const fetchState = useCallback(async () => {
    try {
      const [vmRes, overrideRes] = await Promise.all([
        fetch(`/api/vms/${vmId}`),
        fetch(`/api/vms/${vmId}/ip-override`),
      ]);
      if (!vmRes.ok) { setError(t("vm.errorVmrest")); return; }
      const vmData = await vmRes.json();
      const overrideData = overrideRes.ok ? await overrideRes.json() : { ip: null };
      setState(vmData.state);
      setIp(vmData.ip ?? null);
      setOverrideIp(overrideData.ip ?? null);
      setError(null);
    } catch {
      setError(t("vm.errorVmrest"));
    }
  }, [vmId, t]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 10_000);
    return () => clearInterval(id);
  }, [fetchState]);

  async function handleAction(action: string) {
    if (busy) return;
    setBusy(action);
    const res = await fetch(`/api/vms/${vmId}/power`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? t("vm.errorAction"));
    } else {
      setTimeout(fetchState, 800);
    }
  }

  async function saveOverrideIp() {
    const res = await fetch(`/api/vms/${vmId}/ip-override`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: overrideInput || null }),
    });
    if (res.ok) {
      const d = await res.json();
      setOverrideIp(d.ip);
      setShowOverrideInput(false);
    }
  }

  const effectiveIp = overrideIp ?? ip;
  const canSsh = state === "poweredOn" && !!effectiveIp;
  const color = state ? STATE_COLOR[state] : null;
  const buttons = state ? BUTTONS[state] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 헤더 */}
      <div>
        <h1 style={{ color: "var(--accent)", fontSize: "16px", letterSpacing: "0.06em", fontWeight: 700 }}>
          {vmName.toUpperCase()}
        </h1>

        {/* IP 표시 + 오버라이드 */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            {effectiveIp ?? "—"}
            {overrideIp && (
              <span style={{ color: "#ffcc00", marginLeft: "0.4rem", fontSize: "11px" }}>
                {t("vm.override")}
              </span>
            )}
          </span>
          <button
            onClick={() => {
              setOverrideInput(overrideIp ?? ip ?? "");
              setShowOverrideInput((v) => !v);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {t("vm.setIp")}
          </button>
        </div>

        {/* IP 오버라이드 입력 */}
        {showOverrideInput && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={overrideInput}
              onChange={(e) => setOverrideInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveOverrideIp()}
              placeholder="192.168.x.x"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--accent)",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                padding: "0.3rem 0.5rem",
                outline: "none",
                width: "160px",
              }}
              autoFocus
            />
            <button
              onClick={saveOverrideIp}
              style={{
                background: "transparent",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "0.3rem 0.6rem",
                cursor: "pointer",
              }}
            >
              {t("vm.save")}
            </button>
            {overrideIp && (
              <button
                onClick={async () => {
                  await fetch(`/api/vms/${vmId}/ip-override`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ip: null }),
                  });
                  setOverrideIp(null);
                  setShowOverrideInput(false);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--text-muted)",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "0.3rem 0.6rem",
                  cursor: "pointer",
                }}
              >
                {t("vm.clear")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 상태 */}
      {state && color && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "11px", color }}>{STATE_ICON[state]}</span>
          <span style={{ fontSize: "14px", color }}>{t(STATE_KEY[state])}</span>
        </div>
      )}

      {!state && !error && (
        <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{t("vm.loading")}</div>
      )}

      {error && (
        <div style={{ color: "#ff4444", fontSize: "12px", borderLeft: "1px solid #ff4444", paddingLeft: "0.75rem" }}>
          ! {error}
        </div>
      )}

      {/* 전원 제어 버튼 */}
      {buttons.length > 0 && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {buttons.map((btn) => {
            const isActive = busy === btn.action;
            const isDisabled = !!busy;
            return (
              <button
                key={btn.action}
                onClick={() => handleAction(btn.action)}
                disabled={isDisabled}
                style={{
                  background: "transparent",
                  border: `1px solid ${isDisabled ? "var(--bg-border)" : btn.accent ? "var(--accent)" : "var(--text-muted)"}`,
                  color: isDisabled ? "var(--text-muted)" : btn.accent ? "var(--accent)" : "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  padding: "0.5rem 1.25rem",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  minWidth: "90px",
                  transition: "border-color 0.1s, color 0.1s",
                }}
              >
                {isActive ? "···" : t(btn.key)}
              </button>
            );
          })}
        </div>
      )}

      {/* SSH 터미널 버튼 */}
      <div style={{ borderTop: "1px solid var(--bg-border)", paddingTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowTerminal((v) => !v)}
          disabled={!canSsh}
          title={!canSsh ? (state !== "poweredOn" ? t("vm.ipNotRunning") : t("vm.ipNotSet")) : ""}
          style={{
            background: "transparent",
            border: `1px solid ${canSsh ? "var(--accent)" : "var(--bg-border)"}`,
            color: canSsh ? "var(--accent)" : "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            padding: "0.5rem 1.25rem",
            cursor: canSsh ? "pointer" : "not-allowed",
            letterSpacing: "0.04em",
            transition: "border-color 0.1s, color 0.1s",
          }}
        >
          {showTerminal ? t("vm.closeTerminal") : t("vm.openTerminal")}
        </button>

        {canSsh && !showTerminal && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
              {t("vm.user")}
            </span>
            {showUserInput ? (
              <input
                type="text"
                value={sshUser}
                onChange={(e) => setSshUser(e.target.value)}
                onBlur={() => setShowUserInput(false)}
                onKeyDown={(e) => e.key === "Enter" && setShowUserInput(false)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--accent)",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "0.2rem 0.4rem",
                  outline: "none",
                  width: "100px",
                }}
                autoFocus
              />
            ) : (
              <button
                onClick={() => setShowUserInput(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {sshUser}
              </button>
            )}
          </div>
        )}
      </div>

      {/* SSH 터미널 패널 */}
      {showTerminal && canSsh && (
        <SshTerminal
          vmId={vmId}
          ip={effectiveIp!}
          user={sshUser}
          onClose={() => setShowTerminal(false)}
        />
      )}
    </div>
  );
}
