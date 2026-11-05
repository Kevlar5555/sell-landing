# KNOT — landing + demo BLIK

Polska strona sprzedażowa świecy **„Bursztyn”** (79 zł) z demonstracyjnym flow płatności BLIK.

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Demo BLIK

1. Kliknij **Zapłać BLIKIEM · 79 zł**
2. Wpisz dowolny 6-cyfrowy kod
3. Status przechodzi `pending` → `paid` (~2 s)

Adapter: `createBlikPayment` / `confirmPayment` w `src/lib/payments/demo-provider.ts`  
API: `POST /api/payments/blik`, `GET|POST /api/payments/[id]`

To jest **DEMO** — bez prawdziwych środków. Integracja CashBill / Przelewy24 / PayU później przez ten sam interfejs providera.
