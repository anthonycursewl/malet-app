import React from 'react';
import { View } from 'react-native';
import { Users } from 'lucide-react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { styles } from './EmptyState.styles';

export const EmptyState = () => {
    return (
        <View style={styles.container}>
            <View style={styles.iconWrapper}>
                <Users size={36} color="#9ca3af" />
            </View>
            <TextMalet style={styles.title}>No hay S-Accounts</TextMalet>
            <TextMalet style={styles.subtitle}>
                Comienza vinculando y organizando cuentas compartidas.
            </TextMalet>
        </View>
    );
};
