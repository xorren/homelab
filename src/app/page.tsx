import { redirect } from "next/navigation";
import { getSetting } from "@/lib/db";
import { VmGrid } from "@/components/VmGrid";

export default function DashboardPage() {
  if (!getSetting("password_hash")) {
    redirect("/setup");
  }

  return <VmGrid />;
}
