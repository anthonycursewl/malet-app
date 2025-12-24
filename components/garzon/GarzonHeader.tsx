import ModalOptions from '@/components/shared/ModalOptions';
import TextMalet from '@/components/TextMalet/TextMalet';
import IconArrow from '@/svgs/dashboard/IconArrow';
import IconAt from '@/svgs/dashboard/IconAt';
import IconReload from '@/svgs/dashboard/IconReload';
import { router } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface GarzonHeaderProps {
    onRefresh?: () => void;
    onLogout?: () => void;
    isLoading?: boolean;
    isAuthenticated?: boolean;
    // Auto-refresh props
    autoRefreshEnabled?: boolean;
    autoRefreshInterval?: number; // in seconds (20-300)
    onAutoRefreshChange?: (enabled: boolean, interval: number) => void;
}

const MIN_INTERVAL = 20;
const MAX_INTERVAL = 300;
const DEFAULT_INTERVAL = 30;

// Timer indicator component with circular progress
const AutoRefreshIndicator = memo(({
    enabled,
    timeRemaining,
    onPress
}: {
    enabled: boolean;
    timeRemaining: number;
    onPress: () => void;
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (enabled) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [enabled, pulseAnim]);

    return (
        <TouchableOpacity onPress={onPress} style={styles.autoRefreshButton}>
            <Animated.View
                style={[
                    styles.autoRefreshIndicator,
                    enabled && styles.autoRefreshIndicatorActive,
                    { transform: [{ scale: enabled ? pulseAnim : 1 }] }
                ]}
            >
                <View
                    style={[
                        styles.autoRefreshDot,
                        enabled ? styles.autoRefreshDotActive : styles.autoRefreshDotInactive
                    ]}
                />
            </Animated.View>
            {enabled && (
                <TextMalet style={styles.autoRefreshText}>
                    {timeRemaining}s
                </TextMalet>
            )}
        </TouchableOpacity>
    );
});

