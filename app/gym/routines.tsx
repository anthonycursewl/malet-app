import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import GymHeader from '@/components/gym/GymHeader';
import ModalOptions from '@/components/shared/ModalOptions';
import { notify } from '@/components/gym/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import { GymRoutine } from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

/** Lista de rutinas del usuario: crear, abrir y activar. */
export default function GymRoutinesScreen() {
    const routines = useGymStore((s) => s.routines);
    const loading = useGymStore((s) => s.routinesLoading);
    const pagination = useGymStore((s) => s.routinesPagination);
    const loadRoutines = useGymStore((s) => s.loadRoutines);
    const loadActiveRoutine = useGymStore((s) => s.loadActiveRoutine);
    const createRoutine = useGymStore((s) => s.createRoutine);
    const deleteRoutine = useGymStore((s) => s.deleteRoutine);
    const activateRoutine = useGymStore((s) => s.activateRoutine);
    const deactivateRoutine = useGymStore((s) => s.deactivateRoutine);

    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void loadRoutines({ refresh: true });
        void loadActiveRoutine();
    }, [loadRoutines, loadActiveRoutine]);

    const submitCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'Escribe el nombre de la rutina.');
            return;
        }

        setSaving(true);
        const error = await createRoutine({
            name: trimmed,
            description: description.trim() || null,
        });
        setSaving(false);

        if (error) {
            notify('error', error);
            return;
        }

        const created = useGymStore.getState().currentRoutine;
        setName('');
        setDescription('');
        setCreating(false);
        notify('success', 'Rutina creada. Configura sus días.');

        if (created) {
            router.push({
                pathname: '/gym/routine',
                params: { routine: created.id },
            } as any);
        }
    };

    const confirmDelete = (routine: GymRoutine) => {
        Alert.alert(
            'Eliminar rutina',
            `"${routine.name}" dejará de estar disponible. El historial de entrenamientos se conserva.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const error = await deleteRoutine(routine.id);
                        if (error) notify('error', error);
                        else notify('success', 'Rutina eliminada.');
                    },
                },
            ]
        );
    };

    const toggleActive = async (routine: GymRoutine) => {
        const error = routine.is_active
            ? await deactivateRoutine(routine.id)
            : await activateRoutine(routine.id);

        if (error) notify('error', error);
        else notify('success', routine.is_active ? 'Rutina desactivada.' : 'Rutina activada.');
    };

    const renderRoutine = useCallback(
        ({ item }: { item: GymRoutine }) => {
            const days = item.days ?? [];
            const trainingDays = days.filter((day) => !day.is_rest && day.exercises.length > 0).length;

            return (
                <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() =>
                        router.push({
                            pathname: '/gym/routine',
                            params: { routine: item.id },
                        } as any)
                    }
                    onLongPress={() => confirmDelete(item)}
                >
                    <View style={styles.rowTexts}>
                        <View style={styles.rowTitleLine}>
                            <TextMalet style={styles.rowTitle} numberOfLines={1}>
                                {item.name}
                            </TextMalet>
                            {item.is_active ? (
                                <TextMalet style={styles.activeBadge}>Activa</TextMalet>
                            ) : null}
                        </View>
                        <TextMalet style={styles.rowSub} numberOfLines={1}>
                            {trainingDays}{' '}
                            {trainingDays === 1 ? 'día de entreno' : 'días de entreno'}
                            {item.description ? ` · ${item.description}` : ''}
                        </TextMalet>
                    </View>

                    <TouchableOpacity
                        style={[styles.toggle, item.is_active && styles.toggleActive]}
                        onPress={() => toggleActive(item)}
                        activeOpacity={0.7}
                    >
                        <TextMalet
                            style={[styles.toggleText, item.is_active && styles.toggleTextActive]}
                        >
                            {item.is_active ? 'Desactivar' : 'Activar'}
                        </TextMalet>
                    </TouchableOpacity>
                </TouchableOpacity>
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const keyExtractor = useCallback((item: GymRoutine) => item.id, []);

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader
                    title="Rutinas"
                    subtitle="Tu plan semanal de entrenamiento"
                    right={
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setCreating(true)}
                            activeOpacity={0.7}
                        >
                            <Plus size={18} color="#111" />
                        </TouchableOpacity>
                    }
                />

                <FlashList
                    data={routines}
                    keyExtractor={keyExtractor}
                    renderItem={renderRoutine}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadRoutines({ refresh: false })}
                    onRefresh={() => loadRoutines({ refresh: true })}
                    refreshing={loading && routines.length === 0}
                    ListFooterComponent={
                        loading && routines.length > 0 && !pagination.isEnd ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#999" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        loading ? (
                            <SkeletonShimmer style={styles.skeleton}>
                                <SkeletonBlock h={64} r={14} />
                                <SkeletonBlock h={64} r={14} />
                            </SkeletonShimmer>
                        ) : (
                            <View style={styles.empty}>
                                <TextMalet style={styles.emptyTitle}>Sin rutinas todavía</TextMalet>
                                <TextMalet style={styles.emptyText}>
                                    Crea una rutina, arma sus días y actívala para entrenar.
                                </TextMalet>
                            </View>
                        )
                    }
                />

                <ModalOptions visible={creating} onClose={() => setCreating(false)} heightRatio={0.55}>
                    <TextMalet style={styles.modalTitle}>Nueva rutina</TextMalet>
                    <View style={styles.modalBody}>
                        <InputField
                            label="Nombre"
                            placeholder="Ej: Torso / Pierna"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="sentences"
                        />
                        <InputField
                            label="Descripción (opcional)"
                            placeholder="Ej: 4 días, fuerza"
                            value={description}
                            onChangeText={setDescription}
                            autoCapitalize="sentences"
                        />
                        <Button text="Crear rutina" onPress={submitCreate} loading={saving} />
                    </View>
                </ModalOptions>
            </View>
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 4,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    rowTexts: {
        flex: 1,
        gap: 2,
    },
    rowTitleLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rowTitle: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#111',
        flexShrink: 1,
        letterSpacing: -0.2,
    },
    activeBadge: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#fff',
        backgroundColor: '#111',
        borderRadius: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
        overflow: 'hidden',
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    toggle: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.12)',
        backgroundColor: '#fafafa',
    },
    toggleActive: {
        borderColor: '#111',
    },
    toggleText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#555',
    },
    toggleTextActive: {
        color: '#111',
    },
    footerLoader: {
        paddingVertical: 14,
    },
    skeleton: {
        gap: 8,
    },
    empty: {
        alignItems: 'center',
        marginTop: 40,
        gap: 6,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    emptyText: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        lineHeight: 19,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    modalBody: {
        gap: 14,
    },
});
