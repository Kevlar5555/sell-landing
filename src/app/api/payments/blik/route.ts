import { NextResponse } from "next/server";
import { blikProvider } from "@/lib/payments/cashbill-provider";
import { takeRateLimit } from "@/lib/payments/rate-limit";
import { getCustomerIp, getReturnBaseUrl } from "@/lib/payments/request-meta";

export const runtime = "nodejs";

const PRODUCT = {
  name: "Świeca „Bursztyn”",
  amountPln: 79,
};

export async function POST(request: Request) {
  try {
    const customerIp = await getCustomerIp();
    const limited = takeRateLimit(`blik-create:${customerIp}`, 5, 10 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Zbyt wiele prób płatności. Spróbuj za chwilę." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = (await request.json()) as { code?: string; email?: string };
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Podaj poprawny 6-cyfrowy kod BLIK." },
        { status: 400 },
      );
    }

    const payment = await blikProvider.createBlikPayment({
      code,
      email,
      amountPln: PRODUCT.amountPln,
      productName: PRODUCT.name,
      customerIp,
      returnBaseUrl: await getReturnBaseUrl(request),
    });

    return NextResponse.json({
      id: payment.id,
      orderId: payment.orderId,
      amountPln: payment.amountPln,
      status: payment.status,
      accessToken: payment.accessToken,
      provider: "cashbill",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nie udało się utworzyć płatności.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
