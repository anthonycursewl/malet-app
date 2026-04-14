import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    filterModalContainer: {
        flex: 1,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    filterModalTitle: {
        fontSize: 20,
        color: '#1a1a1a',
        letterSpacing: -0.5,
    },
    clearFiltersText: {
        fontSize: 14,
        color: '#FF6B6B',
    },
    filterModalScroll: {
        flex: 1,
    },
    filterSection: {
        marginBottom: 28,
    },
    filterSectionTitle: {
        fontSize: 12,
        color: '#838383ff',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: .5,
    },
    filterOptionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
        backgroundColor: '#f8fafc',
    },
    filterOptionActive: {
        backgroundColor: '#1a1a1a',
        borderColor: '#1a1a1a',
    },
    filterOptionActiveWarning: {
        backgroundColor: '#F5C842',
        borderColor: '#F5C842',
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    dateSelectorsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    datePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 10,
    },
    datePickerButtonActive: {
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    datePickerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    datePickerValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    clearDatesButton: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
    },
    clearDatesText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        textDecorationLine: 'underline',
    },
    iosDatePickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginTop: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
        }),
    },
    iosDatePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iosDatePickerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    iosDatePickerDone: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10b981',
    },
    filterModalFooter: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        marginTop: 'auto',
    },
});
