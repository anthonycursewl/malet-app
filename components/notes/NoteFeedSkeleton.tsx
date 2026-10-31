import { StyleSheet, View } from 'react-native';
import {
    SkeletonBlock,
    SkeletonShimmer,
} from '@/components/cuaderno/Skeletons';

/** Skeleton del feed: misma geometría que los posts estilo tweet. */
export default function NoteFeedSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <SkeletonShimmer>
            <View>
                {Array.from({ length: rows }).map((_, index) => (
                    <View key={index} style={styles.post}>
                        <SkeletonBlock w={42} h={42} r={21} />

                        <View style={styles.content}>
                            <View style={styles.headerRow}>
                                <SkeletonBlock w={110} h={12} r={6} />
                                <SkeletonBlock w={64} h={10} r={5} />
                            </View>

                            <SkeletonBlock w="72%" h={12} r={6} />
                            <SkeletonBlock w="100%" h={10} r={5} />
                            <SkeletonBlock w="86%" h={10} r={5} />

                            <View style={styles.actions}>
                                <SkeletonBlock w={28} h={12} r={6} />
                                <SkeletonBlock w={22} h={12} r={6} />
                                <View style={styles.spacer} />
                                <SkeletonBlock w={22} h={12} r={6} />
                                <SkeletonBlock w={30} h={30} r={15} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </SkeletonShimmer>
    );
}

const styles = StyleSheet.create({
    post: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        gap: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 3,
    },
    spacer: {
        flex: 1,
    },
});
