// components
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
// interfaces and hooks
import { Account } from "@/shared/entities/Account";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useEffect, useState } from "react";
// services and stores
import { AccountCard } from "@/components/AccountCard/AccountCard";
import ModalCurrencies from "@/components/CardCurrencies/CardCurrencies";
import { currencies } from "@/shared/entities/Currencies";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { router, useLocalSearchParams } from "expo-router";

export default function EditAccount() {
    const { accountId } = useLocalSearchParams<{ accountId: string }>();
    const { user } = useAuthStore();
    const { updateAccount, deleteAccount, loading, error, accounts } = useAccountStore();
    const [modalCurrencyOpen, setModalCurrencyOpen] = useState(false);

    const [balanceInput, setBalanceInput] = useState('');
    const [accountDetails, setAccountDetails] = useState<Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id'>>>({
        name: '',
        balance: 0,
        currency: '',
        icon: undefined,
    });

    useEffect(() => {
        if (accountId && accounts.length > 0) {
            const account = accounts.find(acc => acc.id === accountId);
            if (account) {
                setAccountDetails({
                    name: account.name,
                    balance: account.balance,
                    currency: account.currency,
                    icon: account.icon
                });
                setBalanceInput(account.balance.toString());
            }
        }
    }, [accountId, accounts]);

    useEffect(() => {
        if (error) {
            Alert.alert('Malet | Error', error);
        }
    }, [error]);

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

    const handleCurrencySelect = (currency: typeof currencies[0]) => {
        setAccountDetails(prev => ({ ...prev, currency: currency.name }));
        setModalCurrencyOpen(false);
    };

    const submit = async () => {
        if (!accountDetails.name || !accountDetails.currency) {
            Alert.alert("Error", "Por favor, completa el nombre y el tipo de moneda.");
            return;
        }

        if (!accountId) {
            Alert.alert("Error", "No se encontró el ID de la cuenta.");
            return;
        }

        console.log("Actualizando cuenta:", accountDetails);
        const updatedAccount = await updateAccount(accountId, accountDetails);

        if (updatedAccount) {
            Alert.alert(
                'Malet | Éxito!',
                'Tu cuenta ha sido actualizada correctamente!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "¿Mover cuenta a la papelera?",
            "Esta cuenta se moverá a la papelera. Podrás recuperarla desde allí o se eliminará para siempre en 30 días.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Mover a la papelera",
                    style: "destructive",
                    onPress: async () => {
                        if (!accountId) return;
                        const success = await deleteAccount(accountId);
                        if (success) {
                            Alert.alert(
                                'Malet | Éxito',
                                'Cuenta movida a la papelera correctamente.',
                                [{ text: 'OK', onPress: () => router.back() }]
                            );
                        }
                    }
                }
            ]
        );
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
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <TextMalet style={styles.backText}>←</TextMalet>
                            <TextMalet style={styles.backText}>Volver</TextMalet>
                        </TouchableOpacity>

                        <TextMalet style={styles.textTitle}>Editar cuenta</TextMalet>
                    </View>

                    <AccountCard
                        user={user}
                        selectedAccount={accounts.find(acc => acc.id === accountId) || null}
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
                            <TouchableOpacity onPress={() => setModalCurrencyOpen(true)}>
                                <TextMalet style={styles.inputText}>
                                    {accountDetails.currency || 'Seleccionar moneda'}
                                </TextMalet>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <TextMalet style={styles.inputLabel}>Balance actual</TextMalet>
                            <Input
                                value={balanceInput}
                                onChangeText={handleBalanceChange}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                            />
                            <TextMalet style={styles.helperText}>
                                Actualiza el balance solo si es necesario corregir un error.
                            </TextMalet>
                        </View>

                        <View style={styles.dangerZone}>
                            <TextMalet style={styles.dangerTitle}>Zona de peligro</TextMalet>
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={loading}>
                                <TextMalet style={styles.deleteButtonText}>Mover cuenta a la papelera</TextMalet>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        loading={loading}
                        disabled={loading}
                        text="Guardar cambios"
                        style={styles.createButton}
                        onPress={submit}
                    />
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
    inputText: {
        fontSize: 15,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 14,
        borderRadius: 12,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        paddingVertical: 12,
        color: '#333',
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
    backButton: {
        marginBottom: 12,
        gap: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    textTitle: {
        fontSize: 22,
        fontWeight: '700'
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
    helperText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
        fontStyle: 'italic',
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
    },
    dangerZone: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ffe5e5',
        gap: 12,
    },
    dangerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ff4444',
    },
    deleteButton: {
        backgroundColor: '#fff0f0',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ffcaca',
    },
    deleteButtonText: {
        color: '#ff4444',
        fontWeight: '600',
        fontSize: 15,
    },
});