const GarzonHeader = memo(({
    onRefresh,
    onLogout,
    isLoading = false,
    isAuthenticated = false,
    autoRefreshEnabled = false,
    autoRefreshInterval = DEFAULT_INTERVAL,
    onAutoRefreshChange,
}: GarzonHeaderProps) => {
    const [showModal, setShowModal] = useState(false);
    const [localEnabled, setLocalEnabled] = useState(autoRefreshEnabled);
    const [localInterval, setLocalInterval] = useState(autoRefreshInterval.toString());
    const [inputError, setInputError] = useState<string | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(autoRefreshInterval);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync local state with props
    useEffect(() => {
        setLocalEnabled(autoRefreshEnabled);
        setLocalInterval(autoRefreshInterval.toString());
    }, [autoRefreshEnabled, autoRefreshInterval]);

    // Auto-refresh timer logic
    useEffect(() => {
        // Clear existing timers
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        if (autoRefreshEnabled && onRefresh && !isLoading) {
            // Reset countdown
            setTimeRemaining(autoRefreshInterval);

            // Countdown timer (updates every second)
            countdownRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        return autoRefreshInterval;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Main refresh timer
            timerRef.current = setInterval(() => {
                onRefresh();
            }, autoRefreshInterval * 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [autoRefreshEnabled, autoRefreshInterval, onRefresh, isLoading]);

    // Reset countdown when loading starts
    useEffect(() => {
        if (isLoading) {
            setTimeRemaining(autoRefreshInterval);
        }
    }, [isLoading, autoRefreshInterval]);

    const handleOpenModal = useCallback(() => {
        setLocalEnabled(autoRefreshEnabled);
        setLocalInterval(autoRefreshInterval.toString());
        setInputError(null);
        setShowModal(true);
    }, [autoRefreshEnabled, autoRefreshInterval]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setInputError(null);
    }, []);

    const handleToggleEnabled = useCallback(() => {
        setLocalEnabled(prev => !prev);
    }, []);

    const handleIntervalChange = useCallback((text: string) => {
        // Only allow numbers
        const numericText = text.replace(/[^0-9]/g, '');
        setLocalInterval(numericText);

        const value = parseInt(numericText, 10);
        if (numericText && (isNaN(value) || value < MIN_INTERVAL || value > MAX_INTERVAL)) {
            setInputError(`Debe ser entre ${MIN_INTERVAL} y ${MAX_INTERVAL} segundos`);
        } else {
            setInputError(null);
        }
    }, []);

    const handleSave = useCallback(() => {
        const intervalValue = parseInt(localInterval, 10);

        if (localEnabled && (isNaN(intervalValue) || intervalValue < MIN_INTERVAL || intervalValue > MAX_INTERVAL)) {
            setInputError(`Debe ser entre ${MIN_INTERVAL} y ${MAX_INTERVAL} segundos`);
            return;
        }

        const finalInterval = isNaN(intervalValue) ? DEFAULT_INTERVAL : intervalValue;
        onAutoRefreshChange?.(localEnabled, finalInterval);
        setShowModal(false);
    }, [localEnabled, localInterval, onAutoRefreshChange]);

    const handleQuickSelect = useCallback((seconds: number) => {
        setLocalInterval(seconds.toString());
        setInputError(null);
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <IconArrow width={20} height={20} />
                </View>
                <IconAt width={24} height={24} />
            </TouchableOpacity>

            <View style={styles.actionsContainer}>
                {isAuthenticated && (
                    <>
                        {/* Auto-refresh indicator */}
                        <AutoRefreshIndicator
                            enabled={autoRefreshEnabled}
                            timeRemaining={timeRemaining}
                            onPress={handleOpenModal}
                        />

                        <TouchableOpacity
                            onPress={onRefresh}
                            style={styles.iconButton}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#F59E0B" />
                            ) : (
                                <IconReload width={18} height={18} fill="#6B7280" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
                            <TextMalet style={styles.logoutText}>Salir</TextMalet>
                        </TouchableOpacity>
                    </>
                )}
                {!isAuthenticated && <View style={styles.placeholder} />}
            </View>

            {/* Auto-refresh settings modal using ModalOptions */}
            <ModalOptions
                visible={showModal}
                onClose={handleCloseModal}
                gesturesEnabled={true}
            >
                <View style={styles.modalContainer}>
                    <TextMalet style={styles.modalTitle}>Auto-actualización</TextMalet>
                    <TextMalet style={styles.modalSubtitle}>
                        Configura la actualización automática del dashboard.
                    </TextMalet>

                    {/* Toggle */}
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={handleToggleEnabled}
                        activeOpacity={0.7}
                    >
                        <View style={styles.toggleInfo}>
                            <TextMalet style={styles.toggleLabel}>
                                Actualizar automáticamente
                            </TextMalet>
                            <TextMalet style={styles.toggleDescription}>
                                {localEnabled
                                    ? `Cada ${localInterval} segundos`
                                    : 'Desactivado'}
                            </TextMalet>
                        </View>
                        <View style={[
                            styles.toggleSwitch,
                            localEnabled && styles.toggleSwitchActive
                        ]}>
                            <View style={[
                                styles.toggleKnob,
                                localEnabled && styles.toggleKnobActive
                            ]} />
                        </View>
                    </TouchableOpacity>

                    {/* Interval input - Only show when enabled */}
                    {localEnabled && (
                        <View style={styles.intervalSection}>
                            <TextMalet style={styles.intervalLabel}>
                                Intervalo de actualización
                            </TextMalet>

                            <View style={styles.intervalInputContainer}>
                                <TextInput
                                    style={[
                                        styles.intervalInput,
                                        inputError && styles.intervalInputError
                                    ]}
                                    value={localInterval}
                                    onChangeText={handleIntervalChange}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                    placeholder="30"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TextMalet style={styles.intervalUnit}>segundos</TextMalet>
                            </View>

                            {inputError && (
                                <TextMalet style={styles.errorText}>{inputError}</TextMalet>
                            )}

                            {/* Quick select buttons */}
                            <View style={styles.quickSelectContainer}>
                                <TextMalet style={styles.quickSelectLabel}>Selección rápida</TextMalet>
                                <View style={styles.quickSelectRow}>
                                    {[
                                        { value: 30, label: '30s' },
                                        { value: 60, label: '1 min' },
                                        { value: 120, label: '2 min' },
                                        { value: 300, label: '5 min' },
                                    ].map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.quickSelectButton,
                                                localInterval === option.value.toString() && styles.quickSelectButtonActive
                                            ]}
                                            onPress={() => handleQuickSelect(option.value)}
                                        >
                                            <TextMalet style={[
                                                styles.quickSelectText,
                                                localInterval === option.value.toString() && styles.quickSelectTextActive
                                            ]}>
                                                {option.label}
                                            </TextMalet>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCloseModal}
                        >
                            <TextMalet style={styles.cancelButtonText}>Cancelar</TextMalet>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                inputError && styles.saveButtonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={!!inputError}
                        >
                            <TextMalet style={styles.saveButtonText}>Guardar</TextMalet>
                        </TouchableOpacity>
                    </View>
                </View>
            </ModalOptions>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        padding: 6,
    },
    logoutButton: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutText: {
        fontSize: 12,
        color: '#DC2626',
        fontWeight: '600',
    },
    placeholder: {
        width: 28,
    },
    // Auto-refresh indicator styles
    autoRefreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        gap: 4,
    },
    autoRefreshIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    autoRefreshIndicatorActive: {
        backgroundColor: '#DCFCE7',
    },
    autoRefreshDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    autoRefreshDotActive: {
        backgroundColor: '#22C55E',
    },
    autoRefreshDotInactive: {
        backgroundColor: '#9CA3AF',
    },
    autoRefreshText: {
        fontSize: 10,
        color: '#22C55E',
        fontWeight: '600',
    },
    // Modal content styles
    modalContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 24,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    toggleInfo: {
        flex: 1,
        marginRight: 12,
    },
    toggleLabel: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
        marginBottom: 2,
    },
    toggleDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    toggleSwitch: {
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleSwitchActive: {
        backgroundColor: '#22C55E',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleKnobActive: {
        alignSelf: 'flex-end',
    },
    intervalSection: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    intervalLabel: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
        marginBottom: 12,
    },
    intervalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    intervalInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        color: '#1F2937',
        fontWeight: '700',
        textAlign: 'center',
    },
    intervalInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    intervalUnit: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 8,
    },
    quickSelectContainer: {
        marginTop: 16,
    },
    quickSelectLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    quickSelectRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quickSelectButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickSelectButtonActive: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
    },
    quickSelectText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    quickSelectTextActive: {
        color: '#D97706',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 'auto',
        paddingTop: 16,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#FCD34D',
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
});

export default GarzonHeader;
