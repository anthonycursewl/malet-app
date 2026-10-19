import { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import TextMalet from '@/components/TextMalet/TextMalet';
import {
    NOTIFICATION_GROUP_OPTIONS,
    StoreNotificationGroup,
    StoreNotificationsConfig,
} from '@/shared/entities/SalesModule';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useSalesModuleStore } from '@/shared/stores/useSalesModuleStore';
import { notify } from './format';
import StoreNotificationMembersModal from './StoreNotificationMembersModal';
import { SkeletonBlock, SkeletonShimmer } from './Skeletons';

/** Colores del switch: negro cuando está activo (estilo de la app). */
const SWITCH_TRACK = { false: '#d4d4d8', true: '#a1a1aa' };
const SWITCH_THUMB_ON = '#000';
const SWITCH_THUMB_OFF = '#f4f4f5';

/** Avatares que se muestran antes del contador “+N”. */
const MAX_AVATARS = 6;

/**
 * Formulario de avisos: se monta con la configuración guardada (por eso el
 * `key` del padre) y guarda los cambios al pulsar el botón.
 */
function NotificationsForm({ config }: { config: StoreNotificationsConfig }) {
    const saving = useSalesModuleStore((s) => s.notificationsSaving);
    const saveStoreNotifications = useSalesModuleStore((s) => s.saveStoreNotifications);

    const [events, setEvents] = useState(config.events);
    const [digest, setDigest] = useState(config.digest);
    const [selected, setSelected] = useState(
        config.members.map((m) => m.user_id)
    );
    const [pickerOpen, setPickerOpen] = useState(false);
    /** Cambia en cada apertura para que el selector arranque con la selección actual. */
    const [pickerKey, setPickerKey] = useState(0);

    const toggleGroup = (group: StoreNotificationGroup) =>
        setEvents((prev) => ({ ...prev, [group]: !prev[group] }));

    const save = async () => {
        const error = await saveStoreNotifications({
            events,
            digest,
            member_ids: selected,
        });
        if (error) {
            notify('error', error);
            return;
        }
        notify('success', 'Avisos por correo guardados.');
    };

    const enabledGroups = NOTIFICATION_GROUP_OPTIONS.filter(
        (option) => events[option.value]
    ).length;

    const visibleAvatars = config.members.slice(0, MAX_AVATARS);
    const hiddenAvatars = config.members.length - visibleAvatars.length;

    return (
        <>
            <View style={styles.groups}>
                {NOTIFICATION_GROUP_OPTIONS.map((option) => (
                    <View key={option.value} style={styles.groupRow}>
                        <View style={styles.groupTexts}>
                            <TextMalet style={styles.groupLabel}>{option.label}</TextMalet>
                            <TextMalet style={styles.groupDescription}>
                                {option.description}
                            </TextMalet>
                        </View>
                        <Switch
                            value={events[option.value]}
                            onValueChange={() => toggleGroup(option.value)}
                            disabled={saving}
                            trackColor={SWITCH_TRACK}
                            thumbColor={
                                events[option.value] ? SWITCH_THUMB_ON : SWITCH_THUMB_OFF
                            }
                            ios_backgroundColor="#d4d4d8"
                        />
                    </View>
                ))}
            </View>

            <View style={styles.digestRow}>
                <View style={styles.groupTexts}>
                    <TextMalet style={styles.groupLabel}>Resumen diario</TextMalet>
                    <TextMalet style={styles.groupDescription}>
                        Un correo al final del día con las ventas de hoy (21:00).
                    </TextMalet>
                </View>
                <Switch
                    value={digest}
                    onValueChange={() => setDigest((prev) => !prev)}
                    disabled={saving}
                    trackColor={SWITCH_TRACK}
                    thumbColor={digest ? SWITCH_THUMB_ON : SWITCH_THUMB_OFF}
                    ios_backgroundColor="#d4d4d8"
                />
            </View>

            <View style={styles.membersHeader}>
                <TextMalet style={styles.sectionLabel}>
                    Miembros que reciben los correos
                </TextMalet>
                <TextMalet style={styles.membersCount}>
                    {selected.length === 0
                        ? 'Ninguno'
                        : `${selected.length} seleccionado${selected.length === 1 ? '' : 's'}`}
                </TextMalet>
            </View>

            {config.members.length > 0 ? (
                <View style={styles.selectedRow}>
                    {visibleAvatars.map((member) => (
                        <View key={member.user_id} style={styles.selectedAvatarWrap}>
                            {member.avatar_url ? (
                                <Image
                                    source={{ uri: member.avatar_url }}
                                    style={styles.selectedAvatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.selectedAvatar,
                                        styles.selectedAvatarFallback,
                                    ]}
                                >
                                    <TextMalet style={styles.selectedAvatarText}>
                                        {(member.name ?? 'M').charAt(0).toUpperCase()}
                                    </TextMalet>
                                </View>
                            )}
                        </View>
                    ))}

                    {hiddenAvatars > 0 && (
                        <View style={[styles.selectedAvatar, styles.selectedMore]}>
                            <TextMalet style={styles.selectedMoreText}>
                                +{hiddenAvatars}
                            </TextMalet>
                        </View>
                    )}
                </View>
            ) : (
                <TextMalet style={styles.hint}>
                    Todavía no hay miembros seleccionados para recibir los avisos.
                </TextMalet>
            )}

            <Button
                text="Elegir miembros"
                onPress={() => {
                    setPickerKey((key) => key + 1);
                    setPickerOpen(true);
                }}
                disabled={saving}
                style={styles.pickerBtn}
            />

            <TextMalet style={styles.hint}>
                {enabledGroups === 0
                    ? 'Con todo apagado no se envía ningún correo.'
                    : `Se avisará de ${enabledGroups} ${
                          enabledGroups === 1 ? 'grupo' : 'grupos'
                      } a ${selected.length} ${
                          selected.length === 1 ? 'miembro' : 'miembros'
                      }.`}{' '}
                El envío no bloquea la venta ni la operación.
            </TextMalet>

            <Button
                text="Guardar avisos"
                onPress={save}
                loading={saving}
                style={styles.saveBtn}
            />

            <StoreNotificationMembersModal
                visible={pickerOpen}
                selectedIds={selected}
                pickerKey={pickerKey}
                onClose={() => setPickerOpen(false)}
                onConfirm={(userIds) => {
                    setSelected(userIds);
                    setPickerOpen(false);
                }}
            />
        </>
    );
}

/**
 * Avisos por correo de la tienda: **solo el dueño** elige qué se avisa y a qué
 * miembros llega. Se guarda en la tienda (los demás no ven los emails).
 */
export default function StoreNotificationsCard() {
    const user = useAuthStore((s) => s.user);
    const currentStore = useSalesModuleStore((s) => s.currentStore);
    const config = useSalesModuleStore((s) => s.notifications);
    const loadStoreNotifications = useSalesModuleStore((s) => s.loadStoreNotifications);

    const isOwner = !!currentStore && currentStore.user_id === user?.id;

    // La configuración se carga la primera vez que aparece la tarjeta.
    useEffect(() => {
        if (isOwner && !config) void loadStoreNotifications();
    }, [isOwner, config, loadStoreNotifications]);

    if (!currentStore) return null;

    if (!isOwner) {
        return (
            <View style={styles.card}>
                <TextMalet style={styles.title}>Avisos por correo</TextMalet>
                <TextMalet style={styles.hint}>
                    Solo el dueño de la tienda puede configurar los avisos por correo.
                </TextMalet>
            </View>
        );
    }

    if (!config) {
        return (
            <View style={styles.card}>
                <TextMalet style={styles.title}>Avisos por correo</TextMalet>

                {/* Skeleton con brillo: refleja la tarjeta real (grupos, fotos y botones). */}
                <SkeletonShimmer style={styles.skeleton}>
                    {[0, 1, 2, 3].map((row) => (
                        <View key={row} style={styles.skeletonRow}>
                            <View style={styles.skeletonTexts}>
                                <SkeletonBlock w={110} h={12} r={6} />
                                <SkeletonBlock
                                    w={168}
                                    h={10}
                                    r={5}
                                    style={styles.skeletonLine2}
                                />
                            </View>
                            <SkeletonBlock w={44} h={26} r={13} />
                        </View>
                    ))}

                    <View style={styles.skeletonAvatars}>
                        {[0, 1, 2, 3].map((i) => (
                            <SkeletonBlock key={i} w={40} h={40} r={20} />
                        ))}
                    </View>

                    <View style={styles.skeletonActions}>
                        <SkeletonBlock w={140} h={34} r={17} />
                        <SkeletonBlock w={120} h={34} r={17} />
                    </View>
                </SkeletonShimmer>
            </View>
        );
    }

    // El formulario se re-monta solo cuando cambia lo guardado (tras guardar).
    const formKey = [
        ...NOTIFICATION_GROUP_OPTIONS.map((option) =>
            config.events[option.value] ? '1' : '0'
        ),
        config.digest ? 'd' : '-',
        ...config.members.map((member) => member.user_id).sort(),
    ].join('|');

    return (
        <View style={styles.card}>
            <TextMalet style={styles.title}>Avisos por correo</TextMalet>
            <TextMalet style={styles.subtitle}>
                Elige qué se avisa y a qué miembros les llega un correo. Solo lo ves tú
                (como dueño) y no afecta a los demás miembros.
            </TextMalet>

            <NotificationsForm key={formKey} config={config} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 14,
        gap: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
    },
    skeleton: {
        gap: 8,
        marginTop: 10,
    },
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    skeletonTexts: {
        flex: 1,
    },
    skeletonLine2: {
        marginTop: 6,
    },
    skeletonAvatars: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 14,
    },
    skeletonActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    groups: {
        marginTop: 8,
        gap: 4,
    },
    groupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
    },
    groupTexts: {
        flex: 1,
    },
    groupLabel: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    groupDescription: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.5)',
        marginTop: 2,
        lineHeight: 16,
    },
    digestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    membersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 14,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    membersCount: {
        fontSize: 11.5,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.45)',
    },
    selectedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    selectedAvatarWrap: {
        borderRadius: 20,
    },
    selectedAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f2',
    },
    selectedAvatarFallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedAvatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    selectedMore: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f4f5',
    },
    selectedMoreText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#555',
    },
    pickerBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    hint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 8,
        lineHeight: 16,
    },
    saveBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
    },
});
