export interface ShoppingItem {
    id: string;
    name: string;
    quantity: number;
    estimatedPrice: number;
    currency: string;
    purchased: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShoppingList {
    items: ShoppingItem[];
    updatedAt: string;
}
