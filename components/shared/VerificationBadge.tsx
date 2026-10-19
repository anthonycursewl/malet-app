import { memo } from "react";
import { TouchableOpacity } from "react-native";
import { getUserVerification } from "@/shared/constants/VERIFICATION_DETAILS";
import IconVerified from "@/svgs/common/IconVerified";

interface VerificationBadgeProps {
    /** Usuario (o cualquier objeto con `verified` y `verification_type`) */
    user?: {
        verified?: boolean | number | null;
        verification_type?: { type?: string | null } | string | null;
    } | null;
    /** Tamaño en px del ícono (default: 20) */
    size?: number;
    /** Si se provee, el badge se vuelve presionable */
    onPress?: () => void;
}

/**
 * Único componente encargado de renderizar el badge de verificación.
 *
 * Reglas centralizadas:
 * - Se renderiza SOLO si `user.verified` es truthy.
 * - Usa el color/nombre correcto de cada tipo de verificación (main, business,
 *   ai, org) con búsqueda exacta + case-insensitive.
 * - Si el backend no envía `verification_type` o el tipo es desconocido,
 *   aplica un color genérico en lugar de no renderizar nada.
 */
const VerificationBadge = memo(({ user, size = 20, onPress }: VerificationBadgeProps) => {
    const verification = getUserVerification(user);

    if (!verification) return null;

    const icon = <IconVerified width={size} height={size} fill={verification.color} />;

    if (!onPress) return icon;

    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Verificación: ${verification.name}`}
        >
            {icon}
        </TouchableOpacity>
    );
});

VerificationBadge.displayName = 'VerificationBadge';

export default VerificationBadge;
