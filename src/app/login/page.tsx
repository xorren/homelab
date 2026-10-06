"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(t("login.error"));
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.title}>homelab</div>
        <div style={styles.subtitle}>{t("login.subtitle")}</div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.placeholder")}
            autoFocus
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "..." : t("login.button")}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    border: "1px solid var(--bg-border)",
    padding: "2.5rem 2rem",
    minWidth: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  title: {
    color: "var(--accent)",
    fontSize: "20px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "12px",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    background: "var(--bg-surface)",
    border: "1px solid var(--bg-border)",
    color: "var(--text)",
    padding: "0.5rem 0.75rem",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  error: {
    color: "#ff4444",
    fontSize: "12px",
  },
  button: {
    background: "transparent",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    padding: "0.5rem 1rem",
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
};
