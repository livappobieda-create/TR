import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AccountPhase, AccountType } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.tradingAccount.findFirst({
    where: { id, userId: session.userId },
    include: { dailyEntries: { orderBy: { date: "asc" } } },
  });

  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ account });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.tradingAccount.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();

    // Build update data object — only include fields present in body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};

    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.initialBalance !== undefined && !isNaN(Number(body.initialBalance))) data.initialBalance = Number(body.initialBalance);
    if (body.currentBalance !== undefined && !isNaN(Number(body.currentBalance))) data.currentBalance = Number(body.currentBalance);
    if (body.accountType !== undefined) data.accountType = body.accountType as AccountType;
    if (body.isFunded !== undefined) data.isFunded = Boolean(body.isFunded);
    if (body.notes !== undefined) data.notes = body.notes || null;

    // Nullable funded fields
    const nullableNum = (v: unknown) => {
      if (v === null || v === "" || v === undefined) return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };
    const requiredNum = (v: unknown, fallback: number = 0) => {
      if (v === null || v === "" || v === undefined) return fallback;
      const num = Number(v);
      return isNaN(num) ? fallback : num;
    };

    if ("propFirmName" in body) data.propFirmName = body.propFirmName || null;
    if ("challengeSize" in body) data.challengeSize = nullableNum(body.challengeSize);
    if ("profitTarget" in body) data.profitTarget = nullableNum(body.profitTarget);
    if ("dailyDrawdownLimit" in body) data.dailyDrawdownLimit = nullableNum(body.dailyDrawdownLimit);
    if ("maxDrawdownLimit" in body) data.maxDrawdownLimit = nullableNum(body.maxDrawdownLimit);
    if ("currentDrawdown" in body) data.currentDrawdown = requiredNum(body.currentDrawdown, 0);
    if ("currentProfitProgress" in body) data.currentProfitProgress = requiredNum(body.currentProfitProgress, 0);
    if (body.phase !== undefined) data.phase = body.phase as AccountPhase;
    
    if (body.phaseDaysRemaining !== undefined) {
      data.phaseDaysRemaining = requiredNum(body.phaseDaysRemaining, 30);
    }

    if (data.isFunded === false) {
      data.propFirmName = null;
      data.challengeSize = null;
      data.profitTarget = null;
      data.dailyDrawdownLimit = null;
      data.maxDrawdownLimit = null;
      data.currentDrawdown = 0;
      data.currentProfitProgress = 0;
      data.phaseDaysRemaining = 30;
      data.phase = "FUNDED";
    }

    const account = await prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.tradingAccount.update({ where: { id }, data });

      // Handle deposit/withdrawal transactions if requested during balance edit
      if (
        body.transaction &&
        (body.transaction.type === "DEPOSIT" || body.transaction.type === "WITHDRAWAL") &&
        Number(body.transaction.amount) > 0
      ) {
        await tx.transaction.create({
          data: {
            accountId: id,
            type: body.transaction.type,
            amount: Number(body.transaction.amount),
            date: new Date(),
            status: "COMPLETED",
            notes: body.transaction.notes || null,
          },
        });
      }

      return updatedAccount;
    });

    return NextResponse.json({ account });
  } catch (e: any) {
    console.error("[API/Accounts] Update error:", e);
    return NextResponse.json({ error: e.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.tradingAccount.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete all related records first (foreign key constraint)
    await prisma.trade.deleteMany({ where: { accountId: id } });
    await prisma.transaction.deleteMany({ where: { accountId: id } });
    await prisma.dailyEntry.deleteMany({ where: { accountId: id } });
    
    await prisma.tradingAccount.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.tradingAccount.findFirst({
      where: { id, userId: session.userId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const action = body.action;

    if (action === "RESET") {
      // Wipe trades and transactions, reset balance to initial
      await prisma.trade.deleteMany({ where: { accountId: id } });
      await prisma.transaction.deleteMany({ where: { accountId: id } });
      await prisma.dailyEntry.deleteMany({ where: { accountId: id } });

      const account = await prisma.tradingAccount.update({
        where: { id },
        data: { currentBalance: existing.initialBalance }
      });
      return NextResponse.json({ success: true, account });
    }

    if (action === "DUPLICATE") {
      // Create a copy of the account settings (no trades/transactions)
      const newAccount = await prisma.tradingAccount.create({
        data: {
          userId: session.userId,
          name: `${existing.name} (Copy)`,
          initialBalance: existing.initialBalance,
          currentBalance: existing.currentBalance,
          accountType: existing.accountType,
          isFunded: existing.isFunded,
          propFirmName: existing.propFirmName,
          challengeSize: existing.challengeSize,
          profitTarget: existing.profitTarget,
          dailyDrawdownLimit: existing.dailyDrawdownLimit,
          maxDrawdownLimit: existing.maxDrawdownLimit,
          phase: existing.phase,
          phaseDaysRemaining: existing.phaseDaysRemaining,
        }
      });
      return NextResponse.json({ success: true, account: newAccount });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
