import { Pin } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { formatNoteDate, noteTitle, NoteSummary } from '@/shared/entities/Note';

/** Tarjeta de nota en el listado (memoizada para FlashList). */
const NoteCard = memo(function NoteCard({
    note,
    onPress,
}: {
    note: NoteSummary;
    onPress: (note: NoteSummary) => void;
}) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(note)}
            activeOpacity={0.8}
        >
            <View style={styles.topRow}>
                <TextMalet style={styles.title} numberOfLines={1}>
                    {noteTitle(note)}
                </TextMalet>
                {note.pinned ? <Pin size={13} color="#b45309" fill="#b45309" /> : null}
            </View>

            <TextMalet style={styles.excerpt} numberOfLines={2}>
                {note.excerpt?.trim() || 'Nota vacía'}
            </TextMalet>

            <TextMalet style={styles.date}>{formatNoteDate(note.updated_at)}</TextMalet>
        </TouchableOpacity>
    );
});

export default NoteCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
        gap: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        flex: 1,
        fontSize: 14.5,
        fontWeight: '700',
        color: '#1f1f1f',
        letterSpacing: -0.2,
    },
    excerpt: {
        fontSize: 12.5,
        lineHeight: 18,
        color: '#6b6b6b',
    },
    date: {
        fontSize: 10.5,
        color: '#a0a0a0',
        marginTop: 2,
    },
});
