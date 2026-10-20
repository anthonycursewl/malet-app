import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button/Button';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import {
    BODY_MEASUREMENT_KEYS,
    BODY_MEASUREMENT_LABELS,
    BodyMeasurementKey,
    GymBodyMetric,
    GymBodyMetricInput,
    toWorkoutDate,
} from '@/shared/entities/Gym';
import { notify, parseNumberInput } from './format';

interface BodyMetricModalProps {
    visible: boolean;
    /** `null` => nueva medida; con valor => editar esa entrada. */
    metric: GymBodyMetric | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (body: GymBodyMetricInput) => Promise<string | null>;
}

/** Alta/edición de una medida corporal (una entrada por día). */
export default function BodyMetricModal({
    visible,
    metric,
    saving,
    onClose,
    onSubmit,
}: BodyMetricModalProps) {
    const [date, setDate] = useState<Date>(
        metric ? new Date(metric.date) : new Date()
    );
    const [showPicker, setShowPicker] = useState(false);
    const [weight, setWeight] = useState(
        metric?.weight_kg != null ? String(metric.weight_kg) : ''
    );
    const [fat, setFat] = useState(
        metric?.body_fat_pct != null ? String(metric.body_fat_pct) : ''
    );
    const [muscle, setMuscle] = useState(
        metric?.muscle_mass_kg != null ? String(metric.muscle_mass_kg) : ''
    );
    const [height, setHeight] = useState(
        metric?.height_cm != null ? String(metric.height_cm) : ''
    );
    const [notes, setNotes] = useState(metric?.notes ?? '');
    const [measurements, setMeasurements] = useState<Record<string, string>>(
        BODY_MEASUREMENT_KEYS.reduce<Record<string, string>>((acc, key) => {
            const value = metric?.measurements?.[key];
            acc[key] = value != null ? String(value) : '';
            return acc;
        }, {})
    );

    const save = async () => {
        const body: GymBodyMetricInput = {
            date: toWorkoutDate(date),
            ...(parseNumberInput(weight) != null
                ? { weight_kg: parseNumberInput(weight)! }
                : {}),
            ...(parseNumberInput(fat) != null
                ? { body_fat_pct: parseNumberInput(fat)! }
                : {}),
            ...(parseNumberInput(muscle) != null
                ? { muscle_mass_kg: parseNumberInput(muscle)! }
                : {}),
            ...(parseNumberInput(height) != null
                ? { height_cm: parseNumberInput(height)! }
                : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        };

        const tape = Object.entries(measurements).reduce<Record<string, number>>(
            (acc, [key, value]) => {
                const parsed = parseNumberInput(value);
                if (parsed != null) acc[key] = parsed;
                return acc;
            },
            {}
        );
        if (Object.keys(tape).length > 0) {
            body.measurements = tape;
        }

        if (
            body.weight_kg == null &&
            body.body_fat_pct == null &&
            body.muscle_mass_kg == null &&
            body.height_cm == null &&
            !body.measurements
        ) {
            notify('error', 'Añade al menos una medida.');
            return;
        }

        const error = await onSubmit(body);
        if (error) {
            notify('error', error);
            return;
        }
        onClose();
    };

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.92}>
            <TextMalet style={styles.title}>
                {metric ? 'Editar medida' : 'Nueva medida'}
            </TextMalet>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                {!metric ? (
                    <View style={styles.dateGroup}>
                        <TextMalet style={styles.label}>Fecha</TextMalet>
                        <TouchableOpacity
                            style={styles.dateBtn}
                            onPress={() => setShowPicker(true)}
                            activeOpacity={0.7}
                        >
                            <Calendar size={15} color="#111" />
                            <TextMalet style={styles.dateText}>
                                {date.toLocaleDateString('es-VE', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </TextMalet>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {showPicker ? (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        maximumDate={new Date()}
                        onValueChange={(_, selected) => {
                            setShowPicker(false);
                            if (selected) setDate(selected);
                        }}
                        onDismiss={() => setShowPicker(false)}
                    />
                ) : null}

                <View style={styles.twoCols}>
                    <View style={styles.col}>
                        <InputField
                            label="Peso (kg)"
                            placeholder="Ej: 72.5"
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="decimal-pad"
                        />
                    </View>
                    <View style={styles.col}>
                        <InputField
                            label="Grasa (%)"
                            placeholder="Ej: 18"
                            value={fat}
                            onChangeText={setFat}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>

                <View style={styles.twoCols}>
                    <View style={styles.col}>
                        <InputField
                            label="Masa muscular (kg)"
                            placeholder="Ej: 34"
                            value={muscle}
                            onChangeText={setMuscle}
                            keyboardType="decimal-pad"
                        />
                    </View>
                    <View style={styles.col}>
                        <InputField
                            label="Altura (cm)"
                            placeholder="Ej: 175"
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="decimal-pad"
                        />
                    </View>
                </View>

                <TextMalet style={styles.sectionTitle}>Medidas (cm)</TextMalet>

                <View style={styles.measureGrid}>
                    {BODY_MEASUREMENT_KEYS.map((key: BodyMeasurementKey) => (
                        <View key={key} style={styles.measureItem}>
                            <TextMalet style={styles.measureLabel}>
                                {BODY_MEASUREMENT_LABELS[key]}
                            </TextMalet>
                            <TextInput
                                style={styles.measureInput}
                                value={measurements[key]}
                                onChangeText={(value) =>
                                    setMeasurements((prev) => ({ ...prev, [key]: value }))
                                }
                                keyboardType="decimal-pad"
                                placeholder="—"
                                placeholderTextColor="rgba(0,0,0,0.25)"
                            />
                        </View>
                    ))}
                </View>

                <InputField
                    label="Notas (opcional)"
                    placeholder="Ej: en ayunas"
                    value={notes}
                    onChangeText={setNotes}
                    autoCapitalize="sentences"
                />

                <Button
                    text={metric ? 'Guardar cambios' : 'Guardar medida'}
                    onPress={save}
                    loading={saving}
                />
            </ScrollView>
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
        gap: 12,
        paddingBottom: 20,
    },
    dateGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.55)',
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dateText: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#111',
        textTransform: 'capitalize',
    },
    twoCols: {
        flexDirection: 'row',
        gap: 10,
    },
    col: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.55)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 4,
    },
    measureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    measureItem: {
        flexBasis: '47%',
        flexGrow: 1,
        gap: 3,
    },
    measureLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(0,0,0,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    measureInput: {
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
});
