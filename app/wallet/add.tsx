import Button from "@/components/Button/Button";
import LayoutAuthenticated from "@/components/Layout/LayoutAuthenticated";
import AccountSelectorModal from "@/components/Modals/ModalAccounts/ModalAccountSelector";
import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { TransactionItem } from "@/shared/entities/TransactionItem";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface FormErrors {
  name?: string;
  amount?: string;
  account_id?: string;
}

export default function AddWallet() {
  const { type } = useGlobalSearchParams()

  // stores
  const { addTransaction, loading } = useWalletStore();
  const { user } = useAuthStore() 
  const { accounts, getAllAccountsByUserId, updateBalanceInMemory } = useAccountStore()
  const router = useRouter();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState<Omit<TransactionItem, 'id' | 'issued_at'>>({
    name: '',
    amount: '',
    type: type as 'expense' | 'saving',
    account_id: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const selectedAccount = accounts.find(acc => acc.id === formData.account_id);

  const handleInputChange = (field: keyof Omit<TransactionItem, 'id' | 'issued_at'>, value: string) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value,
    }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [field]: undefined,
      }));
    }
  };

  const handleSelectAccount = (account: Account) => {
    handleInputChange('account_id', account.id);
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'La descripción es requerida.';
    }

    if (!formData.amount) {
      newErrors.amount = 'El monto es requerido.';
    }

    if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo.';
    }

    if (!formData.account_id) {
      newErrors.account_id = 'La cuenta es requerida.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const parseAmount = (amountString: string): number => {
    const normalizedString = amountString.replace(/,/g, '.');
    return parseFloat(normalizedString);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const amount = parseAmount(formData.amount);
    
    const transaction = await addTransaction({
      ...formData,
      amount: amount.toString(),
    });
    
    if (transaction) {
      updateBalanceInMemory(formData.account_id, amount, formData.type === 'expense' ? 'expense' : 'saving');
      router.back();
    }
  };

  useEffect(() => {
    if (accounts && accounts.length === 0) {
      getAllAccountsByUserId(user.id)
    }
  }, [user.id, accounts])

  return (
    <LayoutAuthenticated>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexOne}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <TextMalet style={styles.headerTitle}>
              Agregar Transacción
            </TextMalet>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            <View style={styles.typeSelectorContainer}>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'expense' && styles.typeButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                >
                  <TextMalet style={
                    formData.type === 'expense' ? styles.typeButtonTextExpense : styles.typeButtonTextInactive
                  }>
                    Egreso
                  </TextMalet>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'saving' && styles.typeButtonSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'saving' }))}
                >
                  <TextMalet style={
                    formData.type === 'saving' ? styles.typeButtonTextSaving : styles.typeButtonTextInactive
                  }>
                    Ingreso
                  </TextMalet>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <TextMalet style={styles.amountLabel}>Monto</TextMalet>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, formData.type === 'expense' ? styles.textRed : styles.textGreen]}>$</Text>
                <TextInput
                  style={[styles.amountInput, formData.type === 'expense' ? styles.textRed : styles.textGreen]}
                  placeholder="0.00"
                  value={formData.amount.toString()}
                  onChangeText={(text) => handleInputChange('amount', text)}
                  placeholderTextColor={formData.type === 'expense' ? '#fca5a5' : '#86efac'}
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>
              {errors.amount && (
                <TextMalet style={styles.errorText}>{errors.amount}</TextMalet>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextMalet style={styles.label}>Cuenta</TextMalet>
              <TouchableOpacity
                style={styles.textInput}
                onPress={() => setIsModalVisible(true)}
              >
                <TextMalet style={selectedAccount ? styles.inputText : styles.placeholderText}>
                  {selectedAccount ? selectedAccount.name : 'Selecciona una cuenta'}
                </TextMalet>
              </TouchableOpacity>
              {errors.account_id && (
                <TextMalet style={styles.errorText}>{errors.account_id}</TextMalet>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextMalet style={styles.label}>Descripción</TextMalet>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Supermercado, Salario..."
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
              {errors.name && (
                <TextMalet style={styles.errorText}>{errors.name}</TextMalet>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {
              loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Button
                  text="Guardar Transacción"
                  onPress={handleSubmit}
                />
              )
            }
          </View>
        </View>
        
        <AccountSelectorModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          accounts={accounts}
          selectedAccountId={formData.account_id}
          onSelectAccount={handleSelectAccount}
        />
      </KeyboardAvoidingView>
    </LayoutAuthenticated>
  )
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  container: { 
    flex: 1, 
    padding: 12, 
    paddingTop: 0, 
    backgroundColor: '#fff' 
  },
  header: { 
    flexDirection: 'row', 
    marginBottom: 32, 
    justifyContent: 'flex-start', 
    alignItems: 'center' 
  },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 28, color: '#1f2937', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginLeft: 16 },
  typeSelectorContainer: { marginBottom: 24 },
  typeSelector: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 4, borderRadius: 999 },
  typeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  typeButtonSelected: { backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2 },
  typeButtonTextExpense: { color: '#ef4444', fontWeight: '600' },
  typeButtonTextSaving: { color: '#22c55e', fontWeight: '600' },
  typeButtonTextInactive: { color: '#4b5563', fontWeight: '600' },
  amountContainer: { alignItems: 'center', marginBottom: 24 },
  amountLabel: { color: '#6b7280', fontWeight: '500', marginBottom: 8 },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 30, fontWeight: 'bold' },
  amountInput: { fontSize: 56, fontWeight: 'bold', textAlign: 'center', minWidth: 150 },
  textRed: { color: '#ef4444' },
  textGreen: { color: '#22c55e' },
  inputGroup: { marginBottom: 24 },
  label: { color: '#6b7280', fontWeight: '500', marginBottom: 8 },
  textInput: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center' },
  inputText: {
    fontSize: 16,
    color: '#1f2937' // Color del texto normal
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af' // Color del placeholder
  },
  footer: { paddingVertical: 8 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
});