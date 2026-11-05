import { NextResponse } from "next/server";
import {
  getCashbillConfig,
  verifyNotificationSign,
} from "@/lib/payments/cashbill-client";
import { blikProvider } from "@/lib/payments/cashbill-provider";
import { getPaymentStore, savePayment } from "@/lib/payments/store";

export const runtime = "nodejs";

async function handleNotify(request: Request) {
  const url = new URL(request.url);
  const cmd = url.searchParams.get("cmd") || "";
  const args = url.searchParams.get("args") || "";
  const sign = url.searchParams.get("sign") || "";

  if (!cmd || !args || !sign) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  let secretKey: string;
  try {
    secretKey = getCashbillConfig().secretKey;
  } catch {
    return new NextResponse("CashBill not configured", { status: 503 });
  }

  if (!verifyNotificationSign(cmd, args, sign, secretKey)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  try {
    if (cmd === "transactionStatusChanged") {
      const paymentId = args.split(",")[0]?.trim();
      if (paymentId) {
        const known = await blikProvider.getPayment(paymentId);
        if (known) {
          await blikProvider.refreshPayment(paymentId, { force: true });
        }
      }
    }

    if (cmd === "blikDeclinedEvent") {
      const [paymentId, reason] = args.split(",").map((part) => part.trim());
      if (paymentId) {
        const existing = getPaymentStore().get(paymentId);
        if (existing) {
          const refreshed =
            (await blikProvider.refreshPayment(paymentId, { force: true })) ??
            existing;
          savePayment({
            ...refreshed,
            status: "failed",
            declineReason: reason || refreshed.declineReason,
            cashbillStatus: refreshed.cashbillStatus || "NegativeFinish",
          });
        }
      }
    }
  } catch {
    // Valid signature but processing failed — ask CashBill to retry.
    return new NextResponse("Processing error", { status: 500 });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  return handleNotify(request);
}

export async function POST(request: Request) {
  return handleNotify(request);
}
