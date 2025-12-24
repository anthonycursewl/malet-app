import Button from "@/components/Button/Button";
import ModalAccounts from "@/components/Modals/ModalAccounts/ModalAccounts";
import TextMalet from "@/components/TextMalet/TextMalet";
import { TransactionItem } from "@/shared/entities/TransactionItem";
import { useAccountStore } from "@/shared/stores/useAccountStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useWalletStore } from "@/shared/stores/useWalletStore";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Geist / Vercel Design Tokens
const THEME = {
  bg: '#FFFFFF',
  surface: '#FAFAFA',
  border: '#EAEAEA',
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#888888',
  accent: '#000000',
  error: '#E00000',
  success: '#0070F3',
  // Transaction colors
  expense: '#FF6B6B',      // Soft red
  expenseBg: '#FFF5F5',    // Very soft red bg
  saving: '#51CF66',       // Soft green  
  savingBg: '#F0FFF4',     // Very soft green bg
};

interface FormErrors {
  name?: string;
  amount?: string;
  account_id?: string;
}

// 1. Header: Minimalist & Clean
const AnimatedHeader = memo(({ onBack, title }: { onBack: () => void; title: string }) => (
  <View style={styles.header}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <TextMalet style={styles.backIcon}>←</TextMalet>
    </TouchableOpacity>
    <TextMalet style={styles.headerTitle}>{title}</TextMalet>
    <View style={styles.headerRightPlaceholder} />
  </View>
));

