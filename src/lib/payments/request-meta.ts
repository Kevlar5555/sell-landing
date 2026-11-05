import { headers } from "next/headers";

export async function getCustomerIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1";
  }
  return h.get("x-real-ip")?.trim() || "127.0.0.1";
}

export async function getReturnBaseUrl(request: Request): Promise<string> {
  const configured = process.env.CASHBILL_RETURN_BASE?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host");
  if (host) return `${proto}://${host}`;

  try {
    return new URL(request.url).origin;
  } catch {
    return "http://127.0.0.1:3000";
  }
}
