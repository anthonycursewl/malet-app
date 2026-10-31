import type {
    UserPrimitives,
    VerificationTypePrimitive,
} from '../entities/User';
import { isKnownVerificationType } from '../constants/VERIFICATION_DETAILS';

/**
 * Deja el usuario en un estado coherente:
 * - `verified` solo puede ser true si hay un tipo de verificación válido.
 * - Un tipo desconocido o ausente se descarta para no mostrar badges falsos.
 */
type UserWithFlexibleVerification = Omit<
    UserPrimitives,
    'verification_type'
> & {
    verification_type?: VerificationTypePrimitive | string | null;
};

export function normalizeUserVerification(
    user: UserWithFlexibleVerification
): UserPrimitives {
    const rawType = user.verification_type;
    const typeKey =
        typeof rawType === 'string' ? rawType : (rawType?.type ?? null);

    if (!isKnownVerificationType(typeKey)) {
        return {
            ...user,
            verified: false,
            verification_type: null,
            verification_type_id: null,
        };
    }

    const normalizedType: VerificationTypePrimitive =
        typeof rawType === 'string'
            ? {
                  id: user.verification_type_id ?? '',
                  type: rawType.trim(),
                  icon_url: '',
              }
            : (rawType as VerificationTypePrimitive);

    return {
        ...user,
        verified: Boolean(user.verified),
        verification_type: normalizedType,
        verification_type_id:
            user.verification_type_id ?? normalizedType.id ?? null,
    };
}