// 2. Type Selector: Premium Pill Toggle
const TypeSelector = memo(({
  type,
  onTypeChange
}: {
  type: 'expense' | 'saving';
  onTypeChange: (type: 'expense' | 'saving') => void;
}) => {
  const animatedValue = useRef(new Animated.Value(type === 'expense' ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Bounce animation on change
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(animatedValue, {
      toValue: type === 'expense' ? 0 : 1,
      friction: 10,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [type]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 164],
  });

  return (
    <View style={styles.selectorContainer}>
      <Animated.View style={[styles.selectorTrack, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.selectorIndicator, { transform: [{ translateX }] }]} />
        <TouchableOpacity
          style={styles.selectorTab}
          onPress={() => onTypeChange('expense')}
          activeOpacity={1}
        >
          <TextMalet style={[styles.selectorText, type === 'expense' && styles.selectorTextActive]}>
            Egreso
          </TextMalet>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.selectorTab}
          onPress={() => onTypeChange('saving')}
          activeOpacity={1}
        >
          <TextMalet style={[styles.selectorText, type === 'saving' && styles.selectorTextActive]}>
            Ingreso
          </TextMalet>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// 3. Amount Input - With editable decimals
const AmountInput = memo(({
  amount,
  onChangeAmount,
  error
}: {
  amount: string;
  onChangeAmount: (value: string) => void;
  error?: string;
}) => {
  // Parse amount into integer and decimal parts
  const parseAmount = (val: string) => {
    if (!val) return { integer: '', decimal: '' };
    const normalized = val.replace(',', '.');
    const parts = normalized.split('.');
    return {
      integer: parts[0] || '',
      decimal: parts[1] || ''
    };
  };

  const { integer, decimal } = parseAmount(amount);

  const handleIntegerChange = (text: string) => {
    // Only allow numbers
    const cleanText = text.replace(/[^0-9]/g, '');
    const newAmount = decimal ? `${cleanText}.${decimal}` : cleanText;
    onChangeAmount(newAmount);
  };

  const handleDecimalChange = (text: string) => {
    // Only allow numbers, max 2 digits
    const cleanText = text.replace(/[^0-9]/g, '').slice(0, 2);
    const newAmount = integer ? `${integer}.${cleanText}` : `0.${cleanText}`;
    onChangeAmount(newAmount);
  };

  return (
    <View style={styles.amountContainer}>
      <TextMalet style={styles.labelSmall}>MONTO</TextMalet>
      <View style={styles.amountInputRow}>
        <TextMalet style={styles.currencySymbol}>$</TextMalet>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          value={integer}
          onChangeText={handleIntegerChange}
          placeholderTextColor="#D4D4D4"
          keyboardType="number-pad"
          maxLength={8}
          autoFocus={true}
          selectionColor={THEME.accent}
        />
        <TextMalet style={styles.decimalDot}>.</TextMalet>
        <TextInput
          style={styles.decimalInput}
          placeholder="00"
          value={decimal}
          onChangeText={handleDecimalChange}
          placeholderTextColor="#CCCCCC"
          keyboardType="number-pad"
          maxLength={2}
          selectionColor={THEME.accent}
        />
      </View>
      {error && <TextMalet style={styles.errorTextCenter}>{error}</TextMalet>}
    </View>
  );
});

// 4. Pending Toggle Component
const PendingToggle = memo(({
  isPending,
  onToggle
}: {
  isPending: boolean;
  onToggle: (value: boolean) => void;
}) => (
  <TouchableOpacity
    style={[styles.pendingContainer, isPending && styles.pendingActive]}
    onPress={() => onToggle(!isPending)}
    activeOpacity={0.7}
  >
    <View style={[styles.pendingCheckbox, isPending && styles.pendingCheckboxActive]}>
      {isPending && <TextMalet style={styles.pendingCheck}>✓</TextMalet>}
    </View>
    <View style={styles.pendingTextContainer}>
      <TextMalet style={[styles.pendingLabel, isPending && styles.pendingLabelActive]}>Marcar como pendiente</TextMalet>
      <TextMalet style={styles.pendingHint}>El pago aún no se ha realizado</TextMalet>
    </View>
  </TouchableOpacity>
));

const InputField = memo(({
  label,
  placeholder,
  value,
  onChangeText,
  onPress,
  error,
  editable = true,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  error?: string;
  editable?: boolean;
}) => {
  const content = (
    <View style={[
      styles.fieldContainer,
      error ? styles.fieldError : null,
      value ? styles.fieldActive : null
    ]}>
      <TextMalet style={styles.fieldLabel}>{label}</TextMalet>
      <View style={styles.fieldRow}>
        {onPress ? (
          <TextMalet style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
            {value || placeholder}
          </TextMalet>
        ) : (
          <TextInput
            style={styles.fieldInput}
            placeholder={placeholder}
            placeholderTextColor={THEME.textTertiary}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            selectionColor={THEME.accent}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.fieldWrapper}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      ) : content}
      {error && <TextMalet style={styles.errorText}>{error}</TextMalet>}
    </View>
  );
});

// --- Main Screen ---
export default function AddWallet() {
  const { type } = useGlobalSearchParams();
  const router = useRouter();

  // Stores
  const { addTransaction, loading } = useWalletStore();
  const { user } = useAuthStore();
  const { accounts, getAllAccountsByUserId, updateBalanceInMemory, selectedAccount } = useAccountStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState<Omit<TransactionItem, 'id' | 'issued_at'>>({
    name: '',
    amount: '',
    type: type as 'expense' | 'saving',
    account_id: selectedAccount?.id || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Handlers
  const handleInputChange = useCallback((field: keyof Omit<TransactionItem, 'id' | 'issued_at'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Requerido';
    if (!formData.amount) newErrors.amount = 'Requerido';
    else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) newErrors.amount = 'Inválido';
    if (!formData.account_id) newErrors.account_id = 'Requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    // Normalize amount: ensure it has proper decimal format
    const normalizedAmount = formData.amount.replace(/,/g, '.');
    const amount = parseFloat(normalizedAmount) || 0;

    // Ensure amount is valid
    if (amount <= 0) {
      setErrors(prev => ({ ...prev, amount: 'Monto inválido' }));
      return;
    }

    const transactionData = {
      name: formData.name.trim(),
      amount: amount.toFixed(2), // Always send with 2 decimal places
      type: formData.type,
      account_id: formData.account_id,
    };

    console.log('Sending transaction:', JSON.stringify(transactionData));

    const transaction = await addTransaction(transactionData);

    if (transaction) {
      updateBalanceInMemory(formData.account_id, amount, formData.type === 'expense' ? 'expense' : 'saving');
      router.back();
    }
  }, [validateForm, formData, addTransaction, updateBalanceInMemory, router]);

  // Effects
  useEffect(() => {
    if (accounts.length === 0) getAllAccountsByUserId();
  }, [user.id]);

  useEffect(() => {
    if (selectedAccount) handleInputChange('account_id', selectedAccount.id);
  }, [selectedAccount]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flexOne}>

        <AnimatedHeader onBack={() => router.back()} title="Nueva Transacción" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <TypeSelector
            type={formData.type}
            onTypeChange={(t) => setFormData(prev => ({ ...prev, type: t }))}
          />

          <AmountInput
            amount={formData.amount}
            onChangeAmount={(v) => handleInputChange('amount', v)}
            error={errors.amount}
          />

          <View style={styles.divider} />

          <View style={styles.formGroup}>
            <InputField
              label="Cuenta"
              placeholder="Seleccionar..."
              value={`${selectedAccount?.name} ${"*".repeat(4)} ${selectedAccount?.id.slice(selectedAccount.id.length - 4)}`}
              onPress={() => setIsModalVisible(true)}
              error={errors.account_id}
            />

            <InputField
              label="Descripción"
              placeholder="Ej. Supermercado"
              value={formData.name}
              onChangeText={(v) => handleInputChange('name', v)}
              error={errors.name}
            />

            <PendingToggle
              isPending={isPending}
              onToggle={setIsPending}
            />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Button
            text="Guardar Transacción"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>

        <ModalAccounts
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 24,
    marginHorizontal: 24,
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backIcon: {
    fontSize: 22,
    color: THEME.text,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
    letterSpacing: -0.2,
  },
  headerRightPlaceholder: {
    width: 40,
  },

  // 2. Type Selector - Premium Pill
  selectorContainer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  selectorTrack: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 4,
    width: 320,
    height: 48,
  },
  selectorIndicator: {
    position: 'absolute',
    width: 154,
    height: 40,
    backgroundColor: THEME.bg,
    borderRadius: 10,
    top: 4,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  selectorTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
    letterSpacing: 0.2,
  },
  selectorTextActive: {
    color: THEME.text,
    fontWeight: '600',
  },

  // 3. Amount - Minimalist
  amountContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textTertiary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '300',
    color: '#CCCCCC',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: '600',
    color: THEME.text,
    textAlign: 'right',
    padding: 0,
    letterSpacing: -1.5,
  },
  errorTextCenter: {
    color: THEME.error,
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
  },

  // 4. Fields
  formGroup: {
    paddingHorizontal: 24,
    gap: 16,
  },
  fieldWrapper: {
    marginBottom: 0,
  },
  fieldContainer: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  fieldActive: {
    borderColor: '#999',
  },
  fieldError: {
    borderColor: THEME.error,
  },
  fieldLabel: {
    fontSize: 10,
    color: THEME.textTertiary,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldInput: {
    fontSize: 15,
    color: THEME.text,
    flex: 1,
    padding: 0,
    height: 24,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.text,
  },
  fieldPlaceholder: {
    color: THEME.textTertiary,
    fontWeight: '400',
  },
  chevron: {
    fontSize: 12,
    color: THEME.textTertiary,
    opacity: 0.5,
  },
  errorText: {
    color: THEME.error,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Decimal styling
  decimalDot: {
    fontSize: 36,
    fontWeight: '300',
    color: '#CCCCCC',
  },
  decimalInput: {
    fontSize: 28,
    fontWeight: '400',
    color: '#999999',
    textAlign: 'left',
    padding: 0,
    minWidth: 30,
  },
  decimalPart: {
    fontSize: 28,
    fontWeight: '400',
    color: '#CCCCCC',
    marginLeft: 1,
  },

  // Pending toggle
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 1,
  },
  pendingActive: {
    backgroundColor: '#FFF9E6',
    borderColor: '#F5C842',
  },
  pendingCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: THEME.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCheckboxActive: {
    backgroundColor: '#F5C842',
    borderColor: '#F5C842',
  },
  pendingCheck: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -1,
  },
  pendingTextContainer: {
    flex: 1,
  },
  pendingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.text,
  },
  pendingLabelActive: {
    color: '#B8860B',
  },
  pendingHint: {
    fontSize: 11,
    color: THEME.textTertiary,
    marginTop: 2,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg,
  },
});