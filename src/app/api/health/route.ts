import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[API/Health] Health check requested");
    return NextResponse.json({ status: "ok", mode: "debug-no-db" });
  } catch (error) {
    console.error("[API/Health] CRITICAL ERROR:", error);
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}

