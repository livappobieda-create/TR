import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { tradeSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ error: "accountId required" }, { status: 400 });
    }

    const trades = await prisma.trade.findMany({
      where: { accountId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error("[API/Trades] Error fetching trades:", error);
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = tradeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const trade = await prisma.trade.create({
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
    });

    return NextResponse.json({ trade });
  } catch (error) {
    console.error("[API/Trades] Error creating trade:", error);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}
