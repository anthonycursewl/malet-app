import TextMalet from '@/components/TextMalet/TextMalet';
import { colors, spacing } from '@/shared/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
// Format date using native JavaScript

interface Transaction {
  id: string;
  name: string;
  amount: string;
  type: 'expense' | 'income';
  category: string;
  issued_at: string;
  description?: string;
  account?: string;
  payment_method?: string;
}

const MOCK_TRANSACTION: Transaction = {
  id: '1',
  name: 'Compra en supermercado',
  amount: '125.99',
  type: 'expense',
  category: 'Compras',
  account: 'Cuenta Principal',
  payment_method: 'Tarjeta de Crédito',
  issued_at: new Date().toISOString(),
  description: 'Compra semanal de víveres en el supermercado incluyendo frutas, verduras y productos de limpieza.',
};

const DetailRow = ({ 
  label, 
  value, 
  icon, 
  isLast = false 
}: { 
  label: string; 
  value: string; 
  icon?: string;
  isLast?: boolean;
}) => (
  <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
    <View style={styles.detailLabelContainer}>
      {icon && (
        <MaterialIcons 
          name={icon as any} 
          size={20} 
          color={colors.text.secondary} 
          style={styles.detailIcon}
        />
      )}
      <TextMalet style={styles.detailLabel}>
        {label}
      </TextMalet>
    </View>
    <TextMalet style={styles.detailValue} numberOfLines={2}>
      {value}
    </TextMalet>
  </View>
);

export default function TransactionDetail() {
  const { id } = useLocalSearchParams();
  
  // In a real app, you would fetch the transaction data using the ID
  const transaction = MOCK_TRANSACTION;
  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? colors.error.main : colors.success.main;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    // Format the date in Spanish
    return date.toLocaleDateString('es-ES', options)
      .replace(/(\d+):(\d+)/, (_, h, m) => `${h.padStart(2, '0')}:${m} ${+h >= 12 ? 'PM' : 'AM'}`)
      .replace(/^([^,]+),/, (match) => {
        // Capitalize first letter of weekday
        return match.charAt(0).toUpperCase() + match.slice(1);
      });
  };

  const handleEdit = () => {
    // Handle edit action
  };

  const handleDelete = () => {
    // Handle delete action
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          title: 'Detalle de transacción',
          headerTitleStyle: {
            fontFamily: 'Onest',
            fontWeight: '600',
          },
          headerBackTitle: 'Atrás',
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.amountContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${amountColor}15` }]}>
            <MaterialIcons 
              name={isExpense ? 'shopping-cart' : 'savings'} 
              size={28} 
              color={amountColor} 
            />
          </View>
          
          <TextMalet style={[styles.amount, { color: amountColor }]}>
            {isExpense ? '-' : '+'} ${parseFloat(transaction.amount).toFixed(2)}
          </TextMalet>
          
          <TextMalet style={styles.transactionType}>
            {isExpense ? 'Gasto' : 'Ingreso'} • {transaction.category}
          </TextMalet>
          
          <TextMalet style={styles.transactionDate}>
            {formatDate(transaction.issued_at)}
          </TextMalet>
        </View>
        
        <View style={styles.detailsContainer}>
          <TextMalet style={styles.sectionTitle}>Detalles de la transacción</TextMalet>
          
          <DetailRow 
            label="Descripción" 
            value={transaction.name} 
            icon="description"
          />
          
          <DetailRow 
            label="Categoría" 
            value={transaction.category} 
            icon="category"
          />
          
          <DetailRow 
            label="Cuenta" 
            value={transaction.account || 'No especificada'} 
            icon="account-balance-wallet"
          />
          
          <DetailRow 
            label="Método de pago" 
            value={transaction.payment_method || 'No especificado'}
            icon="credit-card"
            isLast
          />
        </View>
        
        {transaction.description && (
          <View style={[styles.detailsContainer, styles.descriptionContainer]}>
            <TextMalet style={styles.sectionTitle}>Notas</TextMalet>
            <View style={styles.descriptionBox}>
              <TextMalet style={styles.description}>
                {transaction.description}
              </TextMalet>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <MaterialIcons name="edit" size={20} color="#fff" />
          <TextMalet style={styles.actionButtonText}>Editar</TextMalet>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <MaterialIcons name="delete" size={20} color="#fff" />
          <TextMalet style={styles.actionButtonText}>Eliminar</TextMalet>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: spacing.large,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  amount: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: spacing.xsmall / 2,
    fontFamily: 'Onest',
  },
  transactionType: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall / 2,
    textTransform: 'capitalize',
    fontFamily: 'Onest',
  },
  transactionDate: {
    fontSize: 13,
    color: colors.text.secondary,
    fontFamily: 'Onest',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    marginHorizontal: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
    fontFamily: 'Onest',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'Onest',
  },
  detailValue: {
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'right',
    marginLeft: spacing.medium,
    fontFamily: 'Onest',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 0,
    marginHorizontal: spacing.medium,
  },
  descriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.medium,
  },
  description: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    fontFamily: 'Onest',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.medium,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        paddingBottom: spacing.large,
      },
    }),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
    borderRadius: 12,
    marginHorizontal: spacing.small,
  },
  editButton: {
    backgroundColor: colors.primary.main,
  },
  deleteButton: {
    backgroundColor: colors.error.main,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: spacing.small,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Onest',
  },
});
