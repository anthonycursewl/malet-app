import { Search } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { InputField } from '@/components/AddWallet/InputField';
import TextMalet from '@/components/TextMalet/TextMalet';
import ModalOptions from '@/components/shared/ModalOptions';
import { NoteLinkTarget } from '@/shared/entities/Note';
import { notesService } from '@/shared/services/notes/notes.service';
import { useAuthStore } from '@/shared/stores/useAuthStore';

const CACHE_TTL_MS = 30_000;
const CACHE_MAX = 30;
const cache = new Map<string, { data: NoteLinkTarget[]; ts: number }>();

const cacheKey = (excludeId: string | undefined, search: string): string => {
    const userId = useAuthStore.getState().user?.id ?? 'anon';
    return `${userId}:${excludeId ?? ''}:${search.trim().toLowerCase()}`;
};

interface NoteLinkPickerModalProps {
    visible: boolean;
    initialQuery: string;
    excludeId?: string;
    onClose: () => void;
    onSelect: (target: NoteLinkTarget) => void;
    onCreate: (title: string) => void;
}

/** Buscador de notas para insertar `[[Título]]` desde el editor. */
export default function NoteLinkPickerModal({
    visible,
    initialQuery,
    excludeId,
    onClose,
    onSelect,
    onCreate,
}: NoteLinkPickerModalProps) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<NoteLinkTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const requestRef = useRef(0);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const search = query.trim();
            const key = cacheKey(excludeId, search);
            const cached = cache.get(key);

            if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
                setResults(cached.data);
                setLoading(false);
                return;
            }

            const requestId = ++requestRef.current;
            setLoading(true);

            const { error, response } = await notesService.getLinkTargets({
                search: search || undefined,
                take: 20,
                exclude_id: excludeId,
            });

            if (requestRef.current !== requestId) return;

            if (!error && response) {
                const data = response.data ?? [];
                setResults(data);
                if (cache.size >= CACHE_MAX) {
                    const oldest = cache.keys().next().value;
                    if (oldest) cache.delete(oldest);
                }
                cache.set(key, { data, ts: Date.now() });
            } else {
                setResults([]);
            }
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, excludeId]);

    const canCreate = query.trim().length > 0;

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.68}>
            <TextMalet style={styles.title}>Enlazar nota</TextMalet>
            <TextMalet style={styles.subtitle}>
                Inserta un enlace a otra nota. Si no existe, puedes crearla aquí.
            </TextMalet>

            <InputField
                label="Buscar nota"
                placeholder="Nombre de la nota..."
                value={query}
                onChangeText={setQuery}
                icon={<Search size={16} color="#666" />}
                autoCapitalize="none"
                autoFocus
            />

            {canCreate && (
                <TouchableOpacity
                    style={styles.createRow}
                    onPress={() => onCreate(query.trim())}
                    activeOpacity={0.75}
                >
                    <View style={styles.createBadge}>
                        <TextMalet style={styles.createBadgeText}>+</TextMalet>
                    </View>
                    <View style={{ flex: 1 }}>
                        <TextMalet style={styles.createTitle} numberOfLines={1}>
                            Crear «{query.trim()}»
                        </TextMalet>
                        <TextMalet style={styles.createSub}>
                            Se creará una nota nueva con ese título
                        </TextMalet>
                    </View>
                </TouchableOpacity>
            )}

            <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#999" style={styles.loader} />
                ) : results.length === 0 ? (
                    <TextMalet style={styles.empty}>
                        No hay notas que coincidan.
                    </TextMalet>
                ) : (
                    results.map((target) => (
                        <TouchableOpacity
                            key={target.id}
                            style={styles.row}
                            onPress={() => onSelect(target)}
                            activeOpacity={0.75}
                        >
                            <TextMalet style={styles.rowTitle} numberOfLines={1}>
                                {target.title.trim() || 'Sin título'}
                            </TextMalet>
                            <TextMalet style={styles.rowHint}>Enlazar</TextMalet>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </ModalOptions>
    );
}

const styles = StyleSheet.create({
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.45)',
        lineHeight: 17,
        marginBottom: 4,
    },
    createRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    createBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f1f1ef',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createBadgeText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#555',
    },
    createTitle: {
        fontSize: 13.5,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    createSub: {
        fontSize: 11,
        color: '#9a9a9a',
        marginTop: 1,
    },
    list: {
        flex: 1,
        marginTop: 4,
    },
    loader: {
        marginTop: 18,
    },
    empty: {
        fontSize: 12.5,
        color: '#9a9a9a',
        textAlign: 'center',
        marginTop: 18,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    rowTitle: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    rowHint: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0b6e99',
    },
});
