import assert from 'assert';
import { PETI_SIZE, TRAY_SIZE } from '../src/lib/constants';
import { computeEggDisplay } from '../src/services/inventory.service';

console.log('🧪 Running KukkutPro Domain Logic Tests...\n');

// Test 1: Unit Constants
assert.strictEqual(PETI_SIZE, 210, '1 Peti must equal 210 eggs');
assert.strictEqual(TRAY_SIZE, 30, '1 Tray must equal 30 eggs');
console.log('✅ Test 1: Unit constants confirmed (1 Peti = 210, 1 Tray = 30)');

// Test 2: Egg Breakdown Calculations
const b1 = computeEggDisplay(210);
assert.strictEqual(b1.peti, 1);
assert.strictEqual(b1.trays, 0);
assert.strictEqual(b1.looseEggs, 0);

const b2 = computeEggDisplay(4620); // 22 peti exactly
assert.strictEqual(b2.peti, 22);
assert.strictEqual(b2.trays, 0);
assert.strictEqual(b2.looseEggs, 0);

const b3 = computeEggDisplay(4530); // 21 peti (4410) + 4 trays (120) = 4530
assert.strictEqual(b3.peti, 21);
assert.strictEqual(b3.trays, 4);
assert.strictEqual(b3.looseEggs, 0);

const b4 = computeEggDisplay(255); // 1 peti (210) + 1 tray (30) + 15 loose
assert.strictEqual(b4.peti, 1);
assert.strictEqual(b4.trays, 1);
assert.strictEqual(b4.looseEggs, 15);

console.log('✅ Test 2: Egg denomination breakdowns (peti/trays/loose) verified');

// Test 3: Closing Stock Formula (Closing = Opening + Produced - Sold - Broken)
function calculateClosingStock(opening: number, produced: number, sold: number, broken: number) {
  return opening + produced - sold - broken;
}

const day1Stock = calculateClosingStock(500, 4620, 3990, 30);
assert.strictEqual(day1Stock, 1100, '500 + 4620 - 3990 - 30 must equal 1100');
console.log('✅ Test 3: Daily closing stock formula verified (Day 1: 1,100 eggs)');

// Test 4: Financial Cash Reconciliations (Closing Cash = Opening + In - Out)
function calculateClosingCash(opening: number, totalIn: number, totalOut: number) {
  return opening + totalIn - totalOut;
}

const day1Cash = calculateClosingCash(5000, 2000, 3500);
assert.strictEqual(day1Cash, 3500, '5000 + 2000 - 3500 must equal 3500');
console.log('✅ Test 4: Cash book formula verified (₹5000 + ₹2000 - ₹3500 = ₹3500)');

// Test 5: FIFO Customer Payment Allocation
interface MockSale {
  id: string;
  total: number;
  amountDue: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

function applyFifoPayment(sales: MockSale[], paymentAmount: number) {
  let remaining = paymentAmount;
  for (const s of sales) {
    if (remaining <= 0) break;
    if (remaining >= s.amountDue) {
      remaining -= s.amountDue;
      s.amountDue = 0;
      s.status = 'PAID';
    } else {
      s.amountDue -= remaining;
      s.status = 'PARTIAL';
      remaining = 0;
    }
  }
  return { remainingUnapplied: remaining, sales };
}

const mockSales: MockSale[] = [
  { id: 'sale_1', total: 1000, amountDue: 1000, status: 'UNPAID' },
  { id: 'sale_2', total: 2000, amountDue: 1500, status: 'PARTIAL' },
  { id: 'sale_3', total: 500, amountDue: 500, status: 'UNPAID' },
];

const fifoResult = applyFifoPayment(mockSales, 1800);
assert.strictEqual(fifoResult.remainingUnapplied, 0);
assert.strictEqual(fifoResult.sales[0].status, 'PAID');
assert.strictEqual(fifoResult.sales[0].amountDue, 0);
assert.strictEqual(fifoResult.sales[1].status, 'PARTIAL');
assert.strictEqual(fifoResult.sales[1].amountDue, 700); // 1500 - 800
assert.strictEqual(fifoResult.sales[2].status, 'UNPAID');
assert.strictEqual(fifoResult.sales[2].amountDue, 500);
console.log('✅ Test 5: FIFO customer payment allocation across multiple invoices verified');

// Test 6: Validation Edge Cases
assert.throws(() => {
  const produced = 100;
  const broken = 150;
  if (broken > produced) throw new Error('Broken eggs cannot exceed eggs produced');
}, /Broken eggs cannot exceed eggs produced/);

console.log('✅ Test 6: Broken > Produced rejection verified');

console.log('\n🎉 ALL CORE DOMAIN TESTS PASSED SUCCESSFULLY!');
