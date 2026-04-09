import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    emptyStateIconContainer: {
        marginBottom: 24,
    },
    emptyStateIconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyStateIcon: {
        fontSize: 36,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 3,
    },
    emptyStateDescription: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
});
