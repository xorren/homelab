"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface Server {
  id: string;
  project_id: string;
  name: string;
  role: string;
  command: string;
  port: number | null;
  status: "running" | "stopped";
}

interface Project {
  id: string;
  name: string;
  description: string;
  servers: Server[];
}

const ROLES = ["frontend", "backend", "db", "other"] as const;
const ROLE_COLORS: Record<string, string> = {
  frontend: "#60a5fa",
  backend: "#4ade80",
  db: "#fb923c",
  other: "#a78bfa",
};

function badgeStyle(role: string): React.CSSProperties {
  return {
    fontSize: "10px",
    padding: "0.1rem 0.4rem",
    border: `1px solid ${ROLE_COLORS[role] ?? "#888"}`,
    color: ROLE_COLORS[role] ?? "#888",
    minWidth: "60px",
    textAlign: "center" as const,
  };
}

function dotStyle(running: boolean): React.CSSProperties {
  return {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: running ? "#4ade80" : "var(--text-muted)",
    flexShrink: 0,
  };
}

const s: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid var(--bg-border)",
    marginBottom: "1rem",
    padding: "1rem 1.25rem",
  },
  projectHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  projectName: { color: "var(--accent)", fontSize: "13px", letterSpacing: "0.05em" },
  serverRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.4rem 0",
    borderTop: "1px solid var(--bg-border)",
  },
  btn: {
    background: "transparent",
    border: "1px solid var(--bg-border)",
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "0.2rem 0.5rem",
    cursor: "pointer",
  },
  btnGreen: {
    background: "transparent",
    border: "1px solid #4ade80",
    color: "#4ade80",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "0.2rem 0.5rem",
    cursor: "pointer",
  },
  btnRed: {
    background: "transparent",
    border: "1px solid #f87171",
    color: "#f87171",
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    padding: "0.2rem 0.5rem",
    cursor: "pointer",
  },
  input: {
    background: "var(--bg)",
    border: "1px solid var(--bg-border)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    padding: "0.3rem 0.5rem",
    outline: "none",
  },
};

export function ProcessesPanel() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Record<string, string[]>>({});

  // 프로젝트 추가 폼
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // 서버 추가 폼 (프로젝트별)
  const [addingServer, setAddingServer] = useState<string | null>(null);
  const [newServer, setNewServer] = useState({ name: "", role: "backend", command: "", port: "" });

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/processes");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/processes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
    });
    if (res.ok) {
      setNewProjectName(""); setNewProjectDesc(""); setShowAddProject(false);
      fetchProjects();
    }
  }

  async function deleteProject(id: string) {
    await fetch(`/api/processes?id=${id}`, { method: "DELETE" });
    fetchProjects();
  }

  async function addServer(e: React.FormEvent, projectId: string) {
    e.preventDefault();
    const res = await fetch("/api/processes/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        name: newServer.name,
        role: newServer.role,
        command: newServer.command,
        port: newServer.port ? parseInt(newServer.port) : null,
      }),
    });
    if (res.ok) {
      setAddingServer(null); setNewServer({ name: "", role: "backend", command: "", port: "" });
      fetchProjects();
    }
  }

  async function deleteServer(id: string) {
    await fetch(`/api/processes/servers/${id}`, { method: "DELETE" });
    fetchProjects();
  }

  async function startServer(id: string) {
    await fetch(`/api/processes/servers/${id}/start`, { method: "POST" });
    fetchProjects();
  }

  async function stopServer(id: string) {
    await fetch(`/api/processes/servers/${id}/stop`, { method: "POST" });
    fetchProjects();
  }

  async function toggleLogs(id: string) {
    if (logs[id] !== undefined) {
      setLogs((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    const res = await fetch(`/api/processes/servers/${id}/logs`);
    if (res.ok) {
      const data = await res.json();
      setLogs((prev) => ({ ...prev, [id]: data.logs }));
    }
  }

  if (loading) return <div style={{ color: "var(--text-muted)" }}>{t("processes.loading")}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ color: "var(--accent)", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {t("nav.processes")}
        </h1>
        <button style={s.btn} onClick={() => setShowAddProject((v) => !v)}>
          {showAddProject ? t("processes.cancelProject") : t("processes.addProject")}
        </button>
      </div>

      {showAddProject && (
        <form onSubmit={addProject} style={{ ...s.card, display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" as const }}>
          <input style={{ ...s.input, flex: "1 1 140px" }} placeholder={t("processes.projectName")} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required />
          <input style={{ ...s.input, flex: "2 1 200px" }} placeholder={t("processes.projectDesc")} value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} />
          <button type="submit" style={s.btnGreen}>{t("processes.create")}</button>
        </form>
      )}

      {projects.length === 0 && !showAddProject && (
        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>{t("processes.empty")}</div>
      )}

      {projects.map((project) => (
        <div key={project.id} style={s.card}>
          <div style={s.projectHeader}>
            <div>
              <span style={s.projectName}>{project.name}</span>
              {project.description && (
                <span style={{ color: "var(--text-muted)", fontSize: "11px", marginLeft: "0.75rem" }}>{project.description}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button style={s.btn} onClick={() => setAddingServer(addingServer === project.id ? null : project.id)}>
                {addingServer === project.id ? t("processes.cancelServer") : "+ server"}
              </button>
              <button style={s.btn} onClick={() => deleteProject(project.id)}>
                {t("processes.deleteProject")}
              </button>
            </div>
          </div>

          {addingServer === project.id && (
            <form onSubmit={(e) => addServer(e, project.id)} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const, marginBottom: "0.75rem", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--bg-border)" }}>
              <input style={{ ...s.input, flex: "1 1 100px" }} placeholder="name" value={newServer.name} onChange={(e) => setNewServer((v) => ({ ...v, name: e.target.value }))} required />
              <select
                style={{ ...s.input, flex: "0 0 auto" }}
                value={newServer.role}
                onChange={(e) => setNewServer((v) => ({ ...v, role: e.target.value }))}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input style={{ ...s.input, flex: "2 1 200px" }} placeholder="command (e.g. npm start)" value={newServer.command} onChange={(e) => setNewServer((v) => ({ ...v, command: e.target.value }))} required />
              <input style={{ ...s.input, flex: "0 0 80px" }} placeholder="port" type="number" value={newServer.port} onChange={(e) => setNewServer((v) => ({ ...v, port: e.target.value }))} />
              <button type="submit" style={s.btnGreen}>{t("processes.add")}</button>
            </form>
          )}

          {project.servers.length === 0 && (
            <div style={{ color: "var(--text-muted)", fontSize: "11px", paddingTop: "0.5rem", borderTop: "1px solid var(--bg-border)" }}>
              {t("processes.noServers")}
            </div>
          )}

          {project.servers.map((srv) => (
            <div key={srv.id}>
              <div style={s.serverRow}>
                <div style={dotStyle(srv.status === "running")} />
                <span style={badgeStyle(srv.role)}>{srv.role}</span>
                <span style={{ flex: 1, fontSize: "12px" }}>{srv.name}</span>
                {srv.port && <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>:{srv.port}</span>}
                <span style={{ color: "var(--text-muted)", fontSize: "11px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }} title={srv.command}>
                  {srv.command}
                </span>
                {srv.status === "stopped" ? (
                  <button style={s.btnGreen} onClick={() => startServer(srv.id)}>{t("processes.start")}</button>
                ) : (
                  <button style={s.btnRed} onClick={() => stopServer(srv.id)}>{t("processes.stop")}</button>
                )}
                <button style={s.btn} onClick={() => toggleLogs(srv.id)}>
                  {logs[srv.id] !== undefined ? t("processes.hideLogs") : t("processes.logs")}
                </button>
                <button style={s.btn} onClick={() => deleteServer(srv.id)}>✕</button>
              </div>
              {logs[srv.id] !== undefined && (
                <pre style={{
                  background: "var(--bg)",
                  border: "1px solid var(--bg-border)",
                  borderTop: "none",
                  padding: "0.5rem 0.75rem",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  maxHeight: "150px",
                  overflow: "auto",
                  whiteSpace: "pre-wrap" as const,
                }}>
                  {logs[srv.id].length === 0 ? "(no output)" : logs[srv.id].join("")}
                </pre>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
