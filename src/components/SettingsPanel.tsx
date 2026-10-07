"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const s: Record<string, React.CSSProperties> = {
  section: {
    border: "1px solid var(--bg-border)",
    padding: "1.25rem",
    marginBottom: "1.25rem",
  },
  heading: {
    color: "var(--accent)",
    fontSize: "11px",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    marginBottom: "1rem",
  },
  row: { display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" },
  label: { color: "var(--text-muted)", fontSize: "12px", minWidth: "140px" },
  input: {
    background: "var(--bg)",
    border: "1px solid var(--bg-border)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    padding: "0.35rem 0.6rem",
    flex: 1,
    outline: "none",
  },
  btn: {
    background: "transparent",
    border: "1px solid var(--bg-border)",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "0.35rem 0.75rem",
    cursor: "pointer",
  },
  btnAccent: {
    background: "transparent",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "0.35rem 0.75rem",
    cursor: "pointer",
  },
};

function statusStyle(ok: boolean | null): React.CSSProperties {
  return { fontSize: "12px", color: ok === null ? "var(--text-muted)" : ok ? "#4ade80" : "#f87171" };
}

export function SettingsPanel() {
  const { t } = useTranslation();

  // 비밀번호 변경
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // vmrest 설정
  const [vmUrl, setVmUrl] = useState("http://127.0.0.1:8697");
  const [vmUser, setVmUser] = useState("admin");
  const [vmPass, setVmPass] = useState("");
  const [vmStatus, setVmStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next !== confirm) {
      setPwMsg({ ok: false, text: t("settings.pw.errorMismatch") });
      return;
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg({ ok: true, text: t("settings.pw.success") });
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      setPwMsg({ ok: false, text: data.error ?? t("settings.pw.error") });
    }
  }

  async function handleSaveVmrest(e: React.FormEvent) {
    e.preventDefault();
    setVmStatus(null);
    const res = await fetch("/api/settings/vmrest", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: vmUrl, username: vmUser, password: vmPass }),
    });
    if (res.ok) setVmStatus({ ok: true, text: t("settings.vmrest.saved") });
    else setVmStatus({ ok: false, text: t("settings.vmrest.saveFailed") });
  }

  async function handleTestVmrest() {
    setVmStatus({ ok: true, text: t("settings.vmrest.testing") });
    const res = await fetch("/api/settings/vmrest", { method: "POST" });
    const data = await res.json();
    if (data.ok) setVmStatus({ ok: true, text: t("settings.vmrest.connected") });
    else setVmStatus({ ok: false, text: `${t("settings.vmrest.failed")} (${data.error ?? data.status})` });
  }

  return (
    <div>
      <h1 style={{ color: "var(--accent)", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
        {t("nav.settings")}
      </h1>

      {/* 비밀번호 변경 */}
      <div style={s.section}>
        <div style={s.heading}>{t("settings.pw.title")}</div>
        <form onSubmit={handleChangePassword}>
          <div style={s.row}>
            <label style={s.label}>{t("settings.pw.current")}</label>
            <input type="password" style={s.input} value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div style={s.row}>
            <label style={s.label}>{t("settings.pw.new")}</label>
            <input type="password" style={s.input} value={next} onChange={(e) => setNext(e.target.value)} required minLength={4} />
          </div>
          <div style={s.row}>
            <label style={s.label}>{t("settings.pw.confirm")}</label>
            <input type="password" style={s.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button type="submit" style={s.btnAccent}>{t("settings.pw.button")}</button>
            {pwMsg && <span style={statusStyle(pwMsg.ok)}>{pwMsg.text}</span>}
          </div>
        </form>
      </div>

      {/* vmrest 설정 */}
      <div style={s.section}>
        <div style={s.heading}>{t("settings.vmrest.title")}</div>
        <form onSubmit={handleSaveVmrest}>
          <div style={s.row}>
            <label style={s.label}>{t("settings.vmrest.url")}</label>
            <input style={s.input} value={vmUrl} onChange={(e) => setVmUrl(e.target.value)} placeholder="http://127.0.0.1:8697" />
          </div>
          <div style={s.row}>
            <label style={s.label}>{t("settings.vmrest.user")}</label>
            <input style={s.input} value={vmUser} onChange={(e) => setVmUser(e.target.value)} placeholder="admin" />
          </div>
          <div style={s.row}>
            <label style={s.label}>{t("settings.vmrest.pass")}</label>
            <input type="password" style={s.input} value={vmPass} onChange={(e) => setVmPass(e.target.value)} placeholder="••••••" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button type="submit" style={s.btnAccent}>{t("settings.vmrest.save")}</button>
            <button type="button" style={s.btn} onClick={handleTestVmrest}>{t("settings.vmrest.test")}</button>
            {vmStatus && <span style={statusStyle(vmStatus.ok)}>{vmStatus.text}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
