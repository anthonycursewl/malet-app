import TextMalet from '@/components/TextMalet/TextMalet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CommunityCardProps {
    title: string;
    description: string;
    imageUrl?: string;
    membersCount: number;
    onPress?: () => void;
    height?: number; // Allow dynamic height for masonry effect
}

const CommunityCard = memo(({ title, description, imageUrl, membersCount, onPress, height = 200 }: CommunityCardProps) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.container, { height }]}>
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.image, styles.placeholder]} />
            )}

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <TextMalet style={styles.title} numberOfLines={2}>{title}</TextMalet>
                    <TextMalet style={styles.members} numberOfLines={1}>{membersCount} miembros</TextMalet>
                    {description && (
                        <TextMalet style={styles.description} numberOfLines={2}>{description}</TextMalet>
                    )}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        marginBottom: 12,
        width: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        backgroundColor: '#e1e1e1',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: 12,
    },
    content: {
        gap: 4,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    members: {
        color: '#ddd',
        fontSize: 12,
    },
    description: {
        color: '#ccc',
        fontSize: 12,
    },
});

export default CommunityCard;
