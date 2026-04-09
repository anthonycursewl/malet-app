import Button from "@/components/Button/Button";
import React, { memo } from "react";
import { View } from 'react-native';
import { styles } from './styles';

interface TransactionFooterProps {
    buttonText: string;
    onPress: () => void;
}

export const TransactionFooter = memo(({ buttonText, onPress }: TransactionFooterProps) => {
    return (
        <View style={styles.footerContainer}>
            <Button
                text={buttonText}
                onPress={onPress}
                style={styles.footerButton}
            />
        </View>
    );
});
