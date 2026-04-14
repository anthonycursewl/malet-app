import Button from "@/components/Button/Button";
import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Calendar, Clock, Trash2 } from "lucide-react-native";
import React from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    filterTypes: string[];
    hasActiveFilters: boolean;
    startDate: Date | null;
    endDate: Date | null;
    datePickerType: 'start' | 'end' | null;
    setDatePickerType: (type: 'start' | 'end' | null) => void;
    toggleFilterType: (type: string) => void;
    clearFilters: () => void;
    onDateChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
    setStartDate: (date: Date | null) => void;
    setEndDate: (date: Date | null) => void;
    applyFilters: () => void;
    filterDeleted: boolean;
    setFilterDeleted: (filterDeleted: boolean) => void;
}

export const FilterModal = ({
    visible,
    onClose,
    filterTypes,
    hasActiveFilters,
    startDate,
    endDate,
    datePickerType,
    setDatePickerType,
    toggleFilterType,
    filterDeleted,
    setFilterDeleted,
    clearFilters,
    onDateChange,
    setStartDate,
    setEndDate,
    applyFilters
}: FilterModalProps) => {

    const formatDateForDisplay = (date: Date | null) => {
        if (!date) return null;
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <ModalOptions
            visible={visible}
            onClose={onClose}
        >
            <View style={styles.filterModalContainer}>
                <View style={styles.filterModalHeader}>
                    <TextMalet style={styles.filterModalTitle}>Filtros Avanzados</TextMalet>
                    {hasActiveFilters && (
                        <TouchableOpacity onPress={clearFilters}>
                            <TextMalet style={styles.clearFiltersText}>Limpiar</TextMalet>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.filterModalScroll}>
                    <View style={styles.filterSection}>
                        <TextMalet style={styles.filterSectionTitle}>Tipos de Transacción</TextMalet>

                        <View style={styles.filterOptionsGrid}>
                            <TouchableOpacity
                                style={[styles.filterOption, filterTypes.includes('expense') && styles.filterOptionActive]}
                                onPress={() => toggleFilterType('expense')}
                            >
                                <ArrowDownRight size={16} color={filterTypes.includes('expense') ? '#fff' : '#64748b'} />
                                <TextMalet style={[styles.filterOptionText, filterTypes.includes('expense') && { color: '#fff' }]}>Egresos</TextMalet>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterOption, filterTypes.includes('saving') && styles.filterOptionActive]}
                                onPress={() => toggleFilterType('saving')}
                            >
                                <ArrowUpRight size={16} color={filterTypes.includes('saving') ? '#fff' : '#64748b'} />
                                <TextMalet style={[styles.filterOptionText, filterTypes.includes('saving') && { color: '#fff' }]}>Ingresos</TextMalet>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterOption, filterTypes.includes('pending_payment') && styles.filterOptionActiveWarning]}
                                onPress={() => toggleFilterType('pending_payment')}
                            >
                                <Clock size={16} color={filterTypes.includes('pending_payment') ? '#fff' : '#64748b'} />
                                <TextMalet style={[styles.filterOptionText, filterTypes.includes('pending_payment') && { color: '#fff' }]}>Pendientes</TextMalet>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterOption, filterDeleted && styles.filterOptionActiveWarning]}
                                onPress={() => setFilterDeleted(!filterDeleted)}
                            >
                                <Trash2 size={16} color={filterDeleted ? '#fff' : '#64748b'} />
                                <TextMalet style={[styles.filterOptionText, filterDeleted && { color: '#fff' }]}>Eliminados</TextMalet>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.filterSection}>
                        <TextMalet style={styles.filterSectionTitle}>Rango de Fechas</TextMalet>

                        <View style={styles.dateSelectorsRow}>
                            <TouchableOpacity
                                style={[styles.datePickerButton, startDate && styles.datePickerButtonActive]}
                                onPress={() => setDatePickerType('start')}
                            >
                                <Calendar size={16} color={startDate ? '#10b981' : '#64748b'} />
                                <View>
                                    <TextMalet style={styles.datePickerLabel}>Desde</TextMalet>
                                    <TextMalet style={[styles.datePickerValue, startDate && { color: '#1a1a1a', fontWeight: 'bold' }]}>
                                        {formatDateForDisplay(startDate) || 'Inicio'}
                                    </TextMalet>
                                </View>
                            </TouchableOpacity>

                            <ArrowRight size={16} color="#cbd5e1" />

                            <TouchableOpacity
                                style={[styles.datePickerButton, endDate && styles.datePickerButtonActive]}
                                onPress={() => setDatePickerType('end')}
                            >
                                <Calendar size={16} color={endDate ? '#10b981' : '#64748b'} />
                                <View>
                                    <TextMalet style={styles.datePickerLabel}>Hasta</TextMalet>
                                    <TextMalet style={[styles.datePickerValue, endDate && { color: '#1a1a1a', fontWeight: 'bold' }]}>
                                        {formatDateForDisplay(endDate) || 'Fin'}
                                    </TextMalet>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {(startDate || endDate) && (
                            <TouchableOpacity
                                style={styles.clearDatesButton}
                                onPress={() => {
                                    setStartDate(null);
                                    setEndDate(null);
                                }}
                            >
                                <TextMalet style={styles.clearDatesText}>Resetear fechas</TextMalet>
                            </TouchableOpacity>
                        )}
                    </View>

                    {Platform.OS === 'ios' && datePickerType && (
                        <View style={styles.iosDatePickerContainer}>
                            <View style={styles.iosDatePickerHeader}>
                                <TextMalet style={styles.iosDatePickerTitle}>
                                    Selecciona la fecha {datePickerType === 'start' ? 'inicial' : 'final'}
                                </TextMalet>
                                <TouchableOpacity onPress={() => setDatePickerType(null)}>
                                    <TextMalet style={styles.iosDatePickerDone}>Listo</TextMalet>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={(datePickerType === 'start' ? startDate! : endDate!) || new Date()}
                                mode="date"
                                display="inline"
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        </View>
                    )}
                </ScrollView>

                <View style={styles.filterModalFooter}>
                    <Button
                        text={`Aplicar Filtros`}
                        onPress={applyFilters}
                        style={{ width: '100%' }}
                    />
                </View>

                {Platform.OS === 'android' && datePickerType && (
                    <DateTimePicker
                        value={(datePickerType === 'start' ? startDate! : endDate!) || new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        maximumDate={new Date()}
                    />
                )}
            </View>
        </ModalOptions>
    );
};
