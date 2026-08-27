# User Flows — KukkutPro

> This document maps every path a user can take through the application — including happy paths, error paths, and edge cases. The coding agent must implement all flows described here, not just the happy path.

---

## Flow Notation

```
[Screen]          → Screen name
(Action)          → User action
→                 → Navigation / transition
✓                 → Success state
✗                 → Error state / blocked
?                 → Decision point / conditional
⚡                → Automatic side effect (no user input)
```

---

## Flow 0: First-Time Setup

This flow runs once when the app is first opened. It cannot be skipped.

```
[Welcome Screen]
  (Tap "Set Up My Farm")
  → [Setup Step 1: Farm Name]
      Enter farm name
      (Tap "Next")
  → [Setup Step 2: Opening Egg Stock]
      "How many eggs do you currently have in stock?"
      Enter number (default 0)
      Display: peti + trays + loose eggs preview
      (Tap "Next")
  → [Setup Step 3: Opening Cash Balance]
      "How much cash do you have right now?"
      Enter amount (default 0)
      (Tap "Finish Setup")
  ⚡ System initialises egg inventory and cash book with these values
  → [Dashboard] ✓
```

**Error cases:**
- Farm name left blank → inline error: "Please enter your farm name"
- Negative numbers → inline error: "Please enter 0 or a positive number"

---

## Flow 1: Daily Production Entry

**Entry point:** Dashboard → "Add Production" button, OR Daily Entry tab → Production card

```
[Dashboard]
  (Tap "Add Production" / FAB on Daily screen)
  → [Production Entry Form]
      Date: today (editable)
      Eggs produced: [number input]
      Broken eggs: [number input, optional]
      Notes: [text, optional]
      Live preview: "22 peti + 0 loose eggs" updates as typing
      (Tap "Save")
      ? Is there already an entry for this date?
          YES → Modal: "You already recorded production for 27 Aug.
                        Do you want to edit it?"
                  (Tap "Edit") → pre-fills form with existing data
                  (Tap "Cancel") → returns to form
          NO  → Validate
                ? broken eggs > eggs produced?
                    YES → ✗ inline error: "Broken eggs cannot exceed total production"
                    NO  → ⚡ Save production entry
                          ⚡ Recalculate egg inventory for today forward
                          → [Dashboard] ✓ with success toast: "Production saved"
```

**Empty state (no production today):** Dashboard shows "No production recorded today" with prominent "Add Production" button.

---

## Flow 2: Record an Egg Sale

**Entry point:** Sales tab → FAB, OR Daily Entry → "Add Sale"

```
[Sales List Screen]
  (Tap FAB "+")
  → [Sale Entry Form]
      Date: today (editable)
      Customer: [searchable dropdown]
          ? Customer not found in list?
              (Tap "Add new customer")
              → [Inline Customer Quick-Add Sheet]
                  Name: [required]
                  Phone: [optional]
                  (Tap "Add")
                  ⚡ Customer created
                  → Back to Sale form, customer pre-selected ✓
      Quantity:
          [Toggle: Eggs | Trays | Peti]
          [Number input]
          Live preview: "X eggs" regardless of input mode
          Live preview: "Available: Y eggs (Z peti + N loose)"
      Price:
          [Toggle: Per Egg | Per Tray | Per Peti]
          [Decimal input with ₹ prefix]
          Live: "Total: ₹X,XXX"
      Amount received:
          [Decimal input with ₹ prefix]
          Live: "Due: ₹X,XXX" (total − received)
      Notes: [optional]
      (Tap "Save Sale")
      ? Quantity > available stock?
          YES → ✗ Blocked: "Only X eggs available on 27 Aug. Reduce quantity."
                   Quantity field highlighted in red
      ? Amount received > total amount?
          YES → ✗ "Amount received cannot exceed total. Total is ₹X,XXX."
      ? All validations pass?
          YES → ⚡ Sale saved
                ⚡ Egg inventory reduced
                ⚡ If amountDue > 0: customer outstanding updated
                ⚡ Cash book entry created (cash in = amountReceived)
                → [Sales List] ✓ toast: "Sale recorded. Due: ₹X,XXX" (if partial)
                                        "Sale recorded. Fully paid." (if paid)
```

