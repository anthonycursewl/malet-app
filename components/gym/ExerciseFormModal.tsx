import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import {
    GYM_EQUIPMENT,
    GYM_EQUIPMENT_LABELS,
    GYM_EXERCISE_TYPES,
    GYM_EXERCISE_TYPE_LABELS,
    GYM_MUSCLE_GROUPS,
    GYM_MUSCLE_GROUP_LABELS,
    GymEquipment,
    GymExercise,
    GymExerciseInput,
    GymExerciseType,
    GymMuscleGroup,
} from '@/shared/entities/Gym';
import { notify } from './format';

interface ExerciseFormModalProps {
    visible: boolean;
    /** `null` => crear; con valor => editar ese ejercicio propio. */
    exercise: GymExercise | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (body: GymExerciseInput) => Promise<string | null>;
}

function ChipGroup<T extends string>({
    options,
    labels,
    value,
    onChange,
}: {
    options: readonly T[];
    labels: Record<T, string>;
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <View style={styles.chips}>
            {options.map((option) => {
                const active = option === value;
                return (
                    <TouchableOpacity
                        key={option}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => onChange(option)}
                        activeOpacity={0.7}
                    >
                        <TextMalet style={[styles.chipText, active && styles.chipTextActive]}>
                            {labels[option]}
                        </TextMalet>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

/** Alta y edición de un ejercicio propio (los del catálogo base no se editan). */
export default function ExerciseFormModal({
    visible,
    exercise,
    saving,
    onClose,
    onSubmit,
}: ExerciseFormModalProps) {
    const [name, setName] = useState(exercise?.name ?? '');
    const [muscle, setMuscle] = useState<GymMuscleGroup>(
        exercise?.muscle_group ?? 'chest'
    );
    const [equipment, setEquipment] = useState<GymEquipment>(
        exercise?.equipment ?? 'barbell'
    );
    const [type, setType] = useState<GymExerciseType>(
        exercise?.type ?? 'strength'
    );

    const save = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            notify('error', 'Escribe el nombre del ejercicio.');
            return;
        }

        const error = await onSubmit({
            name: trimmed,
            muscle_group: muscle,
            equipment,
            type,
        });
        if (error) {
            notify('error', error);
            return;
        }

        onClose();
    };

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.82}>
            <TextMalet style={styles.title}>
                {exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            </TextMalet>

            <View style={styles.body}>
                <InputField
                    label="Nombre"
                    placeholder="Ej: Press banca inclinado"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="sentences"
                />

                <TextMalet style={styles.label}>Grupo muscular</TextMalet>
                <ChipGroup
                    options={GYM_MUSCLE_GROUPS}
                    labels={GYM_MUSCLE_GROUP_LABELS}
                    value={muscle}
                    onChange={setMuscle}
                />

                <TextMalet style={styles.label}>Equipamiento</TextMalet>
                <ChipGroup
                    options={GYM_EQUIPMENT}
                    labels={GYM_EQUIPMENT_LABELS}
                    value={equipment}
                    onChange={setEquipment}
                />

                <TextMalet style={styles.label}>Tipo</TextMalet>
                <ChipGroup
                    options={GYM_EXERCISE_TYPES}
                    labels={GYM_EXERCISE_TYPE_LABELS}
                    value={type}
                    onChange={setType}
                />

                <Button
                    text={exercise ? 'Guardar cambios' : 'Crear ejercicio'}
                    onPress={save}
                    loading={saving}
                    style={styles.submit}
                />
            </View>
        </ModalOptions>
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
        gap: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
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
    submit: {
        marginTop: 6,
    },
});
