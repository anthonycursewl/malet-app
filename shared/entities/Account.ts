export interface Account {
    id: string;
    name: string; 
    balance: number;
    currency: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    icon?: string;
}