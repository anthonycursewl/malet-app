import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { QrCode, UserCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import VerificationBadge from '@/components/shared/VerificationBadge';
import { StoreMember } from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify, notifyUndo } from './format';
import { MembersSkeleton } from './Skeletons';
import { useStoreHeaderScroll } from './storeHeaderScroll';
import SectionTitle from './SectionTitle';

/** Nombre visible del miembro (el backend ya envía `name`). */
function memberLabel(m: StoreMember): string {
    return (
        m.name?.trim() ||
        m.user?.name?.trim() ||
        m.user?.username?.trim() ||
        m.user?.email?.trim() ||
        m.user_id
    );
}

/**
 * Miembros de la tienda: lista paginada por cursor (`seq`) con avatar y
 * verificación, invitación por QR, alta manual y baja/restauración.
 */
export default function MembersSection({ storeId }: { storeId: string }) {
    const user = useAuthStore((s) => s.user);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const members = useSalesModuleStore((s) => s.members);
    /** Scroll de la lista: minimiza la cabecera del panel. */
    const headerScroll = useStoreHeaderScroll();
    const membersLoading = useSalesModuleStore((s) => s.membersLoading);
    const loadMembers = useSalesModuleStore((s) => s.loadMembers);
    const addMember = useSalesModuleStore((s) => s.addMember);
    const removeMember = useSalesModuleStore((s) => s.removeMember);
    const restoreMember = useSalesModuleStore((s) => s.restoreMember);
    const hardDeleteMember = useSalesModuleStore((s) => s.hardDeleteMember);

    const [userId, setUserId] = useState('');
    const [adding, setAdding] = useState(false);

    const isOwner = currentStore?.user_id === user?.id;

    const handleAdd = async () => {
        const value = userId.trim();
        if (!value) {
            notify('error', 'Pega el ID del usuario que quieres agregar.');
            return;
        }
        setAdding(true);
        const err = await addMember(value);
        setAdding(false);
        if (err) {
            notify('error', err);
            return;
        }
        setUserId('');
        notify('success', 'Miembro agregado a la tienda.');
    };

    const onPressMember = (m: StoreMember) => {
        if (m.user_id === currentStore?.user_id) {
            Alert.alert('Miembro', 'Esta persona es la dueña de la tienda y no puede quitarse.');
            return;
        }
        const label = memberLabel(m);
        const canHardDelete = (m.added_by ?? m.created_by ?? null) === user?.id;

        const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Quitar de la tienda',
                style: 'destructive',
                onPress: async () => {
                    const err = await removeMember(m.id);
                    if (err) {
                        notify('error', err);
                        return;
                    }
                    notifyUndo(`${label} fue quitado de la tienda.`, async () => {
                        const restoreErr = await restoreMember(m.id);
                        if (restoreErr) notify('error', restoreErr);
                        else notify('success', 'Miembro restaurado.');
                    });
                },
            },
        ];
        if (canHardDelete) {
            buttons.push({
                text: 'Eliminar definitivamente',
                style: 'destructive',
                onPress: async () => {
                    const err = await hardDeleteMember(m.id);
                    if (err) notify('error', err);
                    else notify('success', 'Membresía eliminada definitivamente.');
                },
            });
        }
        Alert.alert(label, undefined, buttons);
    };

    const header = (
        <View style={styles.header}>
            <TextMalet style={styles.description}>
                Cualquier miembro activo puede administrar productos, métodos de cobro y ventas de
                la tienda.
            </TextMalet>

            {isOwner && (
                <View style={styles.inviteCard}>
                    <View style={styles.inviteTexts}>
                        <TextMalet style={styles.inviteTitle}>Invitar con QR</TextMalet>
                        <TextMalet style={styles.inviteSub}>
                            Genera un código que se renueva solo cada minuto. La otra persona lo
                            escanea desde la app y acepta la invitación.
                        </TextMalet>
                    </View>
                    <Button
                        text="Abrir QR"
                        icon={<QrCode size={14} color="#fff" />}
                        onPress={() =>
                            router.push({ pathname: '/cuaderno/invite', params: { store: storeId } } as any)
                        }
                    />
                </View>
            )}

            <View style={styles.addCard}>
                <TextMalet style={styles.addTitle}>Agregar por ID</TextMalet>
                <TextMalet style={styles.addSub}>
                    Pega el ID (UUID) del usuario de Malet. Si ya fue removido, se restaura su
                    membresía.
                </TextMalet>
                <View style={styles.addRow}>
                    <View style={{ flex: 1 }}>
                        <InputField
                            label="ID del usuario"
                            placeholder="Pega el ID (UUID)"
                            value={userId}
                            onChangeText={setUserId}
                            autoCapitalize="none"
                        />
                    </View>
                    {adding ? (
                        <ActivityIndicator size="small" color="#000" style={styles.addSpinner} />
                    ) : (
                        <Button text="Agregar" onPress={handleAdd} />
                    )}
                </View>
            </View>

            <SectionTitle icon={UserCheck}>
                Miembros {members.length > 0 ? `(${members.length})` : ''}
            </SectionTitle>
        </View>
    );

    const renderMember = ({ item }: { item: StoreMember }) => {
        const owner = item.user_id === currentStore?.user_id;
        const label = memberLabel(item);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => onPressMember(item)}
            >
                {/* Portada decorativa */}
                {item.banner_url ? (
                    <Image source={{ uri: item.banner_url }} style={styles.banner} resizeMode="cover" />
                ) : (
                    <View style={[styles.banner, styles.bannerFallback]} />
                )}

                <View style={styles.cardBody}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatar}>
                            <TextMalet style={styles.avatarText}>
                                {label.charAt(0).toUpperCase()}
                            </TextMalet>
                        </View>
                    )}

                    <View style={styles.cardTexts}>
                        <View style={styles.nameRow}>
                            <TextMalet style={styles.rowTitle} numberOfLines={1}>
                                {label}
                            </TextMalet>
                            <View style={styles.badgeWrap}>
                                <VerificationBadge
                                    user={{
                                        verified: item.verified,
                                        verification_type: item.verification_type,
                                    }}
                                    size={18}
                                />
                            </View>
                        </View>
                        <TextMalet style={styles.rowSub}>
                            {owner ? 'Dueño' : 'Miembro · toca para opciones'}
                        </TextMalet>
                    </View>

                    {owner && (
                        <View style={styles.ownerBadge}>
                            <TextMalet style={styles.ownerBadgeText}>Dueño</TextMalet>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrap}>
            <FlashList
                {...headerScroll}
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                ListHeaderComponent={header}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onEndReachedThreshold={0.4}
                onEndReached={() => loadMembers({ refresh: false })}
                onRefresh={() => loadMembers({ refresh: true })}
                refreshing={membersLoading && members.length === 0}
                ListEmptyComponent={
                    membersLoading ? (
                        <MembersSkeleton />
                    ) : (
                        <View style={styles.empty}>
                            <TextMalet style={styles.emptyTitle}>Aún no hay miembros</TextMalet>
                        </View>
                    )
                }
                ListFooterComponent={
                    membersLoading && members.length > 0 ? (
                        <ActivityIndicator size="small" color="#999" style={styles.footer} />
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
    },
    header: {
        gap: 14,
        paddingBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#888',
        lineHeight: 19,
    },
    inviteCard: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        alignItems: 'flex-start',
    },
    inviteTexts: {
        gap: 4,
        paddingRight: 8,
    },
    inviteTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    inviteSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 17,
    },
    addCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    addTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    addSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
        lineHeight: 16,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    addSpinner: {
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    listContent: {
        paddingBottom: 48,
    },
    empty: {
        alignItems: 'center',
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    footer: {
        marginVertical: 14,
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 16,
        marginBottom: 10,
        overflow: 'hidden',
    },
    banner: {
        width: '100%',
        height: 54,
        backgroundColor: '#eef0f3',
    },
    bannerFallback: {
        backgroundColor: '#eef0f3',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 12,
    },
    cardTexts: {
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f0f2',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -26,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginTop: -26,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: '#f0f0f2',
    },
    avatarText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    /** Espacio fijo del badge: evita que se encoja o desalinee en la fila. */
    badgeWrap: {
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        flexShrink: 1,
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.4)',
        marginTop: 2,
    },
    ownerBadge: {
        backgroundColor: 'rgba(206,112,24,0.12)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    ownerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ce7018',
    },
});
