import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TextMalet from '@/components/TextMalet/TextMalet';
import { styles } from './Header.styles';

export const Header = () => {
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={['#f8f6ff', '#ede4ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ChevronLeft size={22} color="#4a3a7a" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
                <TextMalet style={styles.headerTitle}>S-Accounts</TextMalet>
                <TextMalet style={styles.headerSubtitle}>Tus cuentas compartidas</TextMalet>
            </View>
        </LinearGradient>
    );
};
