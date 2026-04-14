import TextMalet from '@/components/TextMalet/TextMalet';
import { getCurrencyIcon } from '@/shared/services/currency/currencyService';
import { useAccountStore } from '@/shared/stores/useAccountStore';
import { useWalletStore } from '@/shared/stores/useWalletStore';
import { colors, spacing } from '@/shared/theme';
import IconAt from '@/svgs/dashboard/IconAt';
import { MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BadgeDollarSign, RefreshCw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TransactionDetail() {
  const { transaction_id } = useLocalSearchParams();
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const { transactions, completePendingTransaction, deleteTransaction, restoreTransaction } = useWalletStore();
  const { accounts, getAllAccountsByUserId, updateBalanceInMemory } = useAccountStore();
  const transaction = transactions.find(t => t.id.toString() === transaction_id);
  const account = accounts.find(a => a.id === transaction?.account_id);

  if (!transaction) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ title: 'Detalle' }} />
        <MaterialIcons name="error-outline" size={48} color={colors.text.secondary} />
        <TextMalet style={styles.notFoundText}>Transacción no encontrada</TextMalet>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <TextMalet style={styles.backButtonText}>Volver</TextMalet>
        </TouchableOpacity>
      </View>
    );
  }

  const isExpense = transaction.type === 'expense';
  const isPending = transaction.type === 'pending_payment';

  let statusColor = colors.success.main;
  let statusBg = '#E8F5E9';
  let statusIcon: keyof typeof MaterialIcons.glyphMap = 'arrow-downward';
  let statusText = 'INGRESO COMPLETADO';
  let gradientColors: readonly [string, string] = ['rgba(120, 255, 165, 0.12)', 'rgba(141, 255, 184, 0)'];

  if (isExpense) {
    statusColor = colors.error.main;
    statusBg = '#FFEBEE';
    statusIcon = 'arrow-upward';
    statusText = 'GASTO REALIZADO';
    gradientColors = ['rgba(255, 82, 82, 0.12)', 'rgba(255, 82, 82, 0)'];
  } else if (isPending) {
    statusColor = '#F5C842';
    statusBg = '#FFF8E1';
    statusIcon = 'schedule';
    statusText = 'PAGO PENDIENTE';
    gradientColors = ['rgba(245, 200, 66, 0.12)', 'rgba(245, 200, 66, 0)'];
  }

  const amountParts = parseFloat(transaction.amount).toFixed(2).split('.');
  const amountInteger = amountParts[0];
  const amountDecimal = amountParts[1];

  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', ' -');
  };

  const formatAccountInfo = () => {
    if (!account) return 'Desconocida';
    const maskedId = account.id.slice(0, 4) + ' ****';
    return `${account.name} • ${maskedId}`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Comprobante de transacción Malet\n\nMonto: $${transaction.amount}\nFecha: ${formatDate(transaction.issued_at)}\nRef: ${transaction.id}`,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir la transacción');
    }
  };

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(transaction.index_id.toString());
    Alert.alert('Copiado', `ID de transacción copiado al portapapeles`);
  };


  const handleDelete = async () => {
    Alert.alert('Eliminar', '¿Estás seguro de que deseas eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => console.log('Delete') }
    ]);

    const sucess = await deleteTransaction(transaction.index_id.toString());
    if (!sucess) {
      Alert.alert('Error | Malet', 'No se ha podido eliminar la transacción.');
      return;
    }
    Alert.alert('Eliminado | Malet', 'Transacción eliminada correctamente.');
    getAllAccountsByUserId({ refresh: true });
    router.back();
  };

  const handleRestore = async () => {
    Alert.alert('Restaurar', '¿Estás seguro de que deseas restaurar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', style: 'default', onPress: () => { restoreTx() } }
    ]);

    const restoreTx = async () => {
      const sucess = await restoreTransaction(transaction.index_id.toString());
      if (!sucess) {
        Alert.alert('Error | Malet', 'No se ha podido restaurar la transacción.');
        return;
      }
      Alert.alert('Restaurado | Malet', 'Transacción restaurada correctamente.');
      router.back();
    }
  };

  const handleComplete = (type: 'expense' | 'saving') => {
    const title = type === 'expense' ? 'Marcar como Egreso' : 'Marcar como Ingreso';
    const message = `¿Confirmas que deseas finalizar esta transacción y registrarla como un ${type === 'expense' ? 'egreso' : 'ingreso'}?`;

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'default',
        onPress: async () => {
          setIsCompleting(true);
          const success = await completePendingTransaction(transaction.id.toString(), type);
          if (success) {
            updateBalanceInMemory(
              transaction.account_id,
              parseFloat(transaction.amount),
              type
            );
            getAllAccountsByUserId();
            Alert.alert('Éxito', `Transacción marcada como ${type === 'expense' ? 'Egreso' : 'Ingreso'}`);
          } else {
            Alert.alert('Error', 'No se ha podido procesar el cambio en el servidor.');
          }
          setIsCompleting(false);
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={gradientColors}
        style={styles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, position: 'relative' }}>
              <View style={[styles.statusIconContainer, { backgroundColor: statusBg }]}>
                <MaterialIcons name={statusIcon} size={32} color={statusColor} />
              </View>

              <View style={{
                position: 'absolute', right: 0,
                bottom: 15, backgroundColor: 'rgba(255, 255, 255, 1)',
                padding: 4, borderRadius: 100,
                borderRightWidth: 1,
                borderRightColor: '#aaaaaadc',
                borderLeftWidth: 1,
                borderLeftColor: '#aaaaaadc',
                borderTopWidth: 1,
                borderTopColor: '#aaaaaadc',
                borderBottomWidth: 1,
                borderBottomColor: '#aaaaaadc',
              }}>
                <IconAt height={18} width={18} fill={"#252525ff"} />
              </View>
            </View>

            <TextMalet style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </TextMalet>

            <View style={styles.amountContainer}>
              <TextMalet style={styles.currencySymbol}>$</TextMalet>
              <TextMalet style={styles.amountInteger}>{amountInteger}</TextMalet>
              <TextMalet style={styles.amountDecimal}>.{amountDecimal}</TextMalet>
            </View>

            <TextMalet style={styles.subtitle}>
              {transaction.name}
            </TextMalet>

            <View style={styles.securityContainer}>
              <View style={styles.securityPill}>
                <TextMalet style={styles.securityText}>
                  Esta transacción ha sido verificada por
                </TextMalet>
                <MaskedView
                  style={styles.maskedView}
                  maskElement={
                    <TextMalet style={styles.securityBrandText}>
                      BRD-Secure
                    </TextMalet>
                  }
                >
                  <LinearGradient
                    colors={['#ff766cff', '#9477ffff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </MaskedView>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <TextMalet style={styles.detailLabel}>Fecha y Hora</TextMalet>
              <TextMalet style={styles.detailValue}>{formatDate(transaction.issued_at)}</TextMalet>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <TextMalet style={styles.detailLabel}>Cuenta</TextMalet>
              <View style={styles.accountValueContainer}>
                <Image source={{ uri: getCurrencyIcon(transaction.currency_code) }} style={{ width: 18, height: 18 }} />
                <TextMalet style={styles.detailValue}>{formatAccountInfo()}</TextMalet>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <TextMalet style={styles.detailLabel}>ID de Referencia</TextMalet>
              <TextMalet style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                {transaction.id}
              </TextMalet>
            </View>

            <View style={styles.detailRow}>
              <TextMalet style={styles.detailLabel}>ID de Transacción</TextMalet>

              <View style={styles.accountValueContainer}>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyId}>
                  <TextMalet style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                    {transaction.index_id}
                  </TextMalet>
                  <MaterialIcons name="content-copy" size={18} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <TextMalet style={styles.detailLabel}>Tipo</TextMalet>
              <TextMalet style={styles.detailValue}>
                {isPending ? 'Pendiente' : (isExpense ? 'Gasto' : 'Ingreso')}
              </TextMalet>
            </View>

            <View style={styles.detailRow}>
              <TextMalet style={styles.detailLabel}>Etiquetas</TextMalet>
              <View style={styles.tagsContainer}>
                {transaction.tags && transaction.tags.length > 0 ? (
                  transaction.tags.map(tag => {
                    const color = tag.color || '#999';
                    const name = tag.name.startsWith('#') ? tag.name : '#' + tag.name;
                    return (
                      <View key={tag.id} style={[styles.tagChip, { borderColor: '#eeeeeeff', borderRadius: 99 }]}>
                        <TextMalet style={[styles.tagText, { color }]}>
                          <TextMalet style={[styles.tagInitial, { color }]}>{name.charAt(0).toUpperCase()}</TextMalet>
                          {name.slice(1).toLowerCase()}
                        </TextMalet>
                      </View>
                    );
                  })
                ) : (
                  <TextMalet style={styles.detailValue}>Sin etiquetas</TextMalet>
                )}
              </View>
            </View>

          </View>

          {/* Pending Actions */}
          {isPending && (
            <View style={styles.pendingActionsContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <BadgeDollarSign size={20} />
                <TextMalet style={styles.pendingActionsTitle}>Finalizar Transacción</TextMalet>
              </View>

              <TextMalet style={styles.pendingActionsDescription}>
                Selecciona la categoría real para cerrar este pago pendiente:
              </TextMalet>
              <View style={styles.pendingButtonsRow}>
                {isCompleting ? (
                  <View style={{ padding: 12, width: '100%', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.primary.main} />
                    <TextMalet style={{ marginTop: 8, color: colors.text.secondary, fontSize: 13 }}>Procesando...</TextMalet>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.btnExpense} onPress={() => handleComplete('expense')}>
                      <MaterialIcons name="arrow-upward" size={20} color={colors.error.main} />
                      <TextMalet style={[styles.btnActionText, { color: colors.error.main }]}>Egreso</TextMalet>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnIncome} onPress={() => handleComplete('saving')}>
                      <MaterialIcons name="arrow-downward" size={20} color={colors.success.main} />
                      <TextMalet style={[styles.btnActionText, { color: colors.success.main }]}>Ingreso</TextMalet>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <MaterialIcons name="share" size={20} color="#fff" />
              <TextMalet style={styles.shareButtonText}>Compartir Recibo</TextMalet>
            </TouchableOpacity>

            {transaction.deleted_at ? (
              <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                <RefreshCw size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Trash2 size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 150,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  notFoundText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  backButton: {
    padding: spacing.small,
  },
  backButtonText: {
    color: colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    minHeight: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
    marginTop: 6,
    marginRight: 2,
  },
  amountInteger: {
    fontSize: 42,
    fontWeight: '700',
    color: '#212529',
    letterSpacing: -1,
  },
  amountDecimal: {
    fontSize: 24,
    fontWeight: '600',
    color: '#868e96',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F3F5',
    marginVertical: 20,
    width: '100%',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#868e96',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  accountValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F8F9FA',
  },
  actionsSection: {
    gap: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  shareButton: {
    backgroundColor: '#252525ff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '75%'
  },
  deleteButton: {
    backgroundColor: '#ff7765ff',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '20%'
  },
  restoreButton: {
    backgroundColor: '#3f3f3fff',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '20%'
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  securityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 15,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7ee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#252525ea',
  },
  maskedView: {
    height: 15,
    width: 65,
  },
  securityBrandText: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'transparent',
  },
  pendingActionsContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbdbdbff',
  },
  pendingActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  pendingActionsDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  pendingButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnExpense: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
    gap: 6,
  },
  btnIncome: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120, 255, 165, 0.5)',
    gap: 6,
  },
  btnActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  moreCounter: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagInitial: {
    fontWeight: '700',
    fontSize: 13,
  },
});


