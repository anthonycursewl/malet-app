import { Platform, StyleSheet } from 'react-native';

const activeBg = '#f5f5f5';
const borderLight = '#e8e8ec';
const textPrimary = 'rgba(0,0,0,0.87)';
const textSecondary = 'rgba(0,0,0,0.6)';
const textTertiary = 'rgba(0,0,0,0.38)';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 6,
        paddingBottom: Platform.OS === 'ios' ? 16 : 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: textPrimary,
        letterSpacing: -0.3,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    clearText: {
        fontSize: 13,
        color: textTertiary,
        fontWeight: '500',
    },
    scroll: {
        flex: 1,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: textSecondary,
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: borderLight,
        borderRadius: 10,
        paddingVertical: 9,
        paddingHorizontal: 14,
        gap: 7,
        backgroundColor: '#fff',
    },
    chipActive: {
        backgroundColor: activeBg,
        borderColor: '#000',
    },
    chipActiveWarning: {
        backgroundColor: '#fffbeb',
        borderColor: '#fbbf24',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '500',
        color: textTertiary,
    },
    chipTextActive: {
        color: textPrimary,
    },
    chipTextWarning: {
        color: '#d97706',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: borderLight,
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 13,
        gap: 9,
        backgroundColor: '#fff',
    },
    dateButtonActive: {
        backgroundColor: activeBg,
        borderColor: '#000',
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: textTertiary,
    },
    dateLabelActive: {
        color: textPrimary,
    },
    dateSeparator: {
        width: 10,
        height: 1,
        backgroundColor: borderLight,
        marginHorizontal: 4,
    },
    resetDateButton: {
        alignSelf: 'flex-start',
        marginTop: 10,
        paddingVertical: 4,
        paddingHorizontal: 2,
    },
    resetDateText: {
        fontSize: 13,
        fontWeight: '500',
        color: textTertiary,
    },
    iosPickerContainer: {
        backgroundColor: activeBg,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: borderLight,
        marginTop: 8,
        marginBottom: 4,
    },
    iosPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iosPickerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: textPrimary,
    },
    iosPickerDone: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    footer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: borderLight,
        marginTop: 8,
    },
});
