import { NextResponse } from "next/server";
import { blikProvider } from "@/lib/payments/cashbill-provider";
import { takeRateLimit } from "@/lib/payments/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function readAccessToken(request: Request): string {
  const header = request.headers.get("x-payment-token");
  if (header?.trim()) return header.trim();
  const url = new URL(request.url);
  return url.searchParams.get("token")?.trim() || "";
}

function unauthorized() {
  return NextResponse.json(
    { error: "Brak uprawnień do tej płatności." },
    { status: 403 },
  );
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const accessToken = readAccessToken(request);
  if (!accessToken) return unauthorized();

  const limited = takeRateLimit(`blik-status:${id}:${accessToken}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Zbyt wiele zapytań o status." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const existing = await blikProvider.getPayment(id);
  if (!existing || existing.accessToken !== accessToken) {
    return unauthorized();
  }

  const payment = (await blikProvider.refreshPayment(id)) ?? existing;

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

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const accessToken = readAccessToken(request);
  if (!accessToken) return unauthorized();

  try {
    const payment = await blikProvider.confirmPayment(id, accessToken);
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
    const status = message.includes("uprawnień") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
