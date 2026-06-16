import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, Share2, Phone, Mail, CreditCard, User } from 'lucide-react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import ModalOptions from '@/components/shared/ModalOptions';
import { SharedAccount } from '@/shared/entities/SharedAccount';
import { styles } from './DetailsModal.styles';

interface DetailsModalProps {
    visible: boolean;
    onClose: () => void;
    account: SharedAccount | null;
    shareAmount: string;
    onShareAmountChange: (value: string) => void;
    onShare: () => void;
    onDelete: (id: string) => void;
    onEdit: () => void;
}

export const DetailsModal = ({
    visible, onClose, account, shareAmount,
    onShareAmountChange, onShare, onDelete, onEdit,
}: DetailsModalProps) => {
    if (!account) return null;

    return (
        <ModalOptions visible={visible} onClose={onClose} heightRatio={0.85}>
            <View style={styles.container}>
                <View style={styles.modalHeader}>
                    <TextMalet style={styles.modalTitle}>Detalles</TextMalet>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Plus size={20} color="#6b7280" style={{ transform: [{ rotate: '45deg' }] }} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Name block */}
                    <View style={styles.nameSection}>
                        <View style={styles.nameIcon}>
                            <User size={24} color="#e0e0ec" />
                        </View>
                        <View style={styles.nameInfo}>
                            <TextMalet style={styles.label}>Titular</TextMalet>
                            <TextMalet style={styles.nameValue}>{account.name}</TextMalet>
                        </View>
                        <TouchableOpacity onPress={onShare} style={styles.shareButton}>
                            <Share2 size={18} color="#4a4a6a" />
                        </TouchableOpacity>
                    </View>

                    {/* Identifiers block */}
                    <View style={styles.rowFlex}>
                        <View style={styles.flex1}>
                            <View style={styles.detailRowIcon}>
                                <CreditCard size={16} color="#6b7280" />
                            </View>
                            <TextMalet style={styles.label}>ID de Cuenta</TextMalet>
                            <TextMalet style={account.account_id ? styles.value : styles.valueMuted}>
                                {account.account_id || 'No proporcionado'}
                            </TextMalet>
                        </View>
                        <View style={styles.flex1}>
                            <View style={styles.detailRowIcon}>
                                <User size={16} color="#6b7280" />
                            </View>
                            <TextMalet style={styles.label}>Doc. Identidad</TextMalet>
                            <TextMalet style={styles.value}>{account.identification_number}</TextMalet>
                        </View>
                    </View>

                    {/* Contact block */}
                    {(account.phone_associated || account.email_associated) && (
                        <View style={styles.contactSection}>
                            <View style={styles.contactPillsWrapper}>
                                {account.phone_associated && (
                                    <View style={styles.contactPill}>
                                        <Phone size={16} color="#6b7280" />
                                        <TextMalet style={styles.contactValue}>{account.phone_associated}</TextMalet>
                                    </View>
                                )}
                                {account.email_associated && (
                                    <View style={styles.contactPill}>
                                        <Mail size={16} color="#6b7280" />
                                        <TextMalet style={styles.contactValue}>{account.email_associated}</TextMalet>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Share Amount */}
                    <View style={styles.shareAmountSection}>
                        <TextMalet style={styles.shareTitle}>Compartir con monto (Opcional)</TextMalet>
                        <Input
                            placeholder="Ej: 50.00"
                            value={shareAmount}
                            onChangeText={onShareAmountChange}
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <Button text="Compartir Datos" onPress={onShare} style={styles.shareButtonFull} />
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footerActions}>
                        <TouchableOpacity onPress={() => onDelete(account.id)} style={styles.deleteButton}>
                            <TextMalet style={styles.deleteText}>Eliminar</TextMalet>
                        </TouchableOpacity>
                        <Button text="Editar" onPress={onEdit} style={styles.editButton} />
                    </View>
                </ScrollView>
            </View>
        </ModalOptions>
    );
};
