import { Plus, Search, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import {
    DAY_LABELS,
    GYM_MUSCLE_GROUP_LABELS,
    GymExercise,
    GymRoutineDayInput,
    GymWeekDay,
} from '@/shared/entities/Gym';
import { gymService } from '@/shared/services/gym/gym.service';
import { notify, parseNumberInput } from './format';

/** Ejercicio planificado en edición (todo como texto hasta guardar). */
interface DraftItem {
    exercise_id: string;
    sets: string;
    reps_min: string;
    reps_max: string;
    target_weight: string;
    rest_seconds: string;
}

/** Nombre y grupo de cada ejercicio del catálogo (los días solo guardan el id). */
type CatalogMap = Record<string, { name: string; muscle_group: string }>;

interface RoutineDayModalProps {
    visible: boolean;
    /** Día a editar (con `id: null` si nunca se configuró). */
    day: GymWeekDay;
    saving: boolean;
    onClose: () => void;
    onSubmit: (dayOfWeek: number, body: GymRoutineDayInput) => Promise<string | null>;
}

/** Editor de un día de la rutina: título, descanso, notas y ejercicios planificados. */
export default function RoutineDayModal({
    visible,
    day,
    saving,
    onClose,
    onSubmit,
}: RoutineDayModalProps) {
    const [title, setTitle] = useState(day.title ?? '');
    const [isRest, setIsRest] = useState(day.is_rest);
    const [notes, setNotes] = useState(day.notes ?? '');
    const [items, setItems] = useState<DraftItem[]>(
        day.exercises.map((exercise) => ({
            exercise_id: exercise.exercise_id,
            sets: String(exercise.sets),
            reps_min: exercise.reps_min != null ? String(exercise.reps_min) : '',
            reps_max: exercise.reps_max != null ? String(exercise.reps_max) : '',
            target_weight:
                exercise.target_weight != null ? String(exercise.target_weight) : '',
            rest_seconds:
                exercise.rest_seconds != null ? String(exercise.rest_seconds) : '',
        }))
    );
    const [catalog, setCatalog] = useState<CatalogMap>({});

    // El día solo guarda el id: se resuelven los nombres desde el catálogo.
    useEffect(() => {
        let active = true;

        const load = async () => {
            const { response } = await gymService.listExercises({ take: 100 });
            if (!active) return;

            setCatalog(
                (response?.data ?? []).reduce<CatalogMap>((map, exercise) => {
                    map[exercise.id] = {
                        name: exercise.name,
                        muscle_group: exercise.muscle_group,
                    };
                    return map;
                }, {})
            );
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    // Buscador del catálogo (solo cuando se abre).
    const [pickerOpen, setPickerOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GymExercise[]>([]);
    const [searching, setSearching] = useState(false);

    const searchCatalog = async (value: string) => {
        setSearching(true);
        const { error, response } = await gymService.listExercises({
            take: 20,
            search: value.trim() || undefined,
        });
        setSearching(false);

        if (error) {
            notify('error', error);
            return;
        }
        setResults(response?.data ?? []);
    };

    const updateItem = (index: number, patch: Partial<DraftItem>) =>
        setItems((prev) =>
            prev.map((item, position) => (position === index ? { ...item, ...patch } : item))
        );

    const addExercise = (exercise: GymExercise) => {
        setItems((prev) => [
            ...prev,
            {
                exercise_id: exercise.id,
                sets: '3',
                reps_min: '',
                reps_max: '',
                target_weight: '',
                rest_seconds: '',
            },
        ]);
        setCatalog((prev) => ({
            ...prev,
            [exercise.id]: {
                name: exercise.name,
                muscle_group: exercise.muscle_group,
            },
        }));
        setPickerOpen(false);
        setQuery('');
        setResults([]);
    };

    const save = async () => {
        const body: GymRoutineDayInput = {
            title: title.trim() || undefined,
            is_rest: isRest,
            notes: notes.trim() || undefined,
            exercises: isRest
                ? []
                : items.map((item, index) => ({
                      exercise_id: item.exercise_id,
                      position: index + 1,
                      sets: parseNumberInput(item.sets) ?? 3,
                      reps_min: parseNumberInput(item.reps_min) ?? undefined,
                      reps_max: parseNumberInput(item.reps_max) ?? undefined,
                      target_weight: parseNumberInput(item.target_weight) ?? undefined,
                      rest_seconds: parseNumberInput(item.rest_seconds) ?? undefined,
                  })),
        };

        const error = await onSubmit(day.day_of_week, body);
        if (error) {
            notify('error', error);
            return;
        }
        onClose();
    };

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.92}>
            <TextMalet style={styles.title}>{DAY_LABELS[day.day_of_week]}</TextMalet>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                <InputField
                    label="Título (opcional)"
                    placeholder="Ej: Pecho y tríceps"
                    value={title}
                    onChangeText={setTitle}
                    autoCapitalize="sentences"
                />

                <View style={styles.restRow}>
                    <View style={styles.restTexts}>
                        <TextMalet style={styles.restLabel}>Día de descanso</TextMalet>
                        <TextMalet style={styles.restHint}>
                            No tendrá ejercicios ni contará como planificado.
                        </TextMalet>
                    </View>
                    <Switch
                        value={isRest}
                        onValueChange={setIsRest}
                        trackColor={{ false: '#d4d4d8', true: '#a1a1aa' }}
                        thumbColor={isRest ? '#000' : '#f4f4f5'}
                        ios_backgroundColor="#d4d4d8"
                    />
                </View>

                {!isRest && (
                    <>
                        <TextMalet style={styles.sectionTitle}>
                            Ejercicios ({items.length})
                        </TextMalet>

                        {items.map((item, index) => (
                            <View key={`${item.exercise_id}-${index}`} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemTexts}>
                                        <TextMalet style={styles.itemName} numberOfLines={1}>
                                            {catalog[item.exercise_id]?.name ?? 'Ejercicio'}
                                        </TextMalet>
                                        {catalog[item.exercise_id]?.muscle_group ? (
                                            <TextMalet style={styles.itemSub}>
                                                {GYM_MUSCLE_GROUP_LABELS[
                                                    catalog[item.exercise_id]
                                                        .muscle_group as keyof typeof GYM_MUSCLE_GROUP_LABELS
                                                ] ?? catalog[item.exercise_id].muscle_group}
                                            </TextMalet>
                                        ) : null}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setItems((prev) =>
                                                prev.filter((_, position) => position !== index)
                                            )
                                        }
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        activeOpacity={0.7}
                                    >
                                        <Trash2 size={16} color="rgba(0,0,0,0.4)" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.configRow}>
                                    <ConfigInput
                                        label="Series"
                                        value={item.sets}
                                        onChangeText={(value) => updateItem(index, { sets: value })}
                                    />
                                    <ConfigInput
                                        label="Reps min"
                                        value={item.reps_min}
                                        onChangeText={(value) =>
                                            updateItem(index, { reps_min: value })
                                        }
                                    />
                                    <ConfigInput
                                        label="Reps max"
                                        value={item.reps_max}
                                        onChangeText={(value) =>
                                            updateItem(index, { reps_max: value })
                                        }
                                    />
                                </View>
                                <View style={styles.configRow}>
                                    <ConfigInput
                                        label="Peso (kg)"
                                        value={item.target_weight}
                                        decimal
                                        onChangeText={(value) =>
                                            updateItem(index, { target_weight: value })
                                        }
                                    />
                                    <ConfigInput
                                        label="Descanso (s)"
                                        value={item.rest_seconds}
                                        onChangeText={(value) =>
                                            updateItem(index, { rest_seconds: value })
                                        }
                                    />
                                </View>
                            </View>
                        ))}

                        {pickerOpen ? (
                            <View style={styles.picker}>
                                <View style={styles.searchBox}>
                                    <Search size={15} color="rgba(0,0,0,0.35)" />
                                    <TextInput
                                        style={styles.searchInput}
                                        value={query}
                                        onChangeText={setQuery}
                                        onSubmitEditing={() => void searchCatalog(query)}
                                        placeholder="Buscar en el catálogo"
                                        placeholderTextColor="rgba(0,0,0,0.3)"
                                        returnKeyType="search"
                                        autoFocus
                                    />
                                </View>

                                {searching ? (
                                    <TextMalet style={styles.pickerHint}>Buscando…</TextMalet>
                                ) : results.length === 0 ? (
                                    <TextMalet style={styles.pickerHint}>
                                        Busca un ejercicio para añadirlo.
                                    </TextMalet>
                                ) : (
                                    results.slice(0, 8).map((exercise) => (
                                        <TouchableOpacity
                                            key={exercise.id}
                                            style={styles.pickerRow}
                                            onPress={() => addExercise(exercise)}
                                            activeOpacity={0.7}
                                        >
                                            <TextMalet
                                                style={styles.pickerRowName}
                                                numberOfLines={1}
                                            >
                                                {exercise.name}
                                            </TextMalet>
                                            <TextMalet style={styles.pickerRowSub}>
                                                {GYM_MUSCLE_GROUP_LABELS[exercise.muscle_group]}
                                            </TextMalet>
                                        </TouchableOpacity>
                                    ))
                                )}

                                <Button
                                    text="Cerrar buscador"
                                    onPress={() => setPickerOpen(false)}
                                    style={styles.pickerClose}
                                />
                            </View>
                        ) : (
                            <Button
                                text="Añadir ejercicio"
                                icon={<Plus size={14} color="#fff" />}
                                onPress={() => {
                                    setPickerOpen(true);
                                    void searchCatalog('');
                                }}
                                style={styles.addBtn}
                            />
                        )}
                    </>
                )}

                <InputField
                    label="Notas (opcional)"
                    placeholder="Ej: cuidar la técnica"
                    value={notes}
                    onChangeText={setNotes}
                    autoCapitalize="sentences"
                />

                <Button text="Guardar día" onPress={save} loading={saving} />
            </ScrollView>
        </ModalOptions>
    );
}

