export interface SharedAccount {
    id: string;
    name: string;
    account_id: string;
    identification_number: string;
    phone_associated?: string | null;
    email_associated?: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    deleted_at?: Date | string | null;
}
