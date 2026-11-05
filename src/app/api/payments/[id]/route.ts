import { NextResponse } from "next/server";
import { blikProvider } from "@/lib/payments/cashbill-provider";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const payment =
    (await blikProvider.refreshPayment(id)) ?? (await blikProvider.getPayment(id));

  if (!payment) {
    return NextResponse.json(
      { error: "Nie znaleziono płatności." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: payment.id,
    orderId: payment.orderId,
    amountPln: payment.amountPln,
    status: payment.status,
    paidAt: payment.paidAt ?? null,
    cashbillStatus: payment.cashbillStatus ?? null,
    provider: "cashbill",
  });
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const payment = await blikProvider.confirmPayment(id);
    return NextResponse.json({
      id: payment.id,
      orderId: payment.orderId,
      amountPln: payment.amountPln,
      status: payment.status,
      paidAt: payment.paidAt ?? null,
      cashbillStatus: payment.cashbillStatus ?? null,
      provider: "cashbill",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nie udało się potwierdzić płatności.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
