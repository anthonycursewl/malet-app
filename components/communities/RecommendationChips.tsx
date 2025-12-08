import TextMalet from '@/components/TextMalet/TextMalet';
import React, { memo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const RECOMMENDATIONS = [
    { id: '1', label: 'Para ti' },
    { id: '2', label: 'Tecnología' },
    { id: '3', label: 'Cripto' },
    { id: '4', label: 'Arte Digital' },
    { id: '5', label: 'Negocios' },
    { id: '6', label: 'Educación' },
    { id: '7', label: 'Eventos' },
];

const RecommendationChips = memo(() => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {RECOMMENDATIONS.map((item, index) => (
                    <TouchableOpacity key={item.id} style={[styles.chip, index === 0 && styles.activeChip]}>
                        <TextMalet style={[styles.chipText, index === 0 && styles.activeChipText]}>
                            {item.label}
                        </TextMalet>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 5,
    },
    scrollContent: {
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#eee',
    },
    activeChip: {
        backgroundColor: '#1a1a1a',
        borderColor: '#1a1a1a',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeChipText: {
        color: '#fff',
    },
});

export default RecommendationChips;
