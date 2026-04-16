import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    accountIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    cardBody: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 10,
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#4b5563',
        fontWeight: '500',
    },
    infoTextEmpty: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
});
