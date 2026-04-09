import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import IconAt from "@/svgs/dashboard/IconAt";
import { Eye, EyeOff, SlidersHorizontal } from "lucide-react-native";
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface TransactionHeaderProps {
    selectedAccount: Account | null;
    isBalanceHidden: boolean;
    hasActiveFilters: boolean;
    toggleBalanceHidden: () => void;
    setFilterModalVisible: (visible: boolean) => void;
}

export const TransactionHeader = ({
    selectedAccount,
    isBalanceHidden,
    hasActiveFilters,
    toggleBalanceHidden,
    setFilterModalVisible
}: TransactionHeaderProps) => {
    const formattedBalance = useMemo(() => {
        if (!selectedAccount) return '';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(selectedAccount.balance);
    }, [selectedAccount?.balance]);

    return (
        <View style={styles.navbar}>
            <IconAt width={25} height={25} />

            <View style={styles.centerBalance}>
                {selectedAccount && (
                    <TouchableOpacity
                        onPress={toggleBalanceHidden}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        activeOpacity={0.7}
                    >
                        <TextMalet style={{ fontSize: 18, color: '#6e6e6eff' }}>
                            {isBalanceHidden ? (
                                `$***.**`
                            ) : (
                                <>
                                    ${formattedBalance.split('.')[0]}
                                    <TextMalet style={{ fontSize: 16, color: '#a8a8a8ff' }}>
                                        .{formattedBalance.split('.')[1]}
                                    </TextMalet>
                                </>
                            )}
                            <TextMalet style={{ fontSize: 16, color: '#8d8d8dff' }}>
                                {' ' + selectedAccount.currency}
                            </TextMalet>
                        </TextMalet>

                        <View style={{ marginTop: 2 }}>
                            {isBalanceHidden ? (
                                <Eye size={14} color="#a0a0a0ff" />
                            ) : (
                                <EyeOff size={14} color="#a0a0a0ff" />
                            )}
                        </View>
                    </TouchableOpacity>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <TextMalet style={{ fontSize: 10, color: '#a0a0a0ff' }}>
                        {selectedAccount?.name || 'Selecciona una cuenta.'}
                    </TextMalet>
                    {selectedAccount?.name && (
                        <TextMalet style={{ fontSize: 10, color: '#a0a0a0ff' }}>|</TextMalet>
                    )}
                    {selectedAccount?.id && (
                        <TextMalet style={{ fontSize: 10, color: '#a0a0a0ff' }}>
                            {'**** ' + selectedAccount.id.slice(8, 12)}
                        </TextMalet>
                    )}
                </View>
            </View>

            <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterButtonNoBg}>
                <SlidersHorizontal size={20} color={hasActiveFilters ? '#10b981' : '#64748b'} />
            </TouchableOpacity>
        </View>
    );
};
