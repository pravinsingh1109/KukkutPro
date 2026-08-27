# Project Overview — KukkutPro

> Poultry Farm Management, Egg Sales & Cash Ledger System

---

## Project Name

**KukkutPro** — Kukkut (कुक्कुट) is Hindi for poultry.

---

## Problem Statement

Small and mid-scale poultry farm owners in India currently manage their operations through paper registers, personal memory, or disconnected WhatsApp notes. This results in:

- **No real-time egg inventory** — owners don't know exactly how many eggs are in stock without a physical count.
- **Lost dues** — customers who buy on credit are tracked in hand-written ledgers that are easy to lose, skip, or miscalculate.
- **Cash mismatches** — daily cash flow is not tracked systematically, making it impossible to know if the expected cash matches the physical cash in hand.
- **Labour salary confusion** — workers take advances and partial payments; without records, disputes arise over who is owed what.
- **No expense visibility** — money spent on feed (Maaka), medicine, vaccines, and other farm inputs is not categorised, so the owner cannot see where money is going.
- **Zero business insight** — there is no way to see monthly trends, identify high-credit customers, or estimate operating profit.

The farm owner knows business is happening, but cannot see it clearly.

---

## Target Users

| User | Description |
|---|---|
| **Primary** | Poultry farm owner / proprietor — manages day-to-day sales, cash, and workers |
| **Secondary** | Farm manager or trusted family member who enters daily production and sales data |

**User profile:**
- Age 30–60, semi-urban or rural India
- Comfortable with smartphones; not necessarily with complex software
- Language: Hindi preferred for labels where possible, English acceptable for system terms
- Uses cash exclusively — no digital payments currently
- Has 1–3 labourers on farm

---

## Primary Outcome

The owner can open the app at the end of the day and immediately know:

1. How many eggs are in stock right now
2. How much cash was collected today
3. Who owes money and how much
4. What was spent today and on what
5. Whether the cash in hand matches the ledger

---

## MVP Scope

The MVP covers the core daily operational loop of a poultry farm.

### ✅ In MVP

| Area | What's Included |
|---|---|
| **Egg Production** | Daily entry of eggs produced, broken eggs, peti/tray/loose breakdown |
| **Egg Inventory** | Automatic daily closing stock: Opening + Produced − Sold − Broken |
| **Egg Sales** | Sale entry with customer, quantity, price, amount received, amount due |
| **Customer Dues Ledger** | Running balance per customer; mark partial or full payments against dues |
| **Cash Book** | Daily cash picture: opening cash + receipts − payments = closing cash |
| **Labour Management** | Add labourers, record salary, advance payments, running dues |
| **Expense Entry** | Log farm expenses by category (Feed, Medicine, Labour, Other) |
| **Dashboard** | Today's snapshot: stock, sales, cash collected, total dues |
| **Customer Management** | Basic customer list with contact, total sales, outstanding balance |

### ❌ Out of Scope for MVP

The following will **not** be built in the MVP and are explicitly deferred to future versions.

| Feature | Reason Deferred |
|---|---|
| Supplier / vendor management | Adds complexity; most purchases are cash-on-delivery |
| Product / medicine inventory tracking | Stock-level tracking is a nice-to-have, not blocking operations |
| Flock / bird management (mortality, breeds) | Not needed for financial clarity; can add in v2 |
| Reports & analytics | Valuable but not required to run daily operations |
| Multi-farm / multi-shed support | Single farm is the target initially |
| User authentication / multi-user roles | Single-owner usage in MVP; login to be added post-MVP |
| Notifications / alerts (low stock, due reminders) | Post-MVP feature |
| Data export (PDF/Excel reports) | Post-MVP feature |
| Offline / sync support | Post-MVP; MVP assumes basic connectivity |
| Profitability / P&L calculation | Requires full expense capture over time; deferred to v2 |

---

## Success Definition for MVP

The MVP is considered successful when a farm owner can:

1. Record daily egg production and immediately see closing stock
2. Enter a sale and see the customer's outstanding balance update
3. Record a customer payment and see dues reduce
4. Enter a labour payment and see that labourer's balance update
5. Log a daily expense
6. Open the dashboard and see today's numbers without doing any mental arithmetic

---

## Constraints

- **All transactions are cash** — no payment gateway or UPI integration needed
- **Single currency** — Indian Rupees (₹)
- **Unit convention** — 1 Peti = 210 eggs = 7 trays × 30 eggs. System stores eggs as the base unit; peti/tray are display formats
- **No deletion policy** — financial records must never be silently deleted; all corrections go through reversal/adjustment entries to preserve audit history
