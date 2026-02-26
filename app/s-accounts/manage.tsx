import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import TextMalet from "@/components/TextMalet/TextMalet";
import { useSharedAccountStore } from "@/shared/stores/useSharedAccountStore";
import { router, useLocalSearchParams } from "expo-router";
import { AlertCircle, ChevronLeft, Info } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageSAccount() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!id;
    const { sharedAccounts, loading, createSharedAccount, updateSharedAccount } = useSharedAccountStore();

    // Form state
    const [name, setName] = useState('');
    const [accountId, setAccountId] = useState('');
    const [identificationNumber, setIdentificationNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (id) {
            const account = sharedAccounts.find(a => a.id === id);
            if (account) {
                setName(account.name);
                setAccountId(account.account_id || '');
                setIdentificationNumber(account.identification_number || '');
                setPhone(account.phone_associated || '');
                setEmail(account.email_associated || '');
            }
        }
    }, [id, sharedAccounts]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "El nombre es obligatorio");
            return;
        }

        if (!accountId.trim()) {
            Alert.alert("Error", "El ID de Cuenta es obligatorio");
            return;
        }

        if (isEditing && id) {
            const updated = await updateSharedAccount(id, {
                name,
                account_id: accountId,
                identification_number: identificationNumber,
                phone_associated: phone,
                email_associated: email
            });
            if (updated) router.back();
        } else {
            const created = await createSharedAccount({
                name,
                account_id: accountId,
                identification_number: identificationNumber,
                phone_associated: phone,
                email_associated: email
            });
            if (created) router.back();
        }
    };

    const showOptionalTooltip = () => {
        Alert.alert("Información", "Este campo es opcional.");
    };

    const showMandatoryTooltip = () => {
        Alert.alert("Información", "Este campo es obligatorio.");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1f1f1f" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <TextMalet style={styles.headerTitle}>
                        {isEditing ? 'Editar S-Account' : 'Crear S-Account'}
                    </TextMalet>
                    <TextMalet style={styles.headerSubtitle}>
                        Completa los datos de la cuenta compartida
                    </TextMalet>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <View style={styles.labelWithInfo}>
                                <TextMalet style={styles.inputLabel}>Nombre</TextMalet>
                                <TouchableOpacity onPress={showMandatoryTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <AlertCircle size={14} color="#ff6b6bff" />
                                </TouchableOpacity>
                            </View>
                            <Input
                                placeholder="Ej: Pago de Alquiler"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelWithInfo}>
                                <TextMalet style={styles.inputLabel}>ID de Cuenta</TextMalet>
                                <TouchableOpacity onPress={showMandatoryTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <AlertCircle size={14} color="#ff6b6bff" />
                                </TouchableOpacity>
                            </View>
                            <Input
                                placeholder="Ej: ABC-123-XYZ"
                                value={accountId}
                                onChangeText={setAccountId}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelWithInfo}>
                                <TextMalet style={styles.inputLabel}>Documento de Identidad</TextMalet>
                                <TouchableOpacity onPress={showOptionalTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Info size={14} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <Input
                                placeholder="Ej: V-12345678"
                                value={identificationNumber}
                                onChangeText={setIdentificationNumber}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelWithInfo}>
                                <TextMalet style={styles.inputLabel}>Teléfono asociado</TextMalet>
                                <TouchableOpacity onPress={showOptionalTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Info size={14} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <Input
                                placeholder="Ej: +123456789"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelWithInfo}>
                                <TextMalet style={styles.inputLabel}>Email asociado</TextMalet>
                                <TouchableOpacity onPress={showOptionalTooltip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Info size={14} color="#666" />
                                </TouchableOpacity>
                            </View>
                            <Input
                                placeholder="Ej: amigo@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <Button
                    text={loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear S-Account')}
                    onPress={handleSave}
                    style={{ width: '100%' }}
                    disabled={loading}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0ff',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        marginLeft: -8,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
        paddingLeft: 4,
    },
    labelWithInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
});
