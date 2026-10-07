"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface PortEntry {
  protocol: string;
  localAddress: string;
  localPort: number;
  state: string;
  pid: number;
}

interface FirewallRule {
  name: string;
  direction: string;
  action: string;
  enabled: boolean;
  protocol: string;
  localPort: string;
  remotePort: string;
}

type Tab = "ports" | "firewall";

function tabStyle(active: boolean): React.CSSProperties {
  return {
    background: "transparent",
    border: "none",
    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
    color: active ? "var(--accent)" : "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "0.4rem 1rem 0.4rem 0",
    cursor: "pointer",
    letterSpacing: "0.05em",
  };
}

const s: Record<string, React.CSSProperties> = {
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "12px" },
  th: {
    color: "var(--text-muted)",
    fontSize: "11px",
    textAlign: "left" as const,
    padding: "0.4rem 0.75rem",
    borderBottom: "1px solid var(--bg-border)",
    letterSpacing: "0.06em",
  },
  td: {
    padding: "0.35rem 0.75rem",
    borderBottom: "1px solid var(--bg-border)",
    fontFamily: "var(--font-mono)",
  },
  allow: { color: "#4ade80", fontSize: "11px" },
  block: { color: "#f87171", fontSize: "11px" },
  inbound: { color: "#60a5fa", fontSize: "11px" },
  outbound: { color: "#fb923c", fontSize: "11px" },
  refreshBtn: {
    background: "transparent",
    border: "1px solid var(--bg-border)",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "0.25rem 0.6rem",
    cursor: "pointer",
  },
};

export function NetworkPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("ports");
  const [ports, setPorts] = useState<PortEntry[]>([]);
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [filterPort, setFilterPort] = useState("");
  const [filterRule, setFilterRule] = useState("");

  async function fetchPorts() {
    setLoadingPorts(true); setPortsError(null);
    const res = await fetch("/api/network/ports");
    const data = await res.json();
    setPorts(data.ports ?? []);
    if (data.error) setPortsError(data.error);
    setLoadingPorts(false);
  }

  async function fetchRules() {
    setLoadingRules(true); setRulesError(null);
    const res = await fetch("/api/network/firewall");
    const data = await res.json();
    setRules(data.rules ?? []);
    if (data.error) setRulesError(data.error);
    setLoadingRules(false);
  }

  useEffect(() => { fetchPorts(); }, []);
  useEffect(() => { if (tab === "firewall" && rules.length === 0 && !loadingRules) fetchRules(); }, [tab]);

  const filteredPorts = ports.filter((p) =>
    !filterPort || String(p.localPort).includes(filterPort) || p.localAddress.includes(filterPort)
  );
  const filteredRules = rules.filter((r) =>
    !filterRule || r.name.toLowerCase().includes(filterRule.toLowerCase()) || r.localPort.includes(filterRule)
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h1 style={{ color: "var(--accent)", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {t("nav.network")}
        </h1>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--bg-border)", marginBottom: "1.25rem" }}>
        <button style={tabStyle(tab === "ports")} onClick={() => setTab("ports")}>{t("network.tabPorts")}</button>
        <button style={tabStyle(tab === "firewall")} onClick={() => setTab("firewall")}>{t("network.tabFirewall")}</button>
      </div>

      {/* 포트 탭 */}
      {tab === "ports" && (
        <div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
            <input
              style={{ background: "var(--bg)", border: "1px solid var(--bg-border)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "0.3rem 0.6rem", outline: "none", width: "180px" }}
              placeholder={t("network.filterPort")}
              value={filterPort}
              onChange={(e) => setFilterPort(e.target.value)}
            />
            <button style={s.refreshBtn} onClick={fetchPorts}>{loadingPorts ? "…" : t("network.refresh")}</button>
            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{filteredPorts.length} {t("network.entries")}</span>
          </div>
          {portsError && <div style={{ color: "#f87171", fontSize: "11px", marginBottom: "0.75rem" }}>{portsError}</div>}
          <div style={{ overflowX: "auto" as const }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{t("network.colPort")}</th>
                  <th style={s.th}>{t("network.colAddress")}</th>
                  <th style={s.th}>{t("network.colProtocol")}</th>
                  <th style={s.th}>{t("network.colState")}</th>
                  <th style={s.th}>PID</th>
                </tr>
              </thead>
              <tbody>
                {filteredPorts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ ...s.td, color: "var(--accent)", fontWeight: 600 }}>{p.localPort}</td>
                    <td style={s.td}>{p.localAddress}</td>
                    <td style={{ ...s.td, color: "var(--text-muted)" }}>{p.protocol}</td>
                    <td style={{ ...s.td, color: "#4ade80", fontSize: "11px" }}>{p.state}</td>
                    <td style={{ ...s.td, color: "var(--text-muted)" }}>{p.pid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 방화벽 탭 */}
      {tab === "firewall" && (
        <div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
            <input
              style={{ background: "var(--bg)", border: "1px solid var(--bg-border)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: "12px", padding: "0.3rem 0.6rem", outline: "none", width: "220px" }}
              placeholder={t("network.filterRule")}
              value={filterRule}
              onChange={(e) => setFilterRule(e.target.value)}
            />
            <button style={s.refreshBtn} onClick={fetchRules}>{loadingRules ? "…" : t("network.refresh")}</button>
            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{filteredRules.length} {t("network.entries")}</span>
          </div>
          {rulesError && <div style={{ color: "#f87171", fontSize: "11px", marginBottom: "0.75rem" }}>{rulesError}</div>}
          {loadingRules && <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>{t("network.loading")}</div>}
          <div style={{ overflowX: "auto" as const }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>{t("network.colName")}</th>
                  <th style={s.th}>{t("network.colDirection")}</th>
                  <th style={s.th}>{t("network.colAction")}</th>
                  <th style={s.th}>{t("network.colProtocol")}</th>
                  <th style={s.th}>{t("network.colLocalPort")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...s.td, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={r.name}>{r.name}</td>
                    <td style={{ ...s.td }}>
                      <span style={r.direction === "Inbound" || r.direction === "2" ? s.inbound : s.outbound}>
                        {r.direction === "2" ? "Inbound" : r.direction === "3" ? "Outbound" : r.direction}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={r.action === "Allow" || r.action === "2" ? s.allow : s.block}>
                        {r.action === "2" ? "Allow" : r.action === "4" ? "Block" : r.action}
                      </span>
                    </td>
                    <td style={{ ...s.td, color: "var(--text-muted)" }}>{r.protocol}</td>
                    <td style={{ ...s.td, color: "var(--accent)" }}>{r.localPort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
