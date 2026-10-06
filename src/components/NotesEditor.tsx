"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  vmId: string;
}

export function NotesEditor({ vmId }: Props) {
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`/api/vms/${vmId}/notes`)
      .then((r) => r.json())
      .then((data: { content: string; updated_at: number | null }) => {
        setContent(data.content ?? "");
        setSavedAt(data.updated_at);
        initialLoad.current = false;
      })
      .catch(() => {
        initialLoad.current = false;
      });
  }, [vmId]);

  const save = useCallback(
    async (text: string) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/vms/${vmId}/notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        const data = await res.json() as { ok: boolean; updated_at: number | null };
        if (data.ok) {
          setSavedAt(data.updated_at);
          setStatus("saved");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    },
    [vmId]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setContent(text);
    setStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(text), 1000);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function formatSavedAt(ts: number | null) {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString();
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {t("notes.title")}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {status === "saving" && t("notes.saving")}
          {status === "saved" && savedAt && t("notes.saved", { time: formatSavedAt(savedAt) ?? "" })}
          {status === "error" && (
            <span style={{ color: "#ff4444" }}>{t("notes.error")}</span>
          )}
        </span>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        placeholder={t("notes.placeholder")}
        style={{
          width: "100%",
          minHeight: "200px",
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
          color: "var(--text)",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          lineHeight: "1.6",
          padding: "0.75rem",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.1s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--bg-border)";
        }}
      />
    </div>
  );
}
