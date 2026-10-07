"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HostPanel } from "./HostPanel";
import { useTranslation } from "@/hooks/useTranslation";
import type { Locale } from "@/contexts/LocaleContext";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();

  const NAV_ITEMS = [
    { href: "/",          label: t("nav.dashboard") },
    { href: "/vms",       label: t("nav.vms") },
    { href: "/processes", label: t("nav.processes") },
    { href: "/network",   label: t("nav.network") },
    { href: "/settings",  label: t("nav.settings") },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function toggleLocale() {
    setLocale(locale === "en" ? "ko" : "en" as Locale);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* 상단 타이틀 바 */}
      <header
        style={{
          borderBottom: "1px solid var(--bg-border)",
          padding: "0 1.5rem",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em" }}>
          homelab
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            {t("shell.tagline")}
          </span>
          {/* 언어 토글 */}
          <button
            onClick={toggleLocale}
            style={{
              background: "transparent",
              border: "1px solid var(--bg-border)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              cursor: "pointer",
              padding: "0.15rem 0.45rem",
              letterSpacing: "0.05em",
              transition: "border-color 0.1s, color 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--bg-border)";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {locale === "en" ? "KO" : "EN"}
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              cursor: "pointer",
              padding: "0",
              letterSpacing: "0.03em",
            }}
          >
            {t("shell.logout")}
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* 좌측 네비게이션 */}
        <nav
          style={{
            width: "180px",
            borderRight: "1px solid var(--bg-border)",
            padding: "1rem 0",
            flexShrink: 0,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block",
                  padding: "0.5rem 1.5rem",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  borderLeft: active
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                  fontSize: "13px",
                  textDecoration: "none",
                  transition: "color 0.1s",
                }}
              >
                {active ? "> " : "  "}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 메인 콘텐츠 */}
        <main style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
          {children}
        </main>
      </div>

      {/* 하단 호스트 리소스 바 */}
      <HostPanel />
    </div>
  );
}
