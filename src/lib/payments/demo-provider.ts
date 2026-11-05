import { getPaymentStore } from "./store";
import type {
  BlikPayment,
  BlikPaymentProvider,
  CreateBlikPaymentInput,
} from "./types";

const DEMO_CONFIRM_DELAY_MS = 2000;

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export class DemoBlikProvider implements BlikPaymentProvider {
  async createBlikPayment(input: CreateBlikPaymentInput): Promise<BlikPayment> {
    const code = input.code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Kod BLIK musi mieć dokładnie 6 cyfr.");
    }

    const payment: BlikPayment = {
      id: makeId("PAY"),
      orderId: makeId("ORD"),
      amountPln: input.amountPln,
      status: "pending",
      createdAt: Date.now(),
    };

    getPaymentStore().set(payment.id, payment);

    // Auto-confirm after short delay — stands in for bank app approval.
    setTimeout(() => {
      void this.confirmPayment(payment.id);
    }, DEMO_CONFIRM_DELAY_MS);

    return payment;
  }

  async confirmPayment(id: string): Promise<BlikPayment> {
    const store = getPaymentStore();
    const existing = store.get(id);
    if (!existing) {
      throw new Error("Nie znaleziono płatności.");
    }
    if (existing.status === "paid") {
      return existing;
    }

    const paid: BlikPayment = {
      ...existing,
      status: "paid",
      paidAt: Date.now(),
    };
    store.set(id, paid);
    return paid;
  }

  async getPayment(id: string): Promise<BlikPayment | null> {
    return getPaymentStore().get(id) ?? null;
  }
}

export const blikProvider: BlikPaymentProvider = new DemoBlikProvider();