**Edge case — sale entered for a past date:**
```
      Date changed to past date
      ? Does past date have enough stock?
          YES → form proceeds normally
          NO  → ✗ "Insufficient stock for that date. Only X eggs were available."
```

---

## Flow 3: Record a Customer Payment

**Entry point:** Customers tab → Customer row → "Record Payment", OR Dues banner on Dashboard

```
[Customer List] (filtered: "Has dues")
  (Tap customer row)
  → [Customer Detail Screen]
      Header: Name, outstanding balance in large red text
      Tabs: [Summary | Sales | Payments]
      Summary tab shows unpaid sales list
      (Tap "Receive Payment" button)
      → [Payment Entry Bottom Sheet]
          Date: today (editable)
          Amount: [₹ input]
                  Helper: "Outstanding: ₹X,XXX"
          Notes: [optional]
          (Tap "Confirm Payment")
          ? Amount > outstanding balance?
              YES → Modal: "This amount (₹X,XXX) is more than the outstanding
                           balance (₹Y,YYY). Mark the extra as advance payment?"
                    [Yes, mark as advance] → payment saved, advance noted
                    [Cancel] → return to sheet
          ? Amount = 0 or negative?
              YES → ✗ inline error: "Enter a valid amount"
          ? All valid?
              YES → ⚡ Payment saved
                    ⚡ Customer outstanding balance reduced
                    ⚡ Cash book entry created (cash in)
                    → Sheet closes ✓
                    Customer outstanding updates live on the detail screen
```

---

## Flow 4: Log a Farm Expense

**Entry point:** Expenses tab → FAB

```
[Expense List]
  (Tap FAB "+")
  → [Expense Entry Form]
      Date: today (editable)
      Category: [dropdown — Feed, Medicine, Vaccines, Supplements, Packaging, Transport, Electricity, Water, Equipment, Other]
                ? Owner wants a custom category?
                    (Tap "Add category")
                    → [Inline: Enter category name] → saved
      Item description: [text input]
      Quantity: [number, optional]
      Unit cost: [₹, optional]
                 ? Both quantity and unit cost filled?
                    → Total amount auto-calculated
      Total amount: [₹, required]
      Notes: [optional]
      (Tap "Save")
      ? Total amount is 0 or empty?
          YES → ✗ "Enter the total amount"
      ? All valid?
          YES → ⚡ Expense saved
                ⚡ Cash book entry created (cash out)
                → [Expense List] ✓ toast: "Expense recorded"
```

---

## Flow 5: Pay a Labourer

**Entry point:** Labour tab → Labourer row → "Record Payment"

```
[Labour List]
  (Tap labourer row)
  → [Labourer Detail Screen]
      Name, role, salary info
      Outstanding balance (prominent)
      Advance balance (if any)
      Payment history
      (Tap "Record Payment")
      → [Payment Bottom Sheet]
          Date: today (editable)
          Payment type: [toggle — Salary | Advance]
          Amount: [₹ input]
                  Helper: "Outstanding salary: ₹X,XXX"
          Notes: [optional]
          (Tap "Confirm")
          ? Amount > outstanding AND type = Salary?
              YES → ✗ "Salary outstanding is only ₹X,XXX. To pay more, select Advance."
          ? All valid?
              YES → ⚡ Payment saved
                    ⚡ Outstanding balance updated
                    ⚡ Cash book entry created (cash out)
                    → Sheet closes ✓
```

---

## Flow 6: View Dashboard

**Entry point:** App launch (default screen)

```
[App opens]
  ⚡ Dashboard data fetched (today's summary)
  ? Data loading?
      YES → Skeleton layout shown (card shapes shimmer)
      NO  → Populated dashboard
  
  Dashboard sections:
  ┌─────────────────────────────┐
  │  TODAY — 27 Aug 2026        │
  │  Eggs produced: 4,620       │
  │  Eggs sold: 3,990           │
  │  In stock: 1,200 (5 peti)   │
  ├─────────────────────────────┤
  │  CASH TODAY                 │
  │  Collected: ₹2,850  ↑ green │
  │  Credit: ₹850       ↑ amber │
  │  Expenses: ₹3,500   ↓ red   │
  │  Cash balance: ₹7,850       │
  ├─────────────────────────────┤
  │  OUTSTANDING DUES           │
  │  Customer dues: ₹42,000     │
  │  Labour dues: ₹5,000        │
  │  Top: Rajesh ₹12,000        │
  │       Sunil  ₹8,500         │
  └─────────────────────────────┘

  (Tap any section) → navigates to that module's screen
  ? No production entry today?
      → Banner: "No production recorded today" with "Add Production" CTA
  ? No sales today?
      → Section shows zero with muted style (not an error)
```

