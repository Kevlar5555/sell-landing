import type { BlikPayment } from "./types";

const globalStore = globalThis as unknown as {
  __knotBlikPayments?: Map<string, BlikPayment>;
};

export function getPaymentStore(): Map<string, BlikPayment> {
  if (!globalStore.__knotBlikPayments) {
    globalStore.__knotBlikPayments = new Map();
  }
  return globalStore.__knotBlikPayments;
}
