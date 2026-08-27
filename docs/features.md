# Features — KukkutPro

> Split into Core MVP (must ship) and Future / Nice-to-have (post-MVP backlog).

---

## Core MVP Features

These features form the complete daily operational loop. Nothing in this section is optional for launch.

---

### F-01 · Egg Production Entry

**What it does:** Owner enters daily egg production figures.

**Fields:**
- Date (defaults to today)
- Eggs produced (integer)
- Broken / damaged eggs
- Auto-calculated: peti equivalent and loose eggs display

**Rules:**
- One production entry per day. If an entry already exists for the date, the system shows an edit screen, not a blank form.
- Broken eggs cannot exceed eggs produced.
- Production entry triggers an automatic egg inventory recalculation for that day.

---

### F-02 · Egg Inventory (Automatic)

**What it does:** Maintains a running egg stock ledger — no manual entry required.

**Formula (per day):**
```
Closing Stock = Opening Stock + Eggs Produced − Eggs Sold − Broken Eggs
```

**Display formats (all derived from egg count):**
- Eggs (raw number)
- Trays (eggs ÷ 30)
- Peti (eggs ÷ 210)

**Rules:**
- Opening stock of any day = Closing stock of the previous day.
- Stock cannot go negative. The system blocks a sale if it would result in negative stock.
- If production entry is edited, all downstream inventory values recalculate automatically.

---

### F-03 · Egg Sales Entry

**What it does:** Records a sale transaction — quantity sold, price, payment collected.

