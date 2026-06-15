import Button from "@/components/Button/Button";
import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowDownRight, ArrowUpRight, Calendar, Clock, RotateCcw, Trash2 } from "lucide-react-native";
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

    const pendingHasFilters = filterTypes.length > 0 || startDate !== null || endDate !== null || filterDeleted;

    const isExpenseActive = filterTypes.includes('expense');
    const isSavingActive = filterTypes.includes('saving');
    const isPendingActive = filterTypes.includes('pending_payment');

    return (
        <ModalOptions
            visible={visible}
            onClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <TextMalet style={styles.title}>Filtros</TextMalet>
                    {pendingHasFilters && (
                        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                            <RotateCcw size={14} color="rgba(0,0,0,0.38)" />
                            <TextMalet style={styles.clearText}>Limpiar</TextMalet>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                    <View style={styles.section}>
                        <TextMalet style={styles.sectionTitle}>Tipo</TextMalet>
                        <View style={styles.chipsRow}>
                            <TouchableOpacity
                                style={[styles.chip, isExpenseActive && styles.chipActive]}
                                onPress={() => toggleFilterType('expense')}
                            >
                                <ArrowDownRight size={15} color={isExpenseActive ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.38)'} />
                                <TextMalet style={[styles.chipText, isExpenseActive && styles.chipTextActive]}>Gastos</TextMalet>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.chip, isSavingActive && styles.chipActive]}
                                onPress={() => toggleFilterType('saving')}
                            >
                                <ArrowUpRight size={15} color={isSavingActive ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.38)'} />
                                <TextMalet style={[styles.chipText, isSavingActive && styles.chipTextActive]}>Ingresos</TextMalet>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.chip, isPendingActive && styles.chipActiveWarning]}
                                onPress={() => toggleFilterType('pending_payment')}
                            >
                                <Clock size={15} color={isPendingActive ? '#d97706' : 'rgba(0,0,0,0.38)'} />
                                <TextMalet style={[styles.chipText, isPendingActive && styles.chipTextWarning]}>Pendientes</TextMalet>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.chip, filterDeleted && styles.chipActiveWarning]}
                                onPress={() => setFilterDeleted(!filterDeleted)}
                            >
                                <Trash2 size={15} color={filterDeleted ? '#d97706' : 'rgba(0,0,0,0.38)'} />
                                <TextMalet style={[styles.chipText, filterDeleted && styles.chipTextWarning]}>Eliminados</TextMalet>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <TextMalet style={styles.sectionTitle}>Fecha</TextMalet>
                        <View style={styles.dateRow}>
                            <TouchableOpacity
                                style={[styles.dateButton, startDate && styles.dateButtonActive]}
                                onPress={() => setDatePickerType('start')}
                            >
                                <Calendar size={15} color={startDate ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.38)'} />
                                <TextMalet style={[styles.dateLabel, startDate && styles.dateLabelActive]}>
                                    {formatDateForDisplay(startDate) || 'Desde'}
                                </TextMalet>
                            </TouchableOpacity>

                            <View style={styles.dateSeparator} />

                            <TouchableOpacity
                                style={[styles.dateButton, endDate && styles.dateButtonActive]}
                                onPress={() => setDatePickerType('end')}
                            >
                                <Calendar size={15} color={endDate ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.38)'} />
                                <TextMalet style={[styles.dateLabel, endDate && styles.dateLabelActive]}>
                                    {formatDateForDisplay(endDate) || 'Hasta'}
                                </TextMalet>
                            </TouchableOpacity>
                        </View>

                        {(startDate || endDate) && (
                            <TouchableOpacity
                                style={styles.resetDateButton}
                                onPress={() => { setStartDate(null); setEndDate(null); }}
                            >
                                <TextMalet style={styles.resetDateText}>Limpiar fechas</TextMalet>
                            </TouchableOpacity>
                        )}
                    </View>

                    {Platform.OS === 'ios' && datePickerType && (
                        <View style={styles.iosPickerContainer}>
                            <View style={styles.iosPickerHeader}>
                                <TextMalet style={styles.iosPickerTitle}>
                                    {datePickerType === 'start' ? 'Fecha inicial' : 'Fecha final'}
                                </TextMalet>
                                <TouchableOpacity onPress={() => setDatePickerType(null)}>
                                    <TextMalet style={styles.iosPickerDone}>Listo</TextMalet>
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

                <View style={styles.footer}>
                    <Button
                        text="Aplicar Filtros"
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
