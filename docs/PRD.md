# Product Requirements Document — KukkutPro

> Version 1.0 · MVP · August 2026

---

## Overview

KukkutPro is a mobile-first web application that helps small poultry farm owners in India manage their daily egg production, sales, customer dues, cash flow, labour salaries, and farm expenses — all in one place, without needing accounting knowledge.

The system replaces paper registers, WhatsApp notes, and memory with a structured digital ledger that is always accurate and instantly readable.

---

## Problem Statement

Small poultry farm owners face a recurring set of operational problems:

1. **Egg stock is unknown without a physical count.** There is no running inventory.
2. **Customer credit is tracked on paper** and dues are frequently miscalculated or forgotten.
3. **Cash does not reconcile.** Money received and money spent are not aggregated daily, making it impossible to confirm how much cash should physically be in hand.
4. **Labour salary disputes** arise because advance payments and partial disbursements are not recorded systematically.
5. **Farm expenses are invisible.** Feed, medicine, and other costs are paid in cash and not tracked, so the owner has no sense of where money goes.

The result is a farm that is operationally functional but financially opaque.

---

## Target Audience

**Primary user: Poultry farm owner**

- Manages daily operations: collects eggs, sells to buyers, pays workers
- Makes all financial decisions
- Uses a smartphone (Android, mid-range)
- Prefers Hindi labels but can read basic English
- Not comfortable with traditional accounting software
- Handles all payments in cash

**Secondary user: Farm manager / family member**

- Enters daily production data and sales on behalf of the owner
- Does not make financial decisions
- Needs a simplified data entry interface

---

## User Personas

### Persona 1 — Ramesh (Owner)

> "I sell eggs every day. I know roughly how much I make but I never know exactly who owes me what. My register gets messy."

- Age: 45 · Location: Rural UP · Farm size: ~2,000 birds
- Checks phone frequently but doesn't use complex apps
- Pain point: Customer dues — some buyers owe months of payments
- Goal: Know exactly who owes what and how much cash is available

### Persona 2 — Suresh (Manager / Son)

> "I handle the daily entries. Baba tells me to write it down but the register gets lost."

- Age: 24 · Location: Same farm · Handles data entry
- Comfortable with apps, uses WhatsApp regularly
- Pain point: No clear format — different pages for different things
- Goal: Enter daily data quickly and accurately

---

## Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Daily data entry is fast | Time to complete daily production + sales entry | < 3 minutes |
| Dues are always visible | Owner can see total outstanding without navigating | On dashboard, zero taps |
| Cash reconciles | Owner can verify expected cash matches physical cash | Same-day, every day |
| Labour dues are clear | No disputes about salary owed | Zero complaints after 30 days |
| Adoption | Owner uses app daily for 4 consecutive weeks | 100% daily entry rate |

---

## Functional Requirements

---

### Module 1: Egg Production

**FR-1.1** The system shall allow the owner to enter daily egg production for any date.

**FR-1.2** One production entry per calendar date. Attempting a second entry for the same date shall show the existing entry in edit mode.

**FR-1.3** The system shall accept the following fields: date, eggs produced (integer ≥ 0), broken/damaged eggs (integer ≥ 0).

**FR-1.4** Broken eggs shall not exceed eggs produced. The system shall reject entries that violate this rule with an inline error.

**FR-1.5** Upon saving a production entry, the system shall automatically recalculate the closing egg stock for that date and all subsequent dates.

**FR-1.6** The system shall display egg quantities in three formats simultaneously: raw eggs, trays (÷ 30), and peti (÷ 210), with the remainder shown as loose eggs.

---

### Module 2: Egg Inventory

**FR-2.1** The system shall maintain a continuous egg inventory ledger with the formula:
```
Closing Stock(day) = Opening Stock(day) + Produced(day) − Sold(day) − Broken(day)
```

**FR-2.2** Opening Stock of any day shall equal Closing Stock of the previous day.

**FR-2.3** The system shall prevent any sale entry that would result in a negative closing stock for that day.

**FR-2.4** Editing any production or sales entry shall trigger automatic recalculation of all affected inventory records.

**FR-2.5** The initial opening stock (Day 0) shall be configurable in Settings during first-time setup.

---

### Module 3: Egg Sales

**FR-3.1** The system shall allow recording a sale with the following fields: date, customer, quantity (in eggs/trays/peti with automatic conversion), price per unit, total amount (auto), amount received, amount due (auto).

**FR-3.2** The quantity entry shall support three input modes: enter eggs, enter trays, or enter peti. The system shall convert and store as eggs.

**FR-3.3** The system shall prevent sale quantities that exceed the current closing stock for that date.

