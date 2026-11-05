export type PaymentStatus = "pending" | "paid" | "failed";

export type BlikPayment = {
  id: string;
  orderId: string;
  amountPln: number;
  status: PaymentStatus;
  createdAt: number;
  paidAt?: number;
  provider: "cashbill";
  cashbillStatus?: string;
  declineReason?: string;
  /** Opaque token required to poll/confirm this payment. */
  accessToken: string;
  lastRemoteRefreshAt?: number;
};

export type CreateBlikPaymentInput = {
  code: string;
  amountPln: number;
  productName: string;
  email: string;
  customerIp: string;
  returnBaseUrl: string;
};

export interface BlikPaymentProvider {
  createBlikPayment(input: CreateBlikPaymentInput): Promise<BlikPayment>;
  confirmPayment(id: string, accessToken: string): Promise<BlikPayment>;
  getPayment(id: string): Promise<BlikPayment | null>;
  refreshPayment(
    id: string,
    opts?: { force?: boolean },
  ): Promise<BlikPayment | null>;
}
