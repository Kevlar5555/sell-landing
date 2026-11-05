import { NextResponse } from "next/server";
import { blikProvider } from "@/lib/payments/demo-provider";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const payment = await blikProvider.getPayment(id);

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
    demo: true,
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
      demo: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nie udało się potwierdzić płatności.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
