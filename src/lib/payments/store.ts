import type { BlikPayment } from "./types";

const MAX_ENTRIES = 200;
const TTL_MS = 2 * 60 * 60 * 1000;

const globalStore = globalThis as unknown as {
  __knotBlikPayments?: Map<string, BlikPayment>;
};

export function getPaymentStore(): Map<string, BlikPayment> {
  if (!globalStore.__knotBlikPayments) {
    globalStore.__knotBlikPayments = new Map();
  }
  return globalStore.__knotBlikPayments;
}

export function prunePaymentStore(now = Date.now()): void {
  const store = getPaymentStore();
  for (const [id, payment] of store) {
    if (now - payment.createdAt > TTL_MS) {
      store.delete(id);
    }
  }
  if (store.size <= MAX_ENTRIES) return;
  const oldest = [...store.entries()].sort(
    (a, b) => a[1].createdAt - b[1].createdAt,
  );
  const toRemove = store.size - MAX_ENTRIES;
  for (let i = 0; i < toRemove; i += 1) {
    store.delete(oldest[i][0]);
  }
}

export function savePayment(payment: BlikPayment): void {
  prunePaymentStore();
  getPaymentStore().set(payment.id, payment);
}
