export type TransactionType = 'expense' | 'saving' | 'pending_payment';

export interface TransactionItem {
    id: number;
    name: string;
    amount: string;
    type: TransactionType;
    account_id: string;
    issued_at: Date;
}