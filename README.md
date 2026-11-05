# KNOT — landing + CashBill BLIK

Polska strona sprzedażowa świecy **„Bursztyn”** (79 zł) z płatnością **BLIK Level 0 przez CashBill**.

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz [http://127.0.0.1:3000](http://127.0.0.1:3000).

## CashBill

Wymagane zmienne środowiskowe (sekrety aplikacji):

- `CASHBILL_SHOP_ID` — ID punktu płatności
- `CASHBILL_SECRET_KEY` — sekret punktu
- `CASHBILL_ENV` — `prod` (domyślnie) albo `test`
- `CASHBILL_RETURN_BASE` — publiczny URL powrotu (np. `https://knot-bursztyn.apps.grok.bot`)

W panelu CashBill ustaw notification URL na:

`{CASHBILL_RETURN_BASE}/api/payments/cashbill/notify`

## Flow

1. E-mail + 6-cyfrowy kod BLIK
2. `POST /api/payments/blik` → CashBill BLIK Level 0 (`createBlikPayment`)
3. Poll `GET /api/payments/[id]` + webhook `transactionStatusChanged`
4. Status `PositiveFinish` → UI „Opłacone”
