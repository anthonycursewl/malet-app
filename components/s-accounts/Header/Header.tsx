import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import TextMalet from '@/components/TextMalet/TextMalet';
import { styles } from './Header.styles';

export const Header = () => {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ChevronLeft size={22} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
                <TextMalet style={styles.headerTitle}>S-Accounts</TextMalet>
                <TextMalet style={styles.headerSubtitle}>Tus cuentas compartidas</TextMalet>
            </View>
        </View>
    );
};
