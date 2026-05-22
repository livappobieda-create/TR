import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingBackground } from "@/components/ui/FloatingBackground";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <FloatingBackground />
      <DashboardNav username={session.username} />
      {/* Extra bottom padding on mobile for the bottom nav bar */}
      <main className="px-3 sm:px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto pb-24 md:pb-10 relative z-10">
        {children}
      </main>
      {/* Mobile bottom tab navigation */}
      <MobileBottomNav />
    </div>
  );
}
