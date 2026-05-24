import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ error: "accountId required" }, { status: 400 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("[API/Transactions] Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          ...parsed.data,
          date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        },
      });

      const amountAdjustment = parsed.data.type === "DEPOSIT" ? parsed.data.amount : -parsed.data.amount;

      await tx.tradingAccount.update({
        where: { id: parsed.data.accountId },
        data: { currentBalance: { increment: amountAdjustment } },
      });

      return newTx;
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("[API/Transactions] Error creating transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