/** Input compacto de la configuración del ejercicio. */
function ConfigInput({
    label,
    value,
    onChangeText,
    decimal,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    decimal?: boolean;
}) {
    return (
        <View style={styles.configItem}>
            <TextMalet style={styles.configLabel}>{label}</TextMalet>
            <TextInput
                style={styles.configInput}
                value={value}
                onChangeText={onChangeText}
                keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
                placeholder="—"
                placeholderTextColor="rgba(0,0,0,0.25)"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
        marginBottom: 10,
    },
    body: {
        gap: 12,
        paddingBottom: 20,
    },
    restRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    restTexts: {
        flex: 1,
    },
    restLabel: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    restHint: {
        fontSize: 11,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 14,
        padding: 10,
        gap: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemTexts: {
        flex: 1,
    },
    itemName: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111',
    },
    itemSub: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 1,
    },
    configRow: {
        flexDirection: 'row',
        gap: 8,
    },
    configItem: {
        flex: 1,
        gap: 3,
    },
    configLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    configInput: {
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 10,
        paddingVertical: 7,
        paddingHorizontal: 8,
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
        textAlign: 'center',
    },
    picker: {
        gap: 8,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 14,
        padding: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 7,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#111',
        padding: 0,
    },
    pickerHint: {
        fontSize: 11.5,
        color: 'rgba(0,0,0,0.45)',
    },
    pickerRow: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    pickerRowName: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#111',
    },
    pickerRowSub: {
        fontSize: 10.5,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 1,
    },
    pickerClose: {
        alignSelf: 'flex-start',
    },
    addBtn: {
        alignSelf: 'flex-start',
    },
});
