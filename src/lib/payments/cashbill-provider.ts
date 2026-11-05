import {
  createCashbillBlikPayment,
  formatAmountPln,
  getCashbillPayment,
  mapCashbillStatus,
} from "./cashbill-client";
import { getPaymentStore, savePayment } from "./store";
import type {
  BlikPayment,
  BlikPaymentProvider,
  CreateBlikPaymentInput,
} from "./types";

function makeOrderId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export class CashbillBlikProvider implements BlikPaymentProvider {
  async createBlikPayment(input: CreateBlikPaymentInput): Promise<BlikPayment> {
    const code = input.code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Kod BLIK musi mieć dokładnie 6 cyfr.");
    }
    const email = input.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Podaj poprawny adres e-mail.");
    }

    const orderId = makeOrderId();
    const amount = formatAmountPln(input.amountPln);
    const returnBase = (
      process.env.CASHBILL_RETURN_BASE?.trim() || input.returnBaseUrl
    ).replace(/\/$/, "");

    const created = await createCashbillBlikPayment({
      title: `${input.productName} · ${orderId}`,
      amount: { value: amount, currencyCode: "PLN" },
      description: input.productName,
      additionalData: orderId,
      paymentChannel: "blik",
      returnUrl: `${returnBase}/?status=ok`,
      personalData: { email },
      options: [
        { name: "ip", value: input.customerIp },
        { name: "blikCode", value: code },
        { name: "companyAddressCity", value: "Warszawa" },
        { name: "companyAddressStreet", value: "KNOT" },
      ],
    });

    const payment: BlikPayment = {
      id: created.id,
      orderId,
      amountPln: input.amountPln,
      status: "pending",
      createdAt: Date.now(),
      provider: "cashbill",
      cashbillStatus: "Start",
    };
    savePayment(payment);
    return payment;
  }

  async confirmPayment(id: string): Promise<BlikPayment> {
    const refreshed = await this.refreshPayment(id);
    if (!refreshed) {
      throw new Error("Nie znaleziono płatności.");
    }
    return refreshed;
  }

  async getPayment(id: string): Promise<BlikPayment | null> {
    return getPaymentStore().get(id) ?? null;
  }

  async refreshPayment(id: string): Promise<BlikPayment | null> {
    const existing = getPaymentStore().get(id);
    try {
      const remote = await getCashbillPayment(id);
      const status = mapCashbillStatus(remote.status);
      const payment: BlikPayment = {
        id: remote.id,
        orderId: existing?.orderId || remote.additionalData || remote.id,
        amountPln:
          existing?.amountPln ??
          (Number.parseFloat(remote.amount?.value || "0") || 0),
        status,
        createdAt: existing?.createdAt ?? Date.now(),
        paidAt:
          status === "paid"
            ? existing?.paidAt ?? Date.now()
            : existing?.paidAt,
        provider: "cashbill",
        cashbillStatus: remote.status,
      };
      savePayment(payment);
      return payment;
    } catch {
      return existing ?? null;
    }
  }
}

export const blikProvider: BlikPaymentProvider = new CashbillBlikProvider();
