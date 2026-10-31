import { Archive, ArrowUpRight, FileText, Pin } from 'lucide-react-native';
import { memo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import VerificationBadge from '@/components/shared/VerificationBadge';
import {
    formatNoteDate,
    noteTitle,
    NoteSummary,
} from '@/shared/entities/Note';
import { UserPrimitives } from '@/shared/entities/User';

const PLACEHOLDER_AVATAR = require('@/assets/images/placeholders/placeholder_avatar.png');

interface NoteCardProps {
    note: NoteSummary;
    author: UserPrimitives | null;
    onOpen: (note: NoteSummary) => void;
    onTogglePin: (note: NoteSummary) => void;
    onArchive: (note: NoteSummary) => void;
}

/**
 * Post del feed de notas: autor (avatar + verificado), título/extracto y
 * acciones de la app (fijar, palabras, archivar, abrir).
 */
const NoteCard = memo(function NoteCard({
    note,
    author,
    onOpen,
    onTogglePin,
    onArchive,
}: NoteCardProps) {
    const displayName = author?.name?.trim() || 'Tú';
    const handle = author?.username ? `@${author.username}` : '@yo';
    const avatarSource = author?.avatar_url
        ? { uri: author.avatar_url }
        : PLACEHOLDER_AVATAR;

    return (
        <View style={styles.post}>
            <Image source={avatarSource} style={styles.avatar} />

            <View style={styles.content}>
                <View style={styles.authorRow}>
                    <View style={styles.nameGroup}>
                        <TextMalet style={styles.name} numberOfLines={1}>
                            {displayName}
                        </TextMalet>
                        <VerificationBadge user={author} size={16} />
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <TextMalet style={styles.handle} numberOfLines={1}>
                        {handle}
                    </TextMalet>
                    <TextMalet style={styles.date}>
                        · {formatNoteDate(note.updated_at)}
                    </TextMalet>
                </View>

                <TouchableOpacity
                    onPress={() => onOpen(note)}
                    activeOpacity={0.8}
                    style={styles.body}
                >
                    <TextMalet style={styles.title} numberOfLines={2}>
                        {noteTitle(note)}
                    </TextMalet>
                    <TextMalet style={styles.excerpt} numberOfLines={4}>
                        {note.excerpt?.trim() || 'Nota vacía'}
                    </TextMalet>
                </TouchableOpacity>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.action}
                        onPress={() => onTogglePin(note)}
                        activeOpacity={0.7}
                        accessibilityLabel={
                            note.pinned ? 'Desfijar nota' : 'Fijar nota'
                        }
                    >
                        <Pin
                            size={16}
                            color={note.pinned ? '#b45309' : '#536471'}
                            fill={note.pinned ? '#b45309' : 'transparent'}
                        />
                    </TouchableOpacity>

                    <View
                        style={styles.metric}
                        accessible
                        accessibilityLabel={`${note.word_count ?? 0} palabras`}
                    >
                        <FileText size={15} color="#536471" />
                        <TextMalet style={styles.wordCount}>
                            {note.word_count ?? 0}
                        </TextMalet>
                    </View>

                    <View style={styles.spacer} />

                    <TouchableOpacity
                        style={styles.action}
                        onPress={() => onArchive(note)}
                        activeOpacity={0.7}
                        accessibilityLabel="Archivar nota"
                    >
                        <Archive size={16} color="#536471" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.openButton}
                        onPress={() => onOpen(note)}
                        activeOpacity={0.8}
                        accessibilityLabel="Abrir nota"
                    >
                        <ArrowUpRight size={15} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

export default NoteCard;

const styles = StyleSheet.create({
    post: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#d4d4d4',
        backgroundColor: '#fff',
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#f1f1ef',
    },
    content: {
        flex: 1,
        gap: 3,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    nameGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
    },
    name: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#1f1f1f',
        letterSpacing: -0.2,
        flexShrink: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
    },
    handle: {
        fontSize: 12.5,
        color: '#536471',
        flexShrink: 1,
    },
    date: {
        fontSize: 12.5,
        color: '#536471',
    },
    body: {
        marginTop: 3,
        gap: 3,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1f1f1f',
        letterSpacing: -0.2,
    },
    excerpt: {
        fontSize: 13.5,
        lineHeight: 19,
        color: '#536471',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 7,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    wordCount: {
        fontSize: 11.5,
        fontWeight: '600',
        color: '#536471',
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    spacer: {
        flex: 1,
    },
    openButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#111',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
