import { createHash } from "crypto";

export type CashbillOption = { name: string; value: string };

export type CashbillCreatePayload = {
  title: string;
  amount: { value: string; currencyCode: "PLN" };
  description: string;
  additionalData: string;
  paymentChannel: "blik";
  returnUrl: string;
  personalData: { email: string };
  options: CashbillOption[];
};

export type CashbillCreateResponse = {
  id: string;
  redirectUrl?: string;
  errorMessage?: string;
};

export type CashbillPaymentDetails = {
  id: string;
  status: string;
  title?: string;
  additionalData?: string;
  amount?: { value: string; currencyCode: string };
  errorMessage?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Brak konfiguracji CashBill (${name}). Dodaj sekrety w ustawieniach aplikacji.`,
    );
  }
  return value;
}

export function getCashbillConfig() {
  const shopId = requireEnv("CASHBILL_SHOP_ID");
  const secretKey = requireEnv("CASHBILL_SECRET_KEY");
  const env = (process.env.CASHBILL_ENV || "prod").trim().toLowerCase();
  const baseUrl =
    env === "test"
      ? "https://pay.cashbill.pl/testws/rest"
      : "https://pay.cashbill.pl/ws/rest";
  return { shopId, secretKey, baseUrl, env };
}

export function formatAmountPln(amountPln: number): string {
  return amountPln.toFixed(2);
}

/** Signature for BLIK Level 0 create, per CashBill docs. */
export function signBlikLevel0Create(
  payload: CashbillCreatePayload,
  secretKey: string,
): string {
  let signData =
    payload.title +
    payload.amount.value +
    payload.amount.currencyCode +
    payload.returnUrl +
    payload.description +
    payload.additionalData +
    payload.paymentChannel +
    payload.personalData.email;

  for (const option of payload.options) {
    signData += option.name + option.value;
  }

  return createHash("sha1")
    .update(signData + secretKey)
    .digest("hex");
}

export function signPaymentId(paymentId: string, secretKey: string): string {
  return createHash("sha1")
    .update(paymentId + secretKey)
    .digest("hex");
}

export function verifyNotificationSign(
  cmd: string,
  args: string,
  sign: string,
  secretKey: string,
): boolean {
  const expected = createHash("md5")
    .update(cmd + args + secretKey)
    .digest("hex");
  return expected === sign.toLowerCase();
}

export async function createCashbillBlikPayment(
  payload: CashbillCreatePayload,
): Promise<CashbillCreateResponse> {
  const { shopId, secretKey, baseUrl } = getCashbillConfig();
  const body = {
    ...payload,
    sign: signBlikLevel0Create(payload, secretKey),
  };

  const res = await fetch(`${baseUrl}/payment/${shopId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as CashbillCreateResponse;
  if (!res.ok || data.errorMessage || !data.id) {
    throw new Error(
      data.errorMessage || `CashBill odrzucił transakcję (HTTP ${res.status}).`,
    );
  }
  return data;
}

export async function getCashbillPayment(
  paymentId: string,
): Promise<CashbillPaymentDetails> {
  const { shopId, secretKey, baseUrl } = getCashbillConfig();
  const sign = signPaymentId(paymentId, secretKey);
  const res = await fetch(
    `${baseUrl}/payment/${shopId}/${encodeURIComponent(paymentId)}?sign=${sign}`,
    { headers: { Accept: "application/json" } },
  );
  const data = (await res.json()) as CashbillPaymentDetails;
  if (!res.ok || data.errorMessage) {
    throw new Error(
      data.errorMessage || `Nie udało się pobrać statusu CashBill (HTTP ${res.status}).`,
    );
  }
  return data;
}

export function mapCashbillStatus(status: string): "pending" | "paid" | "failed" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "positivefinish") return "paid";
  if (
    normalized === "negativefinish" ||
    normalized === "negativeauthorization" ||
    normalized === "abort" ||
    normalized === "fraud" ||
    normalized === "timeexceeded" ||
    normalized === "criticalerror"
  ) {
    return "failed";
  }
  return "pending";
}