**FR-3.4** Upon saving a sale:
- The egg inventory shall be updated immediately.
- If amount received < total amount, the difference shall be added to the customer's outstanding dues.
- A cash book entry shall be created for the amount received.

**FR-3.5** A sale can be edited if it has not been fully paid. The system shall recalculate all downstream effects (inventory, dues, cash book) on edit.

**FR-3.6** Sales shall never be deleted. If a sale was entered in error, it shall be voided through a reversal entry, preserving the original record.

---

### Module 4: Customer Dues Ledger

**FR-4.1** Each customer shall maintain a running outstanding balance = sum of all unpaid sale amounts.

**FR-4.2** The system shall allow recording a payment against a customer's outstanding balance with fields: date, amount, notes.

**FR-4.3** A payment shall reduce the oldest unpaid sale balance first (FIFO allocation), unless the owner manually specifies which sale to apply it to.

**FR-4.4** The system shall reject a payment greater than the outstanding balance unless explicitly tagged as "advance payment."

**FR-4.5** Advance payments shall be stored and automatically applied to the next sale at the time of sale entry.

**FR-4.6** Every payment entry shall automatically create a cash book entry (cash in).

**FR-4.7** The system shall provide a "Who owes me?" view — a list of customers with outstanding > ₹0, sorted by balance descending.

---

### Module 5: Customer Management

**FR-5.1** The system shall maintain a customer directory with fields: name (required), phone number, address/location (optional), notes (optional).

**FR-5.2** A customer's derived metrics (total purchases, total paid, outstanding, last transaction date) shall be computed from transaction records, not stored as editable fields.

**FR-5.3** The customer detail screen shall show: summary metrics, list of all sales with payment status, and full payment history.

**FR-5.4** The system shall allow inline customer creation during a sale entry — the owner shall not be forced to navigate away from the sale form.

---

### Module 6: Cash Book

**FR-6.1** The system shall maintain a daily cash ledger with the formula:
```
Closing Cash(day) = Opening Cash(day) + Total Cash In(day) − Total Cash Out(day)
```

**FR-6.2** Opening Cash of any day shall equal Closing Cash of the previous day. The very first opening cash balance is configured in Settings.

**FR-6.3** The following events shall automatically create cash book entries with zero additional owner input:
- Sale payment received → Cash In
- Customer due payment received → Cash In
- Labour salary paid → Cash Out
- Expense recorded → Cash Out

**FR-6.4** The owner may add manual cash book entries (e.g., owner withdrawal, miscellaneous cash receipt) with a reason field.

**FR-6.5** The system shall display today's expected closing cash balance clearly on both the Cash Book screen and the Dashboard.

**FR-6.6** The owner shall be able to tap "Confirm Cash" to log that the physical cash matches the system balance, or enter the actual physical cash to record a variance with a reason.

---

### Module 7: Labour Management

**FR-7.1** The system shall maintain a labour directory with fields: name (required), phone, role, salary type (Monthly/Daily/Per-task), salary amount, joining date.

**FR-7.2** For monthly workers, salary accrues automatically on a configurable day of the month (default: 1st).

**FR-7.3** The system shall allow recording payments with fields: date, amount, payment type (Salary / Advance), notes.

**FR-7.4** The outstanding balance per labourer = accrued salary − payments made + advances not yet recovered.

**FR-7.5** Advance payments shall be tracked separately and deducted from the next salary disbursement.

**FR-7.6** Every payment entry shall automatically create a cash book entry (cash out).

**FR-7.7** The system shall provide a view of all labourers with outstanding salary dues > ₹0.

---

### Module 8: Expense Entry

**FR-8.1** The system shall allow recording an expense with fields: date, category, item/description, quantity (optional), unit cost (optional), total amount (required), notes.

**FR-8.2** Expense categories shall be: Feed, Medicine, Vaccines, Supplements, Packaging, Transport, Electricity, Water, Equipment/Repairs, Other. The owner shall be able to add custom categories.

**FR-8.3** Every expense entry shall automatically create a cash book entry (cash out).

**FR-8.4** Labour salary payments shall be created as expense entries of category "Labour" automatically when recorded in the Labour module — no double entry.

---

### Module 9: Dashboard

**FR-9.1** The dashboard shall display the following without any navigation: today's eggs produced, today's eggs sold, current egg stock, today's cash collected, today's credit sales amount, today's total expenses, and net cash today.

**FR-9.2** The dashboard shall show total outstanding dues (customers combined) and total labour salary dues.

**FR-9.3** The dashboard shall show the top 3 customers by outstanding balance with name and amount.

**FR-9.4** The dashboard shall be read-only. All data entry is done from dedicated module screens.

**FR-9.5** The dashboard shall load within 2 seconds on a standard Android mid-range device on a 4G connection.

---

## User Stories

