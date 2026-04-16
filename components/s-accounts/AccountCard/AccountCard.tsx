import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Users, CreditCard, Phone, Mail } from 'lucide-react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { SharedAccount } from '@/shared/entities/SharedAccount';
import { styles } from './AccountCard.styles';

interface AccountCardProps {
    item: SharedAccount;
    onPress: (account: SharedAccount) => void;
}

export const AccountCard = ({ item, onPress }: AccountCardProps) => {
    const hasContactInfo = item.phone_associated || item.email_associated;

    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Users size={22} color="#111827" />
                </View>
                <View style={styles.titleContainer}>
                    <TextMalet style={styles.cardTitle}>{item.name}</TextMalet>
                    {item.account_id ? (
                        <View style={styles.accountIdContainer}>
                            <CreditCard size={14} color="#6b7280" />
                            <TextMalet style={styles.cardSubtitle}>{item.account_id}</TextMalet>
                        </View>
                    ) : null}
                </View>
            </View>

            <View style={styles.cardBody}>
                {item.phone_associated ? (
                    <View style={styles.infoPill}>
                        <Phone size={14} color="#6b7280" />
                        <TextMalet style={styles.infoText}>{item.phone_associated}</TextMalet>
                    </View>
                ) : null}
                {item.email_associated ? (
                    <View style={styles.infoPill}>
                        <Mail size={14} color="#6b7280" />
                        <TextMalet style={styles.infoText}>{item.email_associated}</TextMalet>
                    </View>
                ) : null}
                {!hasContactInfo && (
                    <TextMalet style={styles.infoTextEmpty}>Sin datos de contacto vinculados</TextMalet>
                )}
            </View>
        </TouchableOpacity>
    );
};
