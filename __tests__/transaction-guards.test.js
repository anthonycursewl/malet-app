// Transaction type guards - Pure logic tests
// Run with: node __tests__/transaction-guards.test.js

let tests = [];
let passed = 0;
let failed = 0;

function describe(name, fn) {
  console.log(`\nDescribe: ${name}`);
  fn();
}

function it(name, fn) {
  tests.push({ name, fn });
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeFalsy: () => {
      if (actual) throw new Error(`Expected falsy, got ${actual}`);
    },
  };
}

// Type guards (copied from shared/entities/Transaction.ts)
const isExpense = (t) => t.type === 'expense';
const isSaving = (t) => t.type === 'saving';
const isPending = (t) => t.type === 'pending_payment';
const isDeleted = (t) => !!t.deleted_at;

describe('Transaction type guards', () => {
  describe('isExpense', () => {
    it('returns true for expense type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense', account_id: '1', issued_at: new Date() };
      expect(isExpense(transaction)).toBeTruthy();
    });

    it('returns false for saving type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'saving', account_id: '1', issued_at: new Date() };
      expect(isExpense(transaction)).toBeFalsy();
    });

    it('returns false for pending_payment type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'pending_payment', account_id: '1', issued_at: new Date() };
      expect(isExpense(transaction)).toBeFalsy();
    });
  });

  describe('isSaving', () => {
    it('returns true for saving type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'saving', account_id: '1', issued_at: new Date() };
      expect(isSaving(transaction)).toBeTruthy();
    });

    it('returns false for expense type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense', account_id: '1', issued_at: new Date() };
      expect(isSaving(transaction)).toBeFalsy();
    });

    it('returns false for pending_payment type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'pending_payment', account_id: '1', issued_at: new Date() };
      expect(isSaving(transaction)).toBeFalsy();
    });
  });

  describe('isPending', () => {
    it('returns true for pending_payment type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'pending_payment', account_id: '1', issued_at: new Date() };
      expect(isPending(transaction)).toBeTruthy();
    });

    it('returns false for expense type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense', account_id: '1', issued_at: new Date() };
      expect(isPending(transaction)).toBeFalsy();
    });

    it('returns false for saving type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'saving', account_id: '1', issued_at: new Date() };
      expect(isPending(transaction)).toBeFalsy();
    });
  });

  describe('isDeleted', () => {
    it('returns true when deleted_at is set', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense', account_id: '1', issued_at: new Date(), deleted_at: new Date() };
      expect(isDeleted(transaction)).toBeTruthy();
    });

    it('returns false when deleted_at is undefined', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense', account_id: '1', issued_at: new Date() };
      expect(isDeleted(transaction)).toBeFalsy();
    });

    it('returns false when deleted_at is null', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense', account_id: '1', issued_at: new Date(), deleted_at: null };
      expect(isDeleted(transaction)).toBeFalsy();
    });
  });
});

// Run tests
tests.forEach(({ name, fn }) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);