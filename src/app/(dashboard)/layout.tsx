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
  try {
    console.log("[DashboardLayout] Rendering layout...");
    // TEMPORARY DEBUG: Disable auth redirect
    // const session = await getSession();
    // if (!session) redirect("/login");

    const session = { username: "DebugUser" };

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
  } catch (error) {
    console.error("[DashboardLayout] CRITICAL ERROR:", error);
    return (
      <div className="p-10 text-red-500">
        <h1>Dashboard Layout Crash</h1>
        <pre>{error instanceof Error ? error.stack : String(error)}</pre>
      </div>
    );
  }
}

