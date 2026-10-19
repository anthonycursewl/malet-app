import { FlashList } from '@shopify/flash-list';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import VerificationBadge from '@/components/shared/VerificationBadge';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { MembersSkeleton } from './Skeletons';

/** Foto de perfil redonda (el avatar mide 40). */
const AVATAR_SIZE = 40;
const AVATAR_RADIUS = AVATAR_SIZE / 2;

interface MembersPickerProps {
    /** Ids ya seleccionados al abrir. */
    selectedIds: string[];
    onConfirm: (userIds: string[]) => void;
    onClose: () => void;
}

/**
 * Selector de miembros con **paginación por cursor**: carga la primera página y
 * pide la siguiente al llegar al final. Muestra foto y nombre para identificar
 * a cada miembro de un vistazo.
 */
function MembersPicker({ selectedIds, onConfirm, onClose }: MembersPickerProps) {
    const members = useSalesModuleStore((s) => s.members);
    const membersLoading = useSalesModuleStore((s) => s.membersLoading);
    const loadMembers = useSalesModuleStore((s) => s.loadMembers);

    const [selected, setSelected] = useState<string[]>(selectedIds);

    // Primera página (con refresco para traer lo último de la tienda).
    useEffect(() => {
        void loadMembers({ refresh: true });
    }, [loadMembers]);

    const toggle = (user_id: string) =>
        setSelected((prev) =>
            prev.includes(user_id)
                ? prev.filter((id) => id !== user_id)
                : [...prev, user_id]
        );

    return (
        <>
            <View style={styles.list}>
                <FlashList
                    data={members}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const active = selected.includes(item.user_id);
                        const label = item.name ?? 'Miembro';

                        return (
                            <TouchableOpacity
                                style={[styles.row, active && styles.rowActive]}
                                onPress={() => toggle(item.user_id)}
                                activeOpacity={0.7}
                            >
                                {item.avatar_url ? (
                                    <Image
                                        source={{ uri: item.avatar_url }}
                                        style={styles.avatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.avatar}>
                                        <TextMalet style={styles.avatarText}>
                                            {label.charAt(0).toUpperCase()}
                                        </TextMalet>
                                    </View>
                                )}

                                <View style={styles.rowTexts}>
                                    <View style={styles.nameRow}>
                                        <TextMalet
                                            style={styles.rowName}
                                            numberOfLines={1}
                                        >
                                            {label}
                                        </TextMalet>
                                        <VerificationBadge
                                            user={{
                                                verified: item.verified,
                                                verification_type:
                                                    item.verification_type,
                                            }}
                                            size={16}
                                        />
                                    </View>
                                    <TextMalet style={styles.rowSub} numberOfLines={1}>
                                        Miembro de la tienda
                                    </TextMalet>
                                </View>

                                <View style={[styles.check, active && styles.checkActive]}>
                                    {active && <Check size={14} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => void loadMembers({ refresh: false })}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={
                        membersLoading && members.length > 0 ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#111" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        membersLoading ? (
                            <MembersSkeleton rows={6} />
                        ) : (
                            <TextMalet style={styles.empty}>
                                Todavía no hay miembros con los que compartir los avisos.
                            </TextMalet>
                        )
                    }
                />
            </View>

            <View style={styles.actions}>
                <Button text="Cancelar" onPress={onClose} style={styles.action} />
                <Button
                    text={`Listo (${selected.length})`}
                    onPress={() => onConfirm(selected)}
                    style={styles.action}
                />
            </View>
        </>
    );
}

interface StoreNotificationMembersModalProps {
    visible: boolean;
    /** Ids seleccionados actualmente. */
    selectedIds: string[];
    /** Cambia en cada apertura: el selector se monta de cero con la selección actual. */
    pickerKey: number;
    onConfirm: (userIds: string[]) => void;
    onClose: () => void;
}

/** Modal (el custom de la app) para elegir qué miembros reciben los avisos. */
export default function StoreNotificationMembersModal({
    visible,
    selectedIds,
    pickerKey,
    onConfirm,
    onClose,
}: StoreNotificationMembersModalProps) {
    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.82}>
            <TextMalet style={styles.title}>Miembros que reciben los correos</TextMalet>
            <TextMalet style={styles.subtitle}>
                Toca a los miembros que quieras avisar. La lista se carga por páginas.
            </TextMalet>

            <MembersPicker
                key={pickerKey}
                selectedIds={selectedIds}
                onConfirm={onConfirm}
                onClose={onClose}
            />
        </ModalOptions>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
        marginTop: 4,
    },
    list: {
        flex: 1,
        marginTop: 14,
    },
    listContent: {
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    rowActive: {
        borderColor: '#111',
        backgroundColor: '#fafafa',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_RADIUS,
        backgroundColor: '#f0f0f2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_RADIUS,
        backgroundColor: '#f0f0f2',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    rowTexts: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rowName: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
        flexShrink: 1,
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 1,
    },
    check: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    footerLoader: {
        paddingVertical: 14,
    },
    empty: {
        fontSize: 12.5,
        color: 'rgba(0,0,0,0.45)',
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    action: {
        flex: 1,
    },
});
