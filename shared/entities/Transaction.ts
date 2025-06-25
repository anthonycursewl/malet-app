export interface Transaction {
    id: string;
    name: string;
    amount: number;
    type: string;
    account_id: string;
    issued_at: Date;
}