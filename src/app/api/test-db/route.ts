import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[API/TestDB] Attempting Prisma connection...");
    const userCount = await prisma.user.count();
    console.log(`[API/TestDB] Success, found ${userCount} users`);
    return NextResponse.json({ status: "success", userCount });
  } catch (error) {
    console.error("[API/TestDB] CRITICAL PRISMA ERROR:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
