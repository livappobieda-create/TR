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
    if (body.initialBalance !== undefined) data.initialBalance = Number(body.initialBalance);
    if (body.currentBalance !== undefined) data.currentBalance = Number(body.currentBalance);
    if (body.accountType !== undefined) data.accountType = body.accountType as AccountType;
    if (body.isFunded !== undefined) data.isFunded = Boolean(body.isFunded);
    if (body.notes !== undefined) data.notes = body.notes || null;

    // Nullable funded fields
    const nullableNum = (v: unknown) =>
      v === null || v === "" || v === undefined ? null : Number(v);

    if ("propFirmName" in body) data.propFirmName = body.propFirmName || null;
    if ("challengeSize" in body) data.challengeSize = nullableNum(body.challengeSize);
    if ("profitTarget" in body) data.profitTarget = nullableNum(body.profitTarget);
    if ("dailyDrawdownLimit" in body) data.dailyDrawdownLimit = nullableNum(body.dailyDrawdownLimit);
    if ("maxDrawdownLimit" in body) data.maxDrawdownLimit = nullableNum(body.maxDrawdownLimit);
    if ("currentDrawdown" in body) data.currentDrawdown = nullableNum(body.currentDrawdown);
    if ("currentProfitProgress" in body)
      data.currentProfitProgress = nullableNum(body.currentProfitProgress);
    if (body.phase !== undefined) data.phase = body.phase as AccountPhase;
    if (body.phaseDaysRemaining !== undefined)
      data.phaseDaysRemaining = Number(body.phaseDaysRemaining);

    const account = await prisma.tradingAccount.update({ where: { id }, data });
    return NextResponse.json({ account });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
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

    // Delete all daily entries first (foreign key constraint)
    await prisma.dailyEntry.deleteMany({ where: { accountId: id } });
    await prisma.tradingAccount.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
