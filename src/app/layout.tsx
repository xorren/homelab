import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { LocaleProvider } from "@/contexts/LocaleContext";

export const metadata: Metadata = {
  title: "homelab",
  description: "Personal VM management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <Shell>{children}</Shell>
        </LocaleProvider>
      </body>
    </html>
  );
}
