import { Account } from "@/shared/entities/Account"
import { currencies } from "@/shared/entities/Currencies"
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from "react-native"
import ModalOptions from "../shared/ModalOptions"
import TextMalet from "../TextMalet/TextMalet"

export default function ModalCurrencies({
    modalCurrencyOpen,
    setModalCurrencyOpen,
    handleCurrencySelect,
    accountDetails,
}: {
    modalCurrencyOpen: boolean;
    setModalCurrencyOpen: (open: boolean) => void;
    handleCurrencySelect: (currency: typeof currencies[0]) => void;
    accountDetails: Partial<Account>;
}) {
    return (
        <ModalOptions
            visible={modalCurrencyOpen}
            onClose={() => setModalCurrencyOpen(false)}
        >
            <TextMalet style={styles.modalTitle}>Tipo de Moneda</TextMalet>

            <FlatList
                data={currencies}
                keyExtractor={(item: typeof currencies[0]) => item.name}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }: { item: typeof currencies[0] }) => (
                    <TouchableOpacity
                        style={styles.currencyOption}
                        onPress={() => handleCurrencySelect(item)}
                    >
                        <View style={styles.currencyInfo}>
                            <Image
                                source={{ uri: item.img }}
                                style={styles.currencyFlag}
                            />
                            <TextMalet style={styles.currencyLabel}>{item.label}</TextMalet>
                        </View>
                        {accountDetails.currency === item.name && (
                            <TextMalet style={styles.checkmark}>✓</TextMalet>
                        )}
                    </TouchableOpacity>
                )}
            />
        </ModalOptions>
    )
}

const styles = StyleSheet.create({
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    currencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    currencyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    currencyFlag: {
        width: 32,
        height: 24,
        borderRadius: 4,
    },
    currencyLabel: {
        fontSize: 15,
        color: '#333',
    },

    checkmark: {
        fontSize: 20,
        color: '#4CAF50',
        fontWeight: '700',
    },
})