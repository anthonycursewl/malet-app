export type TransactionType = 'expense' | 'saving';

export interface TransactionItem {
    id: number;
    name: string;
    amount: string;
    type: TransactionType;
    account_id: string;
    issued_at: Date;
}