import { TransactionTag } from "./TagItem";

export type TransactionType = 'expense' | 'saving' | 'pending_payment';

export interface TransactionItem {
    id: string;
    index_id: number
    name: string;
    amount: string;
    type: TransactionType;
    account_id: string;
    currency_code?: string;
    tags?: TransactionTag[];
    tag_ids?: string[];
    issued_at: Date;
    deleted_at?: Date;
}
