# API Reference — KukkutPro

> Internal REST API. All endpoints are served from the Node.js/Express backend.
> Base URL: `https://api.kukkutpro.app/api` (production) · `http://localhost:3001/api` (dev)

---

## General Conventions

### Request Headers
```
Content-Type: application/json
Accept: application/json
```

### Response Shape — Success
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### Response Shape — Error
```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "field": "fieldName"   // present only for validation errors
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed schema validation |
| `INSUFFICIENT_STOCK` | 400 | Sale quantity exceeds available stock |
| `EXCEEDS_OUTSTANDING` | 400 | Payment exceeds customer outstanding balance |
| `DUPLICATE_ENTRY` | 409 | A record for this date already exists |
| `NOT_FOUND` | 404 | Record does not exist |
| `RECORD_VOIDED` | 400 | Cannot edit a voided record |
| `SERVER_ERROR` | 500 | Unexpected server error |

### Date Format
All dates are ISO 8601: `YYYY-MM-DD` (e.g., `2026-08-27`). No time component for date fields.

### Money Format
All monetary values are strings in API requests/responses to prevent floating-point errors: `"1500.50"`. The frontend uses `Decimal.js` or native `Intl` for display.

---

## Module 1: Egg Production

### POST /production
Create a daily production entry.

**Request body:**
```json
{
  "date": "2026-08-27",
  "eggsProduced": 4620,
  "brokenEggs": 30,
  "notes": ""
}
```

**Validation rules:**
- `date`: required, valid ISO date, not in future by more than 1 day
- `eggsProduced`: required, integer ≥ 0
- `brokenEggs`: optional, integer ≥ 0, must be ≤ eggsProduced

**Response 201:**
```json
{
  "data": {
    "id": "clx1234",
    "date": "2026-08-27",
    "eggsProduced": 4620,
    "brokenEggs": 30,
    "closingStock": 4530,
    "display": {
      "peti": 21,
      "trays": 1,
      "looseEggs": 0
    }
  }
}
```

**Error cases:**
- `DUPLICATE_ENTRY` (409) — entry already exists for this date
- `VALIDATION_ERROR` (400) — broken > produced

**Side effects:**
- Triggers inventory recalculation from this date forward

---

### GET /production?from=YYYY-MM-DD&to=YYYY-MM-DD
Get production entries for a date range (default: last 30 days).

**Response 200:**
```json
{
  "data": [
    {
      "id": "clx1234",
      "date": "2026-08-27",
      "eggsProduced": 4620,
      "brokenEggs": 30,
      "closingStock": 600
    }
  ]
}
```

---

### GET /production/:date
Get production entry for a specific date.

**Response 200:** Single production object (same shape as above).
**Error:** `NOT_FOUND` (404) if no entry for that date.

---

### PATCH /production/:id
Edit an existing production entry.

**Request body:** Same fields as POST, all optional.

**Validation:** Same rules as POST. Additionally, `eggsProduced` cannot be reduced below the total eggs sold on that date.

**Side effects:** Same as POST — triggers inventory recalculation.

---

## Module 2: Egg Inventory

### GET /inventory/stock?date=YYYY-MM-DD
Get computed egg stock as of a specific date (defaults to today).

**Response 200:**
```json
{
  "data": {
    "date": "2026-08-27",
    "openingStock": 600,
    "produced": 4620,
    "sold": 3990,
    "broken": 30,
    "closingStock": 1200,
    "display": {
      "peti": 5,
      "trays": 2,
      "looseEggs": 30
    }
  }
}
```

---

### GET /inventory/history?from=YYYY-MM-DD&to=YYYY-MM-DD
Get daily inventory summary for a date range.

**Response 200:**
```json
{
  "data": [
    {
      "date": "2026-08-27",
      "openingStock": 600,
      "produced": 4620,
      "sold": 3990,
      "broken": 30,
      "closingStock": 1200
    }
  ]
}
```

---

## Module 3: Egg Sales

### POST /sales
Record a new sale.

**Request body:**
```json
{
  "date": "2026-08-27",
  "customerId": "cust_abc123",
  "eggsQty": 3990,
  "pricePerEgg": "0.714",
  "amountReceived": "2000.00",
  "notes": ""
}
```

**Computed by server:**
- `totalAmount = eggsQty × pricePerEgg`
- `amountDue = totalAmount − amountReceived`
- `status`: PAID | PARTIAL | UNPAID

**Validation rules:**
- `eggsQty` must be ≤ closing stock for that date → error: `INSUFFICIENT_STOCK`
- `amountReceived` must be ≤ totalAmount
- `customerId` must exist

**Response 201:**
```json
{
  "data": {
    "id": "sale_xyz789",
    "date": "2026-08-27",
    "customerId": "cust_abc123",
    "customerName": "Rajesh Kumar",
    "eggsQty": 3990,
    "petiQty": 19,
    "pricePerEgg": "0.714",
    "totalAmount": "2850.00",
    "amountReceived": "2000.00",
    "amountDue": "850.00",
    "status": "PARTIAL"
  }
}
```

**Side effects (all atomic, in a transaction):**
- Egg inventory recalculated
- If `amountDue > 0`: customer outstanding balance updated
- Cash book entry created for `amountReceived`

---

### GET /sales?customerId=&from=&to=&status=
List sales with optional filters.

**Query params:**
- `customerId` — filter by customer
- `from`, `to` — date range
- `status` — PAID | PARTIAL | UNPAID | VOIDED

**Response 200:** Array of sale objects.

---

### GET /sales/:id
Get a single sale detail.

---

### POST /sales/:id/void
Void a sale (replaces delete).

**Request body:**
```json
{
  "reason": "Entered wrong customer"
}
```

**Validation:**
- Cannot void a sale that has received payments > 0 without also reversing those payments.

**Response 200:** Updated sale with `status: "VOIDED"`.

**Side effects:**
- Inventory recalculated (eggs returned to stock)
- Cash book reversal entry created
- Customer due reversed

---

## Module 4: Customers

### POST /customers
Create a new customer.

**Request body:**
```json
{
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "address": "Gorakhpur",
  "notes": ""
}
```

**Response 201:** Customer object.

---

### GET /customers
List all active customers.

**Query params:**
- `hasDues=true` — only customers with outstanding > 0
- `search=` — name/phone search

**Response 200:**
```json
{
  "data": [
    {
      "id": "cust_abc123",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "totalPurchases": "45000.00",
      "totalPaid": "38000.00",
      "outstanding": "7000.00",
      "lastTransactionDate": "2026-08-25"
    }
  ]
}
```

---

### GET /customers/:id
Get customer detail with full transaction history.

**Response 200:**
```json
{
  "data": {
    "id": "cust_abc123",
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "outstanding": "7000.00",
    "sales": [ ... ],
    "payments": [ ... ]
  }
}
```

---

### POST /customers/:id/payments
Record a payment from a customer.

**Request body:**
```json
{
  "date": "2026-08-27",
  "amount": "3000.00",
  "isAdvance": false,
  "notes": "Cash payment received"
}
```

**Validation:**
- `amount` must be ≤ outstanding balance unless `isAdvance: true` → error: `EXCEEDS_OUTSTANDING`

**Side effects:**
- Customer outstanding balance reduced
- Cash book entry created (type: IN, source: CUSTOMER_PAYMENT)

---

## Module 5: Cash Book

### GET /cashbook?from=YYYY-MM-DD&to=YYYY-MM-DD
Get cash book entries for a date range.

**Response 200:**
```json
{
  "data": {
    "openingBalance": "5000.00",
    "closingBalance": "7850.00",
    "entries": [
      {
        "id": "ce_001",
        "date": "2026-08-27",
        "type": "IN",
        "source": "SALE",
        "amount": "2000.00",
        "notes": "Sale to Rajesh Kumar",
        "referenceId": "sale_xyz789",
        "isManual": false
      }
    ],
    "summary": {
      "totalIn": "5000.00",
      "totalOut": "2150.00",
      "net": "2850.00"
    }
  }
}
```

---

### POST /cashbook/manual
Add a manual cash book entry.

**Request body:**
```json
{
  "date": "2026-08-27",
  "type": "IN",
  "amount": "500.00",
  "notes": "Sold empty cartons"
}
```

**Response 201:** Cash entry object.

---

### GET /cashbook/balance?date=YYYY-MM-DD
Get closing cash balance as of a date (defaults to today).

**Response 200:**
```json
{
  "data": {
    "date": "2026-08-27",
    "closingBalance": "7850.00"
  }
}
```

---

## Module 6: Labour

### POST /labourers
Add a new labourer.

**Request body:**
```json
{
  "name": "Ramu",
  "phone": "9876500000",
  "role": "Farm worker",
  "salaryType": "MONTHLY",
  "salaryAmount": "15000.00",
  "joiningDate": "2026-01-01"
}
```

---

### GET /labourers
List all active labourers with outstanding dues.

**Response 200:**
```json
{
  "data": [
    {
      "id": "lab_001",
      "name": "Ramu",
      "salaryType": "MONTHLY",
      "salaryAmount": "15000.00",
      "totalAccrued": "120000.00",
      "totalPaid": "115000.00",
      "outstanding": "5000.00",
      "advanceBalance": "0.00"
    }
  ]
}
```

---

### POST /labourers/:id/payments
Record a salary or advance payment.

**Request body:**
```json
{
  "date": "2026-08-27",
  "amount": "10000.00",
  "paymentType": "SALARY",
  "notes": "August partial payment"
}
```

**Side effects:**
- Labourer outstanding balance updated
- Cash book entry created (type: OUT, source: LABOUR)

---

## Module 7: Expenses

### POST /expenses
Record a farm expense.

**Request body:**
```json
{
  "date": "2026-08-27",
  "category": "Feed",
  "description": "Maaka — 10 bags",
  "quantity": 10,
  "unitCost": "350.00",
  "totalAmount": "3500.00",
  "notes": ""
}
```

**Side effects:**
- Cash book entry created (type: OUT, source: EXPENSE)

---

### GET /expenses?from=&to=&category=
List expenses with optional filters.

---

## Module 8: Dashboard

### GET /dashboard/today
Get today's complete operational summary.

**Response 200:**
```json
{
  "data": {
    "date": "2026-08-27",
    "production": {
      "eggsProduced": 4620,
      "brokenEggs": 30
    },
    "inventory": {
      "closingStock": 1200,
      "display": { "peti": 5, "trays": 2, "looseEggs": 30 }
    },
    "sales": {
      "eggsSold": 3990,
      "cashCollected": "2850.00",
      "creditSales": "850.00",
      "numberOfSales": 3
    },
    "cash": {
      "openingBalance": "5000.00",
      "closingBalance": "7850.00",
      "totalIn": "5000.00",
      "totalOut": "2150.00"
    },
    "expenses": {
      "total": "3500.00"
    },
    "outstanding": {
      "totalCustomerDues": "42000.00",
      "totalLabourDues": "5000.00",
      "topCustomers": [
        { "id": "cust_001", "name": "Rajesh", "outstanding": "12000.00" },
        { "id": "cust_002", "name": "Sunil", "outstanding": "8500.00" }
      ]
    }
  }
}
```

---

## Rate Limits

| Endpoint type | Limit |
|---|---|
| All write endpoints (POST, PATCH, DELETE) | 100 requests / minute / IP |
| All read endpoints (GET) | 300 requests / minute / IP |
| Dashboard endpoint | 60 requests / minute / IP |

**Rate limit response (429):**
```json
{
  "error": "Too many requests. Please wait before trying again.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 30
}
```

---

## Failure Behavior

| Failure | Frontend Behaviour |
|---|---|
| Network timeout | Show retry button. Do not assume data was saved. |
| 400 Validation error | Display `error` message inline on the relevant field |
| 409 Conflict | Show message: "An entry for this date already exists. Do you want to edit it?" |
| 500 Server error | Show generic error with retry. Log to console. |
| `INSUFFICIENT_STOCK` | Show: "Only X eggs available on [date]. Please reduce quantity." |
| `EXCEEDS_OUTSTANDING` | Show: "Payment exceeds outstanding balance of ₹X. Mark as advance?" |
