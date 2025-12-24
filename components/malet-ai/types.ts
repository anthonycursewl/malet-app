// Local UI Message type for display
export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'error';
}

export interface Suggestion {
    id: string;
    text: string;
}