### Epic: Daily Operations

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | Farm owner | Enter today's egg production | The stock updates automatically |
| US-02 | Farm owner | Record an egg sale to a customer | My inventory and the customer's balance update together |
| US-03 | Farm owner | Select an existing customer during a sale | I don't re-enter names every day |
| US-04 | Farm owner | Enter a customer payment | Their outstanding balance reduces |
| US-05 | Farm owner | Enter a farm expense | My cash book reflects the spend |
| US-06 | Farm manager | Enter daily production data | The owner sees accurate stock without asking me |

### Epic: Financial Clarity

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-07 | Farm owner | See all customers who owe me money | I can follow up on dues |
| US-08 | Farm owner | See today's expected cash in hand | I can verify against my actual cash |
| US-09 | Farm owner | See a labourer's salary history | I can resolve payment disputes |
| US-10 | Farm owner | See total expenses for this month | I understand where money is going |

---

## Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| Sale entered for a date in the past | Allowed. Inventory recalculates for that date forward. User sees a warning. |
| Production entry edited after sales exist | Allowed if revised production ≥ total eggs sold that day. Otherwise system shows blocking error. |
| Customer payment more than outstanding | System prompts: "This exceeds outstanding balance. Mark as advance?" |
| Sale entered when stock = 0 | Blocked with message: "No eggs available on this date." |
| Two users entering data simultaneously | Last-write-wins in MVP. Full conflict resolution deferred to post-MVP. |
| Labourer deleted who has outstanding dues | Soft delete only. Labourer is hidden from active list but financial records are preserved. |
| Expense entered for future date | Allowed with a warning that it will affect future cash book projections. |
| First-time setup — no opening stock or cash | Onboarding wizard collects opening egg stock and opening cash before first entry. |

---

## Loading States

| Screen | Loading Behaviour |
|---|---|
| Dashboard | Full skeleton layout — each card shows a grey shimmer matching its shape |
| Customer list | Row-level skeletons — 5 placeholder rows |
| Customer detail | Header skeleton + 3 transaction row skeletons |
| Sale entry form | Form renders immediately; customer dropdown shows "Loading..." until data resolves |
| Cash book | Row skeletons for each day entry |

---

## Empty States

| Screen | Empty State Message | CTA |
|---|---|---|
| Dashboard (no entries today) | "No entries today yet. Start by recording today's production." | "Add Production" button |
| Customer list | "No customers added yet. Add your first buyer." | "Add Customer" button |
| Customer dues (no dues) | "All customers are paid up. Great!" | No CTA needed |
| Labour list | "No workers added yet. Add your first labourer." | "Add Labourer" button |
| Cash book (new farm) | "No transactions yet. Set up your opening cash balance." | "Setup Opening Balance" button |
| Expense list (today) | "No expenses recorded today." | "Add Expense" button |

---

## Error States

| Error | Message | Recovery |
|---|---|---|
| Network unavailable | "No internet connection. Your last saved data is shown." | Retry button |
| Server error (5xx) | "Something went wrong. Please try again." | Retry button |
| Sale blocked (insufficient stock) | "Only X eggs available on this date. Reduce the quantity." | Inline on form |
| Sale blocked (validation) | Field-specific: "Amount received cannot exceed total amount." | Inline on field |
| Data save failed | "Couldn't save. Check your connection and try again." | Retry button |
| Session expired | Redirect to login with message: "Your session expired. Please log in again." | Auto-redirect |

---

## Security Requirements

> Note: Authentication is out of MVP scope but architecture must not block its addition.

| Requirement | Detail |
|---|---|
| No financial record deletion | All records are soft-deleted or reversed; hard delete is disabled at the API level |
| Audit trail | Every create/edit action stores timestamp and user ID |
| Input validation | All monetary inputs are validated server-side; no client-side-only validation |
| SQL injection prevention | Use parameterised queries / ORM only; raw SQL with user input is prohibited |
| HTTPS only | All API traffic over TLS 1.2+ |
| Data isolation | Each farm's data is strictly isolated; no cross-farm data access |

---

## Performance Requirements

| Metric | Target |
|---|---|
| Dashboard load time | < 2 seconds on 4G, mid-range Android |
| Form save response | < 1 second |
| Inventory recalculation | < 500ms for up to 365-day chain |
| Customer list (up to 200 customers) | Loads within 1.5 seconds |
| Time to first meaningful paint | < 1.5 seconds |

---

## Definition of Done (per feature)

A feature is complete when:

1. Functional requirements pass all test cases including edge cases
2. Loading, empty, and error states are implemented and tested
3. Mobile layout renders correctly on 360px wide screen
4. No console errors in production build
5. All financial calculations are verified against at least 5 real-world scenarios
6. Downstream effects (inventory, cash book, dues) are automatically triggered and verified
