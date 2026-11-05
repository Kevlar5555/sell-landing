"use client";

import { FormEvent, useEffect, useState } from "react";

type Phase = "idle" | "form" | "pending" | "paid" | "error";

type PaymentResponse = {
  id: string;
  orderId: string;
  amountPln: number;
  status: "pending" | "paid" | "failed";
  error?: string;
};

const PRICE = 79;

export function BlikCheckout() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== "pending" || !paymentId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/${paymentId}`);
        const data = (await res.json()) as PaymentResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Nie udało się sprawdzić statusu.");
          setPhase("error");
          return;
        }
        if (data.status === "paid") {
          setPhase("paid");
          return;
        }
      } catch {
        if (!cancelled) {
          setError("Błąd połączenia podczas sprawdzania płatności.");
          setPhase("error");
        }
      }
    };

    const interval = window.setInterval(poll, 600);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [phase, paymentId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const normalized = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(normalized)) {
      setError("Kod BLIK musi mieć dokładnie 6 cyfr.");
      return;
    }

    setPhase("pending");

    try {
      const res = await fetch("/api/payments/blik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const data = (await res.json()) as PaymentResponse & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Nie udało się utworzyć płatności.");
        setPhase("form");
        return;
      }
      setPaymentId(data.id);
      setOrderId(data.orderId);
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
      setPhase("form");
    }
  }

  function reset() {
    setPhase("idle");
    setCode("");
    setError(null);
    setOrderId(null);
    setPaymentId(null);
  }

  if (phase === "idle") {
    return (
      <div className="anim-fade-up-delay-2" style={{ marginTop: "2rem" }}>
        <button
          type="button"
          onClick={() => setPhase("form")}
          style={{
            background: "linear-gradient(135deg, #e8bc6a 0%, #c47a28 100%)",
            color: "#1a1008",
            border: "none",
            padding: "0.95rem 1.6rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: "pointer",
            fontSize: "0.95rem",
            transition: "transform 0.2s ease, filter 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = "brightness(1.06)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "none";
            e.currentTarget.style.transform = "none";
          }}
        >
          Zapłać BLIKIEM · {PRICE} zł
        </button>
        <p
          style={{
            marginTop: "0.85rem",
            color: "var(--muted)",
            fontSize: "0.72rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          DEMO — bez prawdziwych środków
        </p>
      </div>
    );
  }

  if (phase === "pending") {
    return (
      <div className="anim-fade-up" style={{ marginTop: "2rem", maxWidth: 360 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div className="spinner" />
          <p style={{ margin: 0, fontWeight: 600 }}>Potwierdź w aplikacji banku</p>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
          Czekamy na zatwierdzenie kodu BLIK…
          {orderId ? (
            <>
              <br />
              Zamówienie: <span style={{ color: "var(--cream)" }}>{orderId}</span>
            </>
          ) : null}
        </p>
        <p
          className="soft-pulse"
          style={{
            marginTop: "1rem",
            color: "var(--amber-bright)",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Tryb DEMO
        </p>
      </div>
    );
  }

  if (phase === "paid") {
    return (
      <div className="anim-fade-up" style={{ marginTop: "2rem", maxWidth: 380 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-fraunces), var(--font-display)",
            fontSize: "1.75rem",
            color: "var(--amber-bright)",
          }}
        >
          Opłacone
        </p>
        <p style={{ margin: "0.6rem 0 0", color: "var(--cream)" }}>
          Świeca „Bursztyn” jest zarezerwowana.
        </p>
        {orderId ? (
          <p style={{ margin: "0.4rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
            Numer zamówienia: {orderId}
          </p>
        ) : null}
        <p
          style={{
            marginTop: "1rem",
            color: "var(--muted)",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Tryb DEMO — to nie była prawdziwa płatność
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.25rem",
            background: "transparent",
            color: "var(--cream)",
            border: "1px solid var(--line)",
            padding: "0.65rem 1.1rem",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Zamknij
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="anim-fade-up"
      style={{ marginTop: "2rem", maxWidth: 360 }}
    >
      <label
        htmlFor="blik-code"
        style={{
          display: "block",
          fontSize: "0.78rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "0.55rem",
        }}
      >
        Kod BLIK (6 cyfr)
      </label>
      <input
        id="blik-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--line)",
          color: "var(--ink)",
          padding: "0.9rem 1rem",
          fontSize: "1.35rem",
          letterSpacing: "0.35em",
          outline: "none",
        }}
      />
      {(error || phase === "error") && (
        <p style={{ color: "var(--danger)", margin: "0.65rem 0 0", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          type="submit"
          style={{
            background: "linear-gradient(135deg, #e8bc6a 0%, #c47a28 100%)",
            color: "#1a1008",
            border: "none",
            padding: "0.85rem 1.25rem",
            fontWeight: 700,
            cursor: "pointer",
            flex: 1,
          }}
        >
          Kup za {PRICE} zł
        </button>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "transparent",
            color: "var(--muted)",
            border: "1px solid var(--line)",
            padding: "0.85rem 1rem",
            cursor: "pointer",
          }}
        >
          Anuluj
        </button>
      </div>
      <p
        style={{
          marginTop: "0.9rem",
          color: "var(--muted)",
          fontSize: "0.68rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1.5,
        }}
      >
        DEMO — prawdziwe pieniądze wymagają kluczy CashBill / Przelewy24 / PayU
      </p>
    </form>
  );
}
