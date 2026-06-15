import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    navbar: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 5,
    },
    centerBalance: {
        flex: 1,
        alignItems: 'center',
    },
    filterButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#000',
        zIndex: 1,
    },
});
