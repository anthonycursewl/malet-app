import { FlashList } from '@shopify/flash-list';
import { Plus, Search } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import LayoutAuthenticated from '@/components/Layout/LayoutAuthenticated';
import TextMalet from '@/components/TextMalet/TextMalet';
import ExerciseFormModal from '@/components/gym/ExerciseFormModal';
import GymHeader from '@/components/gym/GymHeader';
import { notify } from '@/components/gym/format';
import { SkeletonBlock, SkeletonShimmer } from '@/components/cuaderno/Skeletons';
import {
    GYM_EQUIPMENT_LABELS,
    GYM_EXERCISE_TYPE_LABELS,
    GYM_MUSCLE_GROUPS,
    GYM_MUSCLE_GROUP_LABELS,
    GymExercise,
    GymExerciseInput,
    GymExerciseType,
    GymMuscleGroup,
} from '@/shared/entities/Gym';
import { useGymStore } from '@/shared/stores/useGymStore';

const TYPE_OPTIONS: GymExerciseType[] = ['strength', 'cardio', 'mobility'];

/** Catálogo de ejercicios: base compartida + los propios, con búsqueda y filtros. */
export default function GymExercisesScreen() {
    const exercises = useGymStore((s) => s.exercises);
    const loading = useGymStore((s) => s.exercisesLoading);
    const pagination = useGymStore((s) => s.exercisesPagination);
    const filters = useGymStore((s) => s.exerciseFilters);
    const loadExercises = useGymStore((s) => s.loadExercises);
    const setExerciseFilters = useGymStore((s) => s.setExerciseFilters);
    const createExercise = useGymStore((s) => s.createExercise);
    const updateExercise = useGymStore((s) => s.updateExercise);
    const deleteExercise = useGymStore((s) => s.deleteExercise);

    const [search, setSearch] = useState(filters.search);
    const [editing, setEditing] = useState<GymExercise | 'new' | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void loadExercises({ refresh: true });
    }, [loadExercises]);

    const submitSearch = () => {
        void setExerciseFilters({ search: search.trim() });
    };

    const toggleMuscle = (muscle: GymMuscleGroup) => {
        void setExerciseFilters({
            muscle_group: filters.muscle_group === muscle ? null : muscle,
        });
    };

    const toggleType = (type: GymExerciseType) => {
        void setExerciseFilters({ type: filters.type === type ? null : type });
    };

    const confirmDelete = (exercise: GymExercise) => {
        Alert.alert(
            'Eliminar ejercicio',
            `"${exercise.name}" dejará de estar disponible para tus rutinas. Podrás recuperarlo con “Deshacer”.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const error = await deleteExercise(exercise.id);
                        if (error) notify('error', error);
                        else notify('success', 'Ejercicio eliminado.');
                    },
                },
            ]
        );
    };

    const submit = async (body: GymExerciseInput): Promise<string | null> => {
        setSaving(true);
        const error =
            editing === 'new'
                ? await createExercise(body)
                : editing
                  ? await updateExercise(editing.id, body)
                  : 'No hay ejercicio que guardar.';
        setSaving(false);
        return error;
    };

    const renderExercise = useCallback(
        ({ item }: { item: GymExercise }) => {
            const own = item.user_id !== null;

            return (
                <TouchableOpacity
                    style={styles.row}
                    activeOpacity={own ? 0.7 : 1}
                    onPress={() => own && setEditing(item)}
                    onLongPress={() => own && confirmDelete(item)}
                >
                    <View style={styles.rowTexts}>
                        <View style={styles.rowTitleLine}>
                            <TextMalet style={styles.rowTitle} numberOfLines={1}>
                                {item.name}
                            </TextMalet>
                            {own ? (
                                <TextMalet style={styles.ownBadge}>Propio</TextMalet>
                            ) : null}
                        </View>
                        <TextMalet style={styles.rowSub} numberOfLines={1}>
                            {GYM_MUSCLE_GROUP_LABELS[item.muscle_group]}
                            {item.equipment
                                ? ` · ${GYM_EQUIPMENT_LABELS[item.equipment]}`
                                : ''}
                            {' · '}
                            {GYM_EXERCISE_TYPE_LABELS[item.type]}
                        </TextMalet>
                    </View>
                </TouchableOpacity>
            );
        },
        // `confirmDelete` depende del store pero es estable entre renders.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const keyExtractor = useCallback((item: GymExercise) => item.id, []);

    const header = (
        <View style={styles.header}>
            <View style={styles.searchBox}>
                <Search size={15} color="rgba(0,0,0,0.35)" />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar ejercicio"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    returnKeyType="search"
                    onSubmitEditing={submitSearch}
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
            >
                <TouchableOpacity
                    style={[styles.chip, filters.muscle_group == null && styles.chipActive]}
                    onPress={() => void setExerciseFilters({ muscle_group: null })}
                    activeOpacity={0.7}
                >
                    <TextMalet
                        style={[
                            styles.chipText,
                            filters.muscle_group == null && styles.chipTextActive,
                        ]}
                    >
                        Todos
                    </TextMalet>
                </TouchableOpacity>

                {GYM_MUSCLE_GROUPS.map((muscle) => {
                    const active = filters.muscle_group === muscle;
                    return (
                        <TouchableOpacity
                            key={muscle}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => toggleMuscle(muscle)}
                            activeOpacity={0.7}
                        >
                            <TextMalet
                                style={[styles.chipText, active && styles.chipTextActive]}
                            >
                                {GYM_MUSCLE_GROUP_LABELS[muscle]}
                            </TextMalet>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.chips}>
                {TYPE_OPTIONS.map((type) => {
                    const active = filters.type === type;
                    return (
                        <TouchableOpacity
                            key={type}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => toggleType(type)}
                            activeOpacity={0.7}
                        >
                            <TextMalet
                                style={[styles.chipText, active && styles.chipTextActive]}
                            >
                                {GYM_EXERCISE_TYPE_LABELS[type]}
                            </TextMalet>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <LayoutAuthenticated>
            <View style={styles.container}>
                <GymHeader
                    title="Ejercicios"
                    subtitle="Catálogo base y los tuyos"
                    right={
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setEditing('new')}
                            activeOpacity={0.7}
                        >
                            <Plus size={18} color="#111" />
                        </TouchableOpacity>
                    }
                />

                <FlashList
                    data={exercises}
                    keyExtractor={keyExtractor}
                    renderItem={renderExercise}
                    ListHeaderComponent={header}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => loadExercises({ refresh: false })}
                    onRefresh={() => loadExercises({ refresh: true })}
                    refreshing={loading && exercises.length === 0}
                    ListFooterComponent={
                        loading && exercises.length > 0 && !pagination.isEnd ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#999" />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        loading ? (
                            <SkeletonShimmer style={styles.skeleton}>
                                <SkeletonBlock h={54} r={14} />
                                <SkeletonBlock h={54} r={14} />
                                <SkeletonBlock h={54} r={14} />
                            </SkeletonShimmer>
                        ) : (
                            <TextMalet style={styles.empty}>
                                No hay ejercicios con esos filtros.
                            </TextMalet>
                        )
                    }
                />

                {editing !== null ? (
                    <ExerciseFormModal
                        key={editing === 'new' ? 'new' : editing.id}
                        visible
                        exercise={editing === 'new' ? null : editing}
                        saving={saving}
                        onClose={() => setEditing(null)}
                        onSubmit={submit}
                    />
                ) : null}
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
    header: {
        gap: 10,
        paddingBottom: 12,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13.5,
        color: '#111',
        padding: 0,
    },
    chips: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: '#f4f4f5',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    chipActive: {
        backgroundColor: '#111',
        borderColor: '#111',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    chipTextActive: {
        color: '#fff',
    },
    listContent: {
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 14,
        paddingVertical: 10,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        flexShrink: 1,
    },
    ownBadge: {
        fontSize: 9.5,
        fontWeight: '700',
        color: '#111',
        backgroundColor: '#f4f4f5',
        borderRadius: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
        overflow: 'hidden',
    },
    rowSub: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
    },
    footerLoader: {
        paddingVertical: 14,
    },
    skeleton: {
        gap: 8,
        marginTop: 4,
    },
    empty: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.45)',
        textAlign: 'center',
        marginTop: 30,
    },
});