---

## Flow 7: Void a Sale (Error Correction)

**Entry point:** Sales list → Sale row → Sale detail

```
[Sale Detail Screen]
  Shows all sale fields (read-only)
  Status badge
  (Tap "⋯" menu → "Void this sale")
  → Modal: "Are you sure you want to void this sale?
            This will return X eggs to stock and reverse the cash entry.
            This action cannot be undone."
    [Cancel]
    [Void Sale] (danger button)
  ? Sale has received payments?
      YES → Additional warning: "₹X,XXX was received for this sale.
                                  A reversal entry will be created in the cash book."
  ? Confirmed?
      YES → ⚡ Sale status → VOIDED
            ⚡ Egg stock restored
            ⚡ Cash book reversal entry created
            ⚡ Customer due reversed
            → [Sales List] ✓ toast: "Sale voided. Egg stock updated."
```

---

## Error Flows

### Network Error During Save

```
[Any form]
  (Tap Save)
  ⚡ API call starts
  ✗ Network timeout / 5xx error
  → Form stays open
  → Error banner at top: "Couldn't save. Check your connection."
  → [Retry] button
  ? Retry pressed?
      → API call repeats
  ? Still failing?
      → User can leave form (unsaved data stays in form state)
```

### Loading Error on List Screen

```
[Sales / Customer / Labour list]
  ⚡ API called
  ✗ Error response
  → [Error state view]
      Icon + "Something went wrong"
      [Retry] button
      (Tap Retry) → Re-fetches
```

### Session Expired (Post-auth MVP)

```
[Any screen]
  ⚡ API call returns 401
  → Toast: "Your session has expired"
  → Redirect to [Login Screen]
  → After login, redirect back to original screen
```

### Validation Error on Form

```
[Any form]
  (Tap Save with invalid data)
  → Form does NOT submit
  → Each invalid field shows inline error below it
  → First invalid field is scrolled into view and focused
  → Save button does NOT show a loading state (it never started)
```

### Empty State Flows

```
[Customer List — first time, no customers]
  → [Empty state]
      Icon: Users (grey)
      Text: "No customers added yet"
      Sub-text: "Add buyers to track sales and dues"
      CTA: "Add Your First Customer" (primary button)

[Sales List — no sales today]
  → [Empty state for today tab]
      Icon: ShoppingCart (grey)
      Text: "No sales recorded today"
      CTA: "Add Sale" (primary button)

[Cash Book — first day after setup]
  → Shows opening balance entry only
  → Text: "Only your opening balance is here. Transactions will appear as you record them."
```

---

## Navigation Map

```
Bottom Nav
├── Dashboard (default)
├── Daily Entry
│   ├── Production entry form
│   └── Quick sale entry form
├── Sales
│   ├── Sales list (today / date filter)
│   ├── Sale detail
│   └── New sale form
├── Ledger
│   ├── Customers list
│   ├── Customer detail
│   │   ├── Sales tab
│   │   └── Payments tab
│   └── Cash Book
│       └── Day detail
└── More (drawer)
    ├── Labour
    │   ├── Labour list
    │   ├── Labourer detail
    │   └── Add labourer form
    ├── Expenses
    │   ├── Expense list
    │   └── Add expense form
    └── Settings
        ├── Farm info
        ├── Opening balances
        └── Expense categories
```

---

## Deep Link / Quick Actions

These are the actions a user should be able to reach in 1–2 taps from the dashboard:

| Quick action | How to reach |
|---|---|
| Add today's production | Dashboard → "Add Production" banner or FAB on Daily tab |
| Add a sale | Sales tab → FAB |
| Receive customer payment | Dashboard → customer in "Outstanding" section → "Receive Payment" |
| Add expense | Expenses tab → FAB |
| Pay a worker | Labour tab → worker row → "Record Payment" |
| Check current stock | Dashboard → stock card, always visible |
| Check cash balance | Dashboard → cash card, always visible |
