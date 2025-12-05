export interface VerificationTypePrimitive {
    id: string;
    type: string;
    icon_url: string;
}

export interface UserPrimitives {
    id: string;
    name: string;
    username: string;
    email: string;
    created_at: Date;
    password: string;
    avatar_url?: string;
    banner_url?: string;
    verified: boolean;
    verification_type_id?: string | null;
    verification_type?: VerificationTypePrimitive | null;
}


