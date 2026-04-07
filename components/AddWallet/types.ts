export interface FormErrors {
  name?: string;
  amount?: string;
  account_id?: string;
  tag_ids?: string;
}

export type FormDataType = {
  name: string;
  amount: string;
  type: 'expense' | 'saving' | 'pending_payment';
  account_id: string;
  tag_ids?: string[];
};
