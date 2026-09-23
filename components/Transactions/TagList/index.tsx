import TextMalet from "@/components/TextMalet/TextMalet";
import { useTagStore } from "@/shared/stores/useTagStore";
import { memo, useCallback, useEffect, useRef } from "react";
import { FlatList, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { styles } from './styles';

interface TagListProps {
    selectedTags: string[];
    onToggleTag: (tagId: string) => void;
}

const TAG_TAKE = 20;

export const TagList = memo(({ selectedTags, onToggleTag }: TagListProps) => {
    const tags = useTagStore(s => s.tags);
    const loading = useTagStore(s => s.loading);
    const paginationTags = useTagStore(s => s.paginationTags);
    const loadTagsPage = useTagStore(s => s.loadTagsPage);
    const initialLoadDone = useRef(false);

    useEffect(() => {
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            loadTagsPage({ refresh: true });
        }
    }, [loadTagsPage]);

    const handleEndReached = useCallback(() => {
        if (!loading && !paginationTags.isEnd) {
            loadTagsPage({ refresh: false });
        }
    }, [loading, paginationTags.isEnd, loadTagsPage]);

    const renderItem = useCallback(({ item }: { item: any }) => {
        const isActive = selectedTags.includes(item.id);
        return (
            <TouchableOpacity
                style={[styles.tagItem, isActive && styles.tagItemActive]}
                onPress={() => onToggleTag(item.id)}
            >
                <TextMalet style={[styles.tagName, isActive && styles.tagNameActive]}>
                    <TextMalet style={{ color: item.color }}>{item.name.charAt(0)}</TextMalet>
                    {item.name.slice(1)}
                </TextMalet>
            </TouchableOpacity>
        );
    }, [selectedTags, onToggleTag]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    const ListFooterComponent = useCallback(() => {
        if (!loading || tags.length === 0) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="rgba(0,0,0,0.3)" />
            </View>
        );
    }, [loading, tags.length]);

    const ListEmptyComponent = useCallback(() => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={styles.skeletonTag} />
                    ))}
                </View>
            );
        }
        return null;
    }, [loading]);

    return (
        <View style={styles.container}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={tags}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.scrollContent}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.3}
                ListFooterComponent={ListFooterComponent}
                ListEmptyComponent={ListEmptyComponent}
                removeClippedSubviews
                maxToRenderPerBatch={TAG_TAKE}
                windowSize={3}
                initialNumToRender={TAG_TAKE}
            />
        </View>
    );
});
