import { randomBytes } from "crypto";
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

const MIN_REMOTE_REFRESH_MS = 5_000;

function makeOrderId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

function makeAccessToken(): string {
  return randomBytes(24).toString("hex");
}

function assertAccess(payment: BlikPayment, accessToken: string): void {
  if (!accessToken || payment.accessToken !== accessToken) {
    throw new Error("Brak uprawnień do tej płatności.");
  }
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
      accessToken: makeAccessToken(),
      lastRemoteRefreshAt: Date.now(),
    };
    savePayment(payment);
    return payment;
  }

  async confirmPayment(id: string, accessToken: string): Promise<BlikPayment> {
    const existing = await this.getPayment(id);
    if (!existing) {
      throw new Error("Nie znaleziono płatności.");
    }
    assertAccess(existing, accessToken);
    const refreshed = await this.refreshPayment(id, { force: true });
    if (!refreshed) {
      throw new Error("Nie znaleziono płatności.");
    }
    return refreshed;
  }

  async getPayment(id: string): Promise<BlikPayment | null> {
    return getPaymentStore().get(id) ?? null;
  }

  async refreshPayment(
    id: string,
    opts?: { force?: boolean },
  ): Promise<BlikPayment | null> {
    const existing = getPaymentStore().get(id);
    const now = Date.now();

    if (
      existing &&
      !opts?.force &&
      existing.lastRemoteRefreshAt &&
      now - existing.lastRemoteRefreshAt < MIN_REMOTE_REFRESH_MS
    ) {
      return existing;
    }

    // Do not call CashBill for unknown ids (prevents id probing / API abuse).
    if (!existing) {
      return null;
    }

    try {
      const remote = await getCashbillPayment(id);
      const status = mapCashbillStatus(remote.status);
      const payment: BlikPayment = {
        id: remote.id,
        orderId: existing.orderId || remote.additionalData || remote.id,
        amountPln:
          existing.amountPln ||
          Number.parseFloat(remote.amount?.value || "0") ||
          0,
        status,
        createdAt: existing.createdAt,
        paidAt:
          status === "paid" ? existing.paidAt ?? Date.now() : existing.paidAt,
        provider: "cashbill",
        cashbillStatus: remote.status,
        accessToken: existing.accessToken,
        lastRemoteRefreshAt: now,
        declineReason: existing.declineReason,
      };
      savePayment(payment);
      return payment;
    } catch {
      savePayment({ ...existing, lastRemoteRefreshAt: now });
      return existing;
    }
  }
}

export const blikProvider: BlikPaymentProvider = new CashbillBlikProvider();
