import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    shimmerBase: {
        backgroundColor: '#e8e8e8',
        overflow: 'hidden',
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    skeletonContainer: {
        flex: 1,
        marginHorizontal: -14,
    },
    skeletonNavbar: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 10,
    },
    skeletonCircle: {
        borderRadius: 50,
    },
    skeletonTransaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    skeletonTransactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 6,
    },
    loadingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#64748b',
    },
});
