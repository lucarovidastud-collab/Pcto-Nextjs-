import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <Suspense fallback={null}>{children}</Suspense>
    </DashboardShell>
  );
}
