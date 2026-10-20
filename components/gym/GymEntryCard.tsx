import { router } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { useGymStore } from '@/shared/stores/useGymStore';

/** Tarjeta del acceso al gimnasio en el dashboard (mismo formato que las demás). */
export default function GymEntryCard() {
    const gymEnabled = useGymStore((s) => s.gymEnabled);
    const loadModules = useGymStore((s) => s.loadModules);

    useEffect(() => {
        void loadModules();
    }, [loadModules]);

    return (
        <TouchableOpacity
            onPress={() => router.push('/gym' as any)}
            style={styles.wrapper}
            activeOpacity={0.85}
        >
            <View style={styles.card}>
                <View style={styles.row}>
                    <Dumbbell size={18} color="#111" />
                    <View>
                        <TextMalet style={styles.title}>Gimnasio</TextMalet>
                        <TextMalet style={styles.subtitle}>
                            {gymEnabled ? 'Rutina y progreso' : 'Toca para activar'}
                        </TextMalet>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: 170,
        height: 86,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    card: {
        width: '100%',
        height: 78,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#d8d8e0',
        padding: 14,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a2e',
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 9,
        color: '#8888a0',
        fontWeight: '400',
        marginTop: 1,
    },
});
