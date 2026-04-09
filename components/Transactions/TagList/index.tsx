import TextMalet from "@/components/TextMalet/TextMalet";
import { useTagStore } from "@/shared/stores/useTagStore";
import React, { memo, useEffect } from "react";
import { FlatList, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface TagListProps {
    selectedTags: string[];
    onToggleTag: (tagId: string) => void;
}

export const TagList = memo(({ selectedTags, onToggleTag }: TagListProps) => {
    const { tags, loadTags, loading } = useTagStore();

    useEffect(() => {
        loadTags();
    }, []);

    if (loading && tags.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={styles.skeletonTag} />
                ))}
            </View>
        );
    }

    if (tags.length === 0) return null;

    return (
        <View style={styles.container}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={tags}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                renderItem={({ item }) => {
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
                    )
                }}
            />
        </View>
    );
});
