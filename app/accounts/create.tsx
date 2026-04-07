// components
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
// interfaces and hooks
import { Account } from "@/shared/entities/Account";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useEffect, useState } from "react";
// svgs
import AccountCard from "@/components/AccountCard/AccountCard";
import ModalCurrencies from "@/components/CardCurrencies/CardCurrencies";
import { currencies } from "@/shared/entities/Currencies";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { router } from "expo-router";

export default function Create() {
    const { user } = useAuthStore();
    const { createAccount, loading, error } = useAccountStore()

    const [balanceInput, setBalanceInput] = useState('');
    const [accountDetails, setAccountDetails] = useState<Omit<Account, 'created_at' | 'updated_at' | 'id'>>({
        name: '',
        balance: 0,
        currency: '',
        user_id: user.id
    });
    const [modalCurrencyOpen, setModalCurrencyOpen] = useState(false);

    const handleCurrencySelect = (currency: typeof currencies[0]) => {
        setAccountDetails(prev => ({ ...prev, currency: currency.name }));
        setModalCurrencyOpen(false);
    };

    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error)
        }
    }, [error])

    const handleTextChange = (field: 'name' | 'currency', value: string) => {
        setAccountDetails(prev => ({ ...prev, [field]: value }));
    };

    const handleBalanceChange = (text: string) => {
        let cleanedText = text.replace(/[^0-9.]/g, '');

        const parts = cleanedText.split('.');
        if (parts.length > 2) {
            cleanedText = parts[0] + '.' + parts.slice(1).join('');
        }

        if (parts[1] && parts[1].length > 2) {
            cleanedText = `${parts[0]}.${parts[1].substring(0, 2)}`;
        }

        setBalanceInput(cleanedText);

        const numericValue = parseFloat(cleanedText) || 0;
        setAccountDetails(prev => ({ ...prev, balance: numericValue }));
    };


    const submit = async () => {
        if (!accountDetails.name || !accountDetails.currency) {
            alert("Por favor, completa el nombre y el tipo de moneda.");
            return;
        }
        console.log("Enviando datos de la cuenta:", accountDetails);
        const account = await createAccount(accountDetails)
        if (account) {
            Alert.alert('Malet | Éxito!', 'Tu cuenta ha sido creada correctamente!')

            if (router.canGoBack()) {
                router.back()
            }
        }

    };

    return (
        <LayoutAuthenticated>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <TextMalet style={styles.textTitle}>Crear cuenta de Mallet</TextMalet>
                    </View>

                    <AccountCard
                        selectedAccount={{
                            created_at: new Date(),
                            updated_at: new Date(),
                            id: '123456789012',
                            name: accountDetails.name,
                            balance: accountDetails.balance,
                            currency: accountDetails.currency,
                            user_id: user.id
                        }}
                        user={user}
                    />

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.inputLabel}>Nombre de la cuenta</TextMalet>
                            <Input
                                value={accountDetails.name}
                                onChangeText={(text) => handleTextChange('name', text)}
                                placeholder="Ej: Ahorros para viaje"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.inputLabel}>Tipo de Moneda</TextMalet>

                            <TouchableOpacity
                                style={styles.currencyButton}
                                onPress={() => setModalCurrencyOpen(true)}>
                                <TextMalet>{accountDetails.currency}</TextMalet>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.inputLabel}>Balance inicial (opcional)</TextMalet>
                            <Input
                                value={balanceInput}
                                onChangeText={handleBalanceChange}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    {loading ?
                        <ActivityIndicator size={20} color={'#000'} /> :
                        <Button
                            text="Crear cuenta"
                            style={styles.createButton}
                            onPress={submit}
                        />
                    }
                </View>
            </KeyboardAvoidingView>

            <ModalCurrencies
                modalCurrencyOpen={modalCurrencyOpen}
                setModalCurrencyOpen={setModalCurrencyOpen}
                handleCurrencySelect={handleCurrencySelect}
                accountDetails={accountDetails}
            />
        </LayoutAuthenticated>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContentContainer: {
        flexGrow: 1,
        paddingHorizontal: 5,
        paddingBottom: 120,
    },
    header: {
        marginTop: 10,
        marginBottom: 20,
    },
    textTitle: {
        fontSize: 22,
        fontWeight: '700'
    },
    currencyButton: {
        backgroundColor: '#F0F0F0',
        borderRadius: 14,
        padding: 14,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    showcaseCard: {
        width: '100%',
        minHeight: 140,
        backgroundColor: '#F0F0F0',
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    repreAccountNumber: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 1.5,
        color: '#333',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHolder: {
        color: '#555',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    cardName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111',
    },
    formContainer: {
        gap: 24,
    },
    inputGroup: {
        width: '100%',
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#444',
    },
    footer: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8e8e8',
        backgroundColor: 'white',
    },
    createButton: {
        width: '100%',
    }
});