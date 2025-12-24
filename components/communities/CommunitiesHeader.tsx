import TextMalet from '@/components/TextMalet/TextMalet';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import IconArrow from '@/svgs/dashboard/IconArrow';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { memo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const PLACEHOLDER_AVATAR_URL = require('@/assets/images/placeholders/placeholder_avatar.png');

const CommunitiesHeader = memo((): React.ReactElement => {
    const { user } = useAuthStore();

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <IconArrow width={20} height={20} />
                </View>
            </TouchableOpacity>

            <MaskedView
                style={{ height: 24, width: 120 }}
                maskElement={
                    <View style={{ backgroundColor: 'transparent', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <TextMalet style={styles.title}>Comunidades</TextMalet>
                    </View>
                }
            >
                <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </MaskedView>

            <View style={styles.placeholder}>
                <Image
                    source={user?.avatar_url ? { uri: user.avatar_url } : PLACEHOLDER_AVATAR_URL}
                    style={{ width: 35, height: 35, borderRadius: 50 }}
                />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1a1a1a',
        letterSpacing: 0.2,
    },
    placeholder: {
        width: 28,
    },
});

export default CommunitiesHeader;
