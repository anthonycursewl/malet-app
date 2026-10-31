import { router } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { useNotesPrefetch } from '@/shared/hooks/useNotesPrefetch';

/** Acceso rápido a Notas en el dashboard (mismo formato que las demás). */
export default function NotesEntryCard() {
    useNotesPrefetch();

    return (
        <TouchableOpacity
            onPress={() => router.push('/notes' as any)}
            style={styles.wrapper}
            activeOpacity={0.85}
        >
            <View style={styles.card}>
                <View style={styles.row}>
                    <FileText size={18} color="#111" />
                    <View>
                        <TextMalet style={styles.title}>Notas</TextMalet>
                        <TextMalet style={styles.subtitle}>Markdown y apuntes</TextMalet>
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