**Fields:**
- Date (defaults to today)
- Customer (select from existing or quick-add inline)
- Quantity sold (enter in eggs, trays, or peti — system converts to eggs internally)
- Price per unit (peti / tray / egg — owner's choice)
- Total amount (auto-calculated)
- Amount received (cash collected now)
- Amount due (auto-calculated: Total − Received)
- Notes (optional)

**Rules:**
- Cannot sell more eggs than current closing stock for that date.
- If amount received < total amount, the difference is automatically added to the customer's outstanding dues.
- If amount received = total amount, sale is marked as fully paid.
- Each sale creates a cash entry for the amount received.

---

### F-04 · Customer Dues Ledger

**What it does:** Tracks running balance for each customer — what they owe and what they've paid.

**Per customer view shows:**
- Total purchases (lifetime)
- Total paid (lifetime)
- Outstanding balance
- List of unpaid / partially paid sales
- Payment history

**Payment entry fields:**
- Date
- Amount received
- Notes (e.g., "partial payment for 15 Aug sale")

**Rules:**
- A payment entry reduces outstanding balance but does not delete the original sale record.
- Cannot record a payment greater than outstanding balance (unless explicitly marked as advance).
- Advance payments are stored and auto-applied to the next sale.
- Every payment creates a corresponding cash book entry.

---

### F-05 · Customer Management

**What it does:** Maintains a directory of egg buyers.

**Fields per customer:**
- Name
- Phone number
- Address / location (optional)
- Notes (optional)

**Derived / computed:**
- Total purchases
- Total paid
- Outstanding balance
- Last transaction date

**Views:**
- Customer list (sorted by outstanding balance, then name)
- Customer detail with full transaction history
- "Who owes me money?" — filtered list showing only customers with outstanding > ₹0

---

### F-06 · Cash Book

**What it does:** Maintains a daily cash ledger so the owner can verify the cash in hand.

**Daily cash formula:**
```
Closing Cash = Opening Cash + Cash In − Cash Out
```

**Cash In sources (automatic):**
- Cash received on egg sales
- Customer due payments

**Cash Out sources (automatic):**
- Labour salary payments
- Expense entries (when marked as cash paid)

**Manual entry also allowed** for:
- Other cash receipts (e.g., selling old cartons)
- Owner withdrawals
- Miscellaneous

**View:**
- Day-by-day cash book with each line item
- Today's expected closing cash vs. actual (owner can confirm or note variance)

**Rules:**
- Every financial transaction that involves cash automatically posts to the cash book — no double entry required by the owner.
- Manual adjustments are flagged distinctly so they are auditable.

---

### F-07 · Labour Management

**What it does:** Tracks salary, payments, and advances for each farm worker.

**Fields per labourer:**
- Name
- Phone number
- Role / work description
- Salary type: Monthly / Daily / Per-task
- Salary amount
- Joining date

**Salary payment entry:**
- Date
- Amount paid
- Payment type: Salary / Advance
- Notes

**Per labourer view shows:**
- Total salary owed (cumulative)
- Total paid
- Outstanding balance
- Advance balance
- Full payment history

**Rules:**
- Monthly salary accrues on the 1st of each month (or configurable date).
- Advance payments reduce from the next salary disbursement automatically.
- Every salary payment creates a cash book entry (cash out).

---

### F-08 · Expense Entry

**What it does:** Records farm operating expenses.

**Fields:**
- Date
- Category (from predefined list)
- Item / description
- Quantity (optional)
- Unit cost (optional)
- Total amount
- Notes

**Expense categories (predefined, owner can add custom):**
- Feed (Maaka, grain, etc.)
- Medicine
- Vaccines
- Supplements
- Packaging (cartons, trays)
- Transport
- Electricity
- Water
- Equipment / repairs
- Labour (links to labour payment, auto-created)
- Other

**Rules:**
- Each expense creates a cash book entry.
- Expenses are not linked to inventory in MVP (no stock tracking of medicine — deferred to future).

---

### F-09 · Dashboard

**What it does:** Shows the owner the most important numbers at a glance — today's operational status.

**Today's section:**
- Eggs produced
- Eggs sold
- Eggs in stock (closing)
- Cash collected today
- Credit sales today (amount not collected)
- Total expenses today
- Net cash movement (cash in − cash out)

**Outstanding section:**
- Total customer dues (all customers combined)
- Total labour dues (all workers combined)
- Top 3 customers by outstanding amount

**Farm status:**
- Current egg stock (in eggs, trays, and peti)
- Production yesterday vs. today

**Rules:**
- Dashboard data is read-only — no entry happens here.
- All figures update immediately when underlying records are saved.

---

### F-10 · Navigation & App Shell

**What it does:** Top-level navigation and shared UI chrome.

**Sections in nav:**
1. Dashboard
2. Daily Entry (Production + Sales quick entry)
3. Egg Sales
4. Customers
5. Cash Book
6. Labour
7. Expenses
8. Settings

**Settings includes:**
- Farm name
- Owner name
- Opening cash balance (one-time setup)
- Peti size (default 210 — editable)
- Expense categories management

---

### F-11 · Loading / Empty / Error States

Every screen must handle all three states explicitly:

| State | Behaviour |
|---|---|
| **Loading** | Skeleton loaders — not spinners. Each card/row shows a grey shimmer placeholder. |
| **Empty** | Descriptive empty state with icon and a call-to-action button. E.g., "No sales yet today — tap to add a sale." |
| **Error** | Inline error message with a retry button. Never a blank white screen. |
| **Validation error** | Field-level inline error on form submission. Fields highlighted in red with specific message. |

---

## Future / Nice-to-Have Features

These are explicitly out of MVP scope. They are documented here so architectural decisions don't accidentally block them.

---

### Phase 2 — After MVP Validation

| Feature | Description |
|---|---|
| **Supplier Management** | Track feed/medicine suppliers, purchases on credit, dues owed to suppliers |
| **Product Inventory** | Stock tracking for feed, medicine, vaccines — track purchases, usage, current stock, low-stock alerts |
| **Flock Management** | Bird count, mortality tracking, flock age, egg production per bird |
| **Reports & Analytics** | Daily/monthly egg report, sales report, expense report, customer dues aging report |
| **Data Export** | Export any report to PDF or Excel |

### Phase 3 — Growth Features

| Feature | Description |
|---|---|
| **Multi-user / Roles** | Owner + manager login with role-based access |
| **Notifications & Alerts** | Due payment reminders, low stock alerts, salary due alerts |
| **Profitability Calculator** | Revenue − expenses = operating profit, trend over months |
| **Offline Support** | Queue entries offline, sync when connection restores |
| **Multi-farm** | Manage more than one farm under a single account |
| **SMS/WhatsApp Dues Reminder** | Send a due reminder to a customer via WhatsApp |
| **Daily report share** | Auto-generate a daily summary the owner can share via WhatsApp |

---

## Feature Priority Matrix

| Feature | Priority | Complexity | MVP? |
|---|---|---|---|
| Egg Production Entry | P0 | Low | ✅ |
| Egg Inventory (auto) | P0 | Medium | ✅ |
| Egg Sales Entry | P0 | Medium | ✅ |
| Customer Dues Ledger | P0 | Medium | ✅ |
| Cash Book | P0 | Medium | ✅ |
| Labour Management | P1 | Medium | ✅ |
| Expense Entry | P1 | Low | ✅ |
| Customer Management | P1 | Low | ✅ |
| Dashboard | P1 | Medium | ✅ |
| Reports | P2 | High | ❌ |
| Supplier Management | P2 | High | ❌ |
| Product Inventory | P2 | Medium | ❌ |
| Flock Management | P3 | High | ❌ |
| Notifications | P3 | Medium | ❌ |
| Offline Support | P3 | Very High | ❌ |
