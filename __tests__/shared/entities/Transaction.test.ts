import { isExpense, isSaving, isPending, isDeleted } from '../../shared/entities/Transaction';

describe('Transaction type guards', () => {
  describe('isExpense', () => {
    it('should return true for expense type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense' as const, account_id: '1', issued_at: new Date() };
      expect(isExpense(transaction)).toBe(true);
    });

    it('should return false for saving type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'saving' as const, account_id: '1', issued_at: new Date() };
      expect(isExpense(transaction)).toBe(false);
    });

    it('should return false for pending_payment type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'pending_payment' as const, account_id: '1', issued_at: new Date() };
      expect(isExpense(transaction)).toBe(false);
    });
  });

  describe('isSaving', () => {
    it('should return true for saving type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'saving' as const, account_id: '1', issued_at: new Date() };
      expect(isSaving(transaction)).toBe(true);
    });

    it('should return false for expense type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense' as const, account_id: '1', issued_at: new Date() };
      expect(isSaving(transaction)).toBe(false);
    });

    it('should return false for pending_payment type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'pending_payment' as const, account_id: '1', issued_at: new Date() };
      expect(isSaving(transaction)).toBe(false);
    });
  });

  describe('isPending', () => {
    it('should return true for pending_payment type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'pending_payment' as const, account_id: '1', issued_at: new Date() };
      expect(isPending(transaction)).toBe(true);
    });

    it('should return false for expense type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense' as const, account_id: '1', issued_at: new Date() };
      expect(isPending(transaction)).toBe(false);
    });

    it('should return false for saving type', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'saving' as const, account_id: '1', issued_at: new Date() };
      expect(isPending(transaction)).toBe(false);
    });
  });

  describe('isDeleted', () => {
    it('should return true when deleted_at is set', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense' as const, account_id: '1', issued_at: new Date(), deleted_at: new Date() };
      expect(isDeleted(transaction)).toBe(true);
    });

    it('should return false when deleted_at is undefined', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense' as const, account_id: '1', issued_at: new Date() };
      expect(isDeleted(transaction)).toBe(false);
    });

    it('should return false when deleted_at is null', () => {
      const transaction = { id: '1', name: 'Test', amount: 100, type: 'expense' as const, account_id: '1', issued_at: new Date(), deleted_at: null };
      expect(isDeleted(transaction)).toBe(false);
    });
  });
});

describe('Transaction entity', () => {
  it('should have correct type definition', () => {
    const validTypes = ['expense', 'saving', 'pending_payment'] as const;
    
    validTypes.forEach(type => {
      const transaction = { 
        id: '1', 
        name: 'Test', 
        amount: 100, 
        type, 
        account_id: '1', 
        issued_at: new Date(),
        description: 'Optional description',
        index_id: 'optional',
        currency_code: 'USD',
        tags: [],
        deleted_at: null,
        pending_balance: 0
      };
      expect(transaction.type).toBe(type);
    });
  });
});