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

  try {
    const { secretKey } = getCashbillConfig();
    if (!verifyNotificationSign(cmd, args, sign, secretKey)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    if (cmd === "transactionStatusChanged") {
      const paymentId = args.split(",")[0]?.trim();
      if (paymentId) {
        await blikProvider.refreshPayment(paymentId);
      }
    }

    if (cmd === "blikDeclinedEvent") {
      const [paymentId, reason] = args.split(",").map((part) => part.trim());
      if (paymentId) {
        const existing = getPaymentStore().get(paymentId);
        const refreshed = await blikProvider.refreshPayment(paymentId);
        const base = refreshed ?? existing;
        if (base) {
          savePayment({
            ...base,
            status: "failed",
            declineReason: reason || base.declineReason,
            cashbillStatus: base.cashbillStatus || "NegativeFinish",
          });
        }
      }
    }
  } catch {
    // Still acknowledge when secrets are missing locally so CashBill does not hammer.
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
