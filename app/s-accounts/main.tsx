import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import { SharedAccount } from "@/shared/entities/SharedAccount";
import { useSharedAccountStore } from "@/shared/stores/useSharedAccountStore";
import { router } from "expo-router";
import { ChevronLeft, CreditCard, Mail, Phone, Plus, Share2, Users } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Share, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SAccounts() {
    const { getSharedAccounts, sharedAccounts, loading, createSharedAccount, updateSharedAccount, deleteSharedAccount } = useSharedAccountStore();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<SharedAccount | null>(null);
    const [shareAmount, setShareAmount] = useState('');

    const loadAccounts = useCallback(() => {
        getSharedAccounts(undefined, { refresh: true });
    }, [getSharedAccounts]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const openCreateModal = () => {
        router.push('/s-accounts/manage');
    };

    const openDetailsModal = (account: SharedAccount) => {
        setSelectedAccount(account);
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Eliminar Cuenta Compartida",
            "¿Estás seguro de que deseas eliminar esta cuenta? Se enviará a la papelera.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteSharedAccount(id);
                        setModalVisible(false);
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        if (!selectedAccount) return;

        let message = `*Detalles de Pago - Malet*\n\n`;
        message += `Para: ${selectedAccount.name}\n`;
        if (selectedAccount.account_id) message += `ID de Cuenta: ${selectedAccount.account_id}\n`;
        message += `Documento: ${selectedAccount.identification_number}\n`;

        if (shareAmount.trim()) {
            message += `\n*Monto a pagar: ${Number(shareAmount).toFixed(2)}*\n`;
        }

        try {
            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const renderItem = ({ item }: { item: SharedAccount }) => (
        <TouchableOpacity style={styles.card} onPress={() => openDetailsModal(item)}>
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.iconContainer}>
                        <Users size={20} color="#1f1f1f" />
                    </View>
                    <View>
                        <TextMalet style={styles.cardTitle}>{item.name}</TextMalet>
                        {item.account_id ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <CreditCard size={12} color="#888" />
                                <TextMalet style={styles.cardSubtitle}>{item.account_id}</TextMalet>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {item.phone_associated && (
                    <View style={styles.infoRow}>
                        <Phone size={14} color="#666" />
                        <TextMalet style={styles.infoText}>{item.phone_associated}</TextMalet>
                    </View>
                )}
                {item.email_associated && (
                    <View style={styles.infoRow}>
                        <Mail size={14} color="#666" />
                        <TextMalet style={styles.infoText}>{item.email_associated}</TextMalet>
                    </View>
                )}
                {!item.phone_associated && !item.email_associated && (
                    <TextMalet style={styles.infoTextEmpy}>Sin datos de contacto asociados</TextMalet>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1f1f1f" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <TextMalet style={styles.headerTitle}>S-Accounts</TextMalet>
                    <TextMalet style={styles.headerSubtitle}>Tus cuentas compartidas</TextMalet>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <FlatList
                    data={sharedAccounts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading && sharedAccounts.length === 0}
                    onRefresh={loadAccounts}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Users size={48} color="#ccc" />
                                <TextMalet style={styles.emptyTitle}>No hay S-Accounts</TextMalet>
                                <TextMalet style={styles.emptySubtitle}>
                                    Comienza vinculando y organizando cuentas compartidas.
                                </TextMalet>
                            </View>
                        ) : null
                    }
                />
            </View>

            {/* Create Button */}
            <View style={styles.footer}>
                <Button
                    text="Nueva S-Account"
                    onPress={openCreateModal}
                    style={{ width: '100%' }}
                />
            </View>

            {/* Details Modal */}
            <ModalOptions
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setShareAmount('');
                }}
                heightRatio={0.7}
            >
                {selectedAccount && (
                    <View style={{ flex: 1, paddingBottom: 20 }}>
                        <View style={styles.modalHeader}>
                            <TextMalet style={styles.modalTitle}>
                                Detalles de S-Account
                            </TextMalet>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Plus size={24} color="#1f1f1f" style={{ transform: [{ rotate: '45deg' }] }} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 16, marginTop: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={{ color: '#666', fontSize: 13 }}>Nombre</TextMalet>
                                    <TextMalet style={{ fontSize: 18, fontWeight: '600', color: '#1f1f1f' }}>{selectedAccount.name}</TextMalet>
                                </View>
                                <TouchableOpacity
                                    onPress={handleShare}
                                    style={{ backgroundColor: '#f5f5f5', padding: 10, borderRadius: 12 }}
                                >
                                    <Share2 size={20} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={{ color: '#666', fontSize: 13 }}>ID de Cuenta</TextMalet>
                                    <TextMalet style={{ fontSize: 16, color: selectedAccount.account_id ? '#1f1f1f' : '#aaa' }}>
                                        {selectedAccount.account_id || 'No especificado'}
                                    </TextMalet>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <TextMalet style={{ color: '#666', fontSize: 13 }}>Doc. Identidad</TextMalet>
                                    <TextMalet style={{ fontSize: 16, color: '#1f1f1f' }}>{selectedAccount.identification_number}</TextMalet>
                                </View>
                            </View>

                            {(selectedAccount.phone_associated || selectedAccount.email_associated) && (
                                <View style={{ gap: 8 }}>
                                    <TextMalet style={{ color: '#666', fontSize: 13, marginBottom: -4 }}>Contacto Adicional</TextMalet>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                                        {selectedAccount.phone_associated ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Phone size={14} color="#666" />
                                                <TextMalet style={{ fontSize: 14, color: '#1f1f1f' }}>{selectedAccount.phone_associated}</TextMalet>
                                            </View>
                                        ) : null}
                                        {selectedAccount.email_associated ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Mail size={14} color="#666" />
                                                <TextMalet style={{ fontSize: 14, color: '#1f1f1f' }}>{selectedAccount.email_associated}</TextMalet>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            )}

                            <View style={{ borderTopColor: '#c7c7c7ff', borderTopWidth: 1, padding: 16, paddingHorizontal: 0, gap: 10, borderStyle: 'dashed', paddingTop: 20 }}>
                                <TextMalet style={{ fontWeight: '600', fontSize: 14 }}>Compartir con monto (Opcional)</TextMalet>
                                <Input
                                    placeholder="Ej: 50.00"
                                    value={shareAmount}
                                    onChangeText={setShareAmount}
                                    keyboardType="numeric"
                                    style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }}
                                />
                                <Button
                                    text="Compartir Datos"
                                    onPress={handleShare}
                                    style={{ minHeight: 44 }}
                                />
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: 20 }}>
                            <TouchableOpacity
                                onPress={() => handleDelete(selectedAccount.id)}
                                style={{ flex: 1, backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 }}
                            >
                                <TextMalet style={{ color: '#e53e3e', fontSize: 16 }}>Eliminar</TextMalet>
                            </TouchableOpacity>
                            <Button
                                text="Editar"
                                onPress={() => {
                                    setModalVisible(false);
                                    router.push(`/s-accounts/manage?id=${selectedAccount.id}`);
                                }}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                )}
            </ModalOptions>
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
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderRadius: 12,
        borderColor: '#e4e4e4ff',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#e4e4e4ff',
    },
    cardBody: {
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#444',
    },
    infoTextEmpy: {
        fontSize: 13,
        color: '#aaa',
        fontStyle: 'italic',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
    // Modal Styles
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    closeButton: {
        padding: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
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
    }
});

