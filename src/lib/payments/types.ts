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
  confirmPayment(id: string): Promise<BlikPayment>;
  getPayment(id: string): Promise<BlikPayment | null>;
  refreshPayment(id: string): Promise<BlikPayment | null>;
}
