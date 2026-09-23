import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        marginBottom: 9,
    },
    scrollContent: {
        paddingHorizontal: 18,
        gap: 4,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e9e9e9ff',
    },
    tagItemActive: {
        borderColor: '#e6e6e6ff',
        backgroundColor: '#f0f0f0ff',
    },
    tagColor: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    tagName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    tagNameActive: {
        color: '#222222ff',
    },
    loadingContainer: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        gap: 8,
    },
    skeletonTag: {
        width: 80,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    loadingMore: {
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});