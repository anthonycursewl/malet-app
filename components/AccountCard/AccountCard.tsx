import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { UserPrimitives } from "@/shared/entities/User";
import { parseAccountNumber } from "@/shared/services/wallet/parseAccountNumber";
import IconAt from "@/svgs/dashboard/IconAt";
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from 'react-native';

interface AccountCardProps {
    user: UserPrimitives;
    selectedAccount: Account | null;
}

export const AccountCard = memo(({ user, selectedAccount }: AccountCardProps) => {
    const parsedAccountNumber = useMemo(() => parseAccountNumber(selectedAccount?.id || '0000 0000 0000'), [selectedAccount]);

    return (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={['#FFFFFF', '#E9ECEF']}
                style={styles.gradient}
            >
                <View style={styles.wave} />
                <View style={styles.wave2} />
                <View style={styles.cardHeader}>
                    <TextMalet style={styles.bankName}>MALET</TextMalet>
                    <View style={styles.contactlessIcon}>
                        <View style={styles.contactlessRing1} />
                        <View style={styles.contactlessRing2} />
                        <View style={styles.contactlessRing3} />
                    </View>
                </View>

                <LinearGradient
                    colors={['#888888ff', '#32333336']}
                    style={styles.chip}
                />

                <View style={styles.cardNumberContainer}>
                    <TextMalet style={styles.repAccountNumber}>
                        {parsedAccountNumber}
                    </TextMalet>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <TextMalet style={styles.cardHolder}>Malet-owner</TextMalet>
                        <TextMalet style={styles.cardName} numberOfLines={1}>
                            {user?.name?.toUpperCase() || 'USUARIO'}
                        </TextMalet>
                    </View>
                    <IconAt width={30} height={30} fill="#343A40" />
                </View>
            </LinearGradient>
        </View>
    );
});

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    gradient: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        overflow: 'hidden',
    },
    wave: {
        position: 'absolute',
        top: '60%',
        left: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
    wave2: {
        position: 'absolute',
        bottom: -150,
        right: -150,
        width: 350,
        height: 350,
        borderRadius: 175,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    bankName: {
        color: '#495057',
        fontSize: 14,
        fontWeight: 'bold',
    },
    contactlessIcon: {
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '90deg' }]
    },
    contactlessRing1: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.5)',
        position: 'absolute'
    },
    contactlessRing2: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.5)',
        position: 'absolute'
    },
    contactlessRing3: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.5)',
        position: 'absolute'
    },
    chip: {
        width: 36,
        height: 28,
        borderRadius: 4,
        marginBottom: 12,
    },
    cardNumberContainer: {
        marginBottom: 8,
    },
    repAccountNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardHolder: {
        fontSize: 9,
        color: '#6C757D',
        marginBottom: 2,
        letterSpacing: 1,
        fontWeight: '600',
    },
    cardName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#212529',
        letterSpacing: 0.5,
        maxWidth: 160,
    },
});

export default AccountCard;
