export type TransactionType = 'expense' | 'saving' | 'pending_payment';

export interface Transaction {
    id: string;
    name: string;
    amount: number;
    type: TransactionType;
    account_id: string;
    issued_at: Date;
    description?: string;
    index_id?: string;
    currency_code?: string;
    tags?: Tag[];
    deleted_at?: Date | null;
    pending_balance?: number;
}

interface Tag {
    id: string;
    name: string;
    color?: string;
    palette?: string[];
}

export const isExpense = (t: Transaction): boolean => t.type === 'expense';
export const isSaving = (t: Transaction): boolean => t.type === 'saving';
export const isPending = (t: Transaction): boolean => t.type === 'pending_payment';
export const isDeleted = (t: Transaction): boolean => !!t.deleted_at;