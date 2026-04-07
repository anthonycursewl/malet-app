import { TransactionItem } from '@/shared/entities/TransactionItem';
import { useAccountStore } from '@/shared/stores/useAccountStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useTagStore } from '@/shared/stores/useTagStore';
import { useWalletStore } from '@/shared/stores/useWalletStore';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { SuccessData } from './SuccessScreen';
import { FormDataType, FormErrors } from './types';

export function useAddWalletForm() {
  const { type } = useGlobalSearchParams();
  const router = useRouter();

  // ─── Stores ──────────────────────────────────────────
  const { addTransaction, loading } = useWalletStore();
  const { user } = useAuthStore();
  const { accounts, getAllAccountsByUserId, updateBalanceInMemory, selectedAccount } = useAccountStore();
  const { tags: tagStoreTags, loadTags, addTag, deleteTag, loading: tagLoading } = useTagStore();

  // ─── State ───────────────────────────────────────────
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    amount: '',
    type: type as 'expense' | 'saving' | 'pending_payment',
    account_id: selectedAccount?.id || '',
    tag_ids: [],
  });

  // Tag creation state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4c6ef5');
  const [newTagPalette, setNewTagPalette] = useState<string[]>([]);

  // ─── Step transition animation ───────────────────────
  const transition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: step - 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const stepAnimations = {
    step1Opacity: transition.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 0, 0] }),
    step1TranslateY: transition.interpolate({ inputRange: [0, 1, 2], outputRange: [0, -40, -40] }),
    step2Opacity: transition.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
    step2TranslateY: transition.interpolate({ inputRange: [0, 1, 2], outputRange: [40, 0, -40] }),
    step3Opacity: transition.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0, 1] }),
    step3TranslateY: transition.interpolate({ inputRange: [0, 1, 2], outputRange: [80, 40, 0] }),
  };

  // ─── Derived values ──────────────────────────────────
  const currentType = showSuccess && successData ? successData.type : formData.type;
  const isExpense = formData.type === 'expense';
  const isSaving = formData.type === 'saving';

  const gradientColors: readonly [string, string, string] = currentType === 'expense'
    ? ['rgba(255, 107, 107, 0.15)', 'rgba(255, 77, 77, 0.06)', 'rgba(255, 255, 255, 0)']
    : currentType === 'saving'
      ? ['rgba(81, 207, 102, 0.15)', 'rgba(46, 154, 62, 0.06)', 'rgba(255, 255, 255, 0)']
      : ['rgba(245, 200, 66, 0.15)', 'rgba(245, 200, 66, 0.06)', 'rgba(255, 255, 255, 0)'];

  // ─── Handlers ────────────────────────────────────────
  const handleInputChange = useCallback((field: keyof Omit<TransactionItem, 'id' | 'issued_at'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Requerido';
    if (!formData.amount) newErrors.amount = 'Requerido';
    else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) newErrors.amount = 'Inválido';
    if (!formData.account_id) newErrors.account_id = 'Requerido';

    if ((formData.tag_ids ?? []).length > 10) {
      newErrors.tag_ids = 'Máximo 10 etiquetas permitidas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return false;

    const normalizedAmount = formData.amount.replace(/,/g, '.');
    const amount = parseFloat(normalizedAmount) || 0;

    if (amount <= 0) {
      setErrors(prev => ({ ...prev, amount: 'Monto inválido' }));
      return false;
    }

    const transactionData = {
      name: formData.name.trim(),
      amount: amount.toFixed(2),
      type: formData.type,
      account_id: formData.account_id,
      tag_ids: formData.tag_ids ?? [],
    };

    const transaction = await addTransaction(transactionData as any);

    if (transaction) {
      if (formData.type !== 'pending_payment') {
        updateBalanceInMemory(formData.account_id, amount, formData.type === 'expense' ? 'expense' : 'saving');
      }

      // Show success screen with details
      setSuccessData({
        name: formData.name.trim(),
        amount: amount.toFixed(2),
        type: formData.type,
        accountName: selectedAccount?.name || 'Cuenta',
        tagCount: (formData.tag_ids ?? []).length,
      });
      setShowSuccess(true);
      return true;
    }
    return false;
  }, [validateForm, formData, addTransaction, updateBalanceInMemory, selectedAccount]);

  const handleBack = useCallback(() => {
    if (showSuccess) {
      router.back();
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  }, [step, showSuccess, router]);

  const handleAddAnother = useCallback(() => {
    setShowSuccess(false);
    setSuccessData(null);
    setStep(1);
    setErrors({});
    setIsPending(false);
    setFormData({
      name: '',
      amount: '',
      type: (type as 'expense' | 'saving' | 'pending_payment') || 'expense',
      account_id: selectedAccount?.id || '',
      tag_ids: [],
    });
    setNewTagName('');
    setNewTagColor('#4c6ef5');
    setNewTagPalette([]);
    transition.setValue(0);
  }, [type, selectedAccount, transition]);

  const handleNextStep1 = useCallback(() => {
    if (!formData.amount || parseFloat(formData.amount.replace(',', '.')) <= 0) {
      setErrors(prev => ({ ...prev, amount: 'Ingresa un monto válido' }));
      return;
    }
    setStep(2);
  }, [formData.amount]);

  const handleNextStep2 = useCallback(() => {
    if (!formData.account_id) {
      setErrors(prev => ({ ...prev, account_id: 'Requerido' }));
      return;
    }
    setStep(3);
  }, [formData.account_id]);

  const handlePendingToggle = useCallback((val: boolean) => {
    setIsPending(val);
    setFormData(prev => ({ ...prev, type: val ? 'pending_payment' : 'expense' }));
  }, []);

  const handleTypeChange = useCallback((t: 'expense' | 'saving') => {
    setFormData(prev => ({ ...prev, type: t }));
  }, []);

  // ─── Tags ────────────────────────────────────────────
  const toggleTag = useCallback((id: string) => {
    setFormData(prev => {
      const exists = prev.tag_ids?.includes(id);

      if (!exists && (prev.tag_ids ?? []).length >= 10) {
        setErrors(err => ({ ...err, tag_ids: 'Máximo 10 etiquetas' }));
        return prev;
      }

      setErrors(err => ({ ...err, tag_ids: undefined }));
      const next = exists ? prev.tag_ids!.filter(t => t !== id) : [...(prev.tag_ids ?? []), id];
      return { ...prev, tag_ids: next };
    });
  }, []);

  const handleCreateTag = useCallback(async () => {
    let name = newTagName.trim().toLowerCase();
    if (!name) return;
    if (!name.startsWith('#')) name = '#' + name;

    try {
      if ((formData.tag_ids ?? []).length >= 10) {
        setErrors(err => ({ ...err, tag_ids: 'No se pueden agregar más de 10 etiquetas' }));
        setIsTagModalVisible(false);
        return;
      }

      const created = await addTag({ name, color: newTagColor, palette: newTagPalette.length > 0 ? newTagPalette : undefined });
      setNewTagName('');
      setNewTagPalette([]);
      setFormData(prev => ({ ...prev, tag_ids: [...(prev.tag_ids ?? []), created.id] }));
      setIsTagModalVisible(false);
    } catch (e) {
      console.log(`An error has occurred: ${e}`);
    }
  }, [newTagName, newTagColor, newTagPalette, addTag]);

  const handleDeleteTag = useCallback(async (id: string) => {
    await deleteTag(id);
    setErrors(err => ({ ...err, tag_ids: undefined }));
    setFormData(prev => ({ ...prev, tag_ids: (prev.tag_ids ?? []).filter(t => t !== id) }));
  }, [deleteTag]);

  const handleTogglePaletteColor = useCallback((color: string) => {
    setNewTagPalette(prev => {
      if (prev.includes(color)) return prev.filter(x => x !== color);
      if (prev.length < 4) return [...prev, color];
      return prev;
    });
  }, []);

  // ─── Effects ─────────────────────────────────────────
  useEffect(() => { loadTags(); }, []);
  useEffect(() => { if (accounts.length === 0) getAllAccountsByUserId(); }, [user.id]);
  useEffect(() => { if (selectedAccount) handleInputChange('account_id', selectedAccount.id); }, [selectedAccount]);

  // ─── Header title ────────────────────────────────────
  const headerTitle = step === 1 ? 'Monto y Tipo' : step === 2 ? 'Cuenta' : 'Detalles';

  return {
    // State
    step,
    formData,
    errors,
    isPending,
    loading,
    tagLoading,
    isModalVisible,
    isTagModalVisible,
    tagStoreTags,
    selectedAccount,
    newTagName,
    newTagColor,
    newTagPalette,
    showSuccess,
    successData,

    // Derived
    gradientColors,
    headerTitle,
    stepAnimations,

    // Setters
    setIsModalVisible,
    setIsTagModalVisible,
    setNewTagName,
    setNewTagColor,

    // Handlers
    handleInputChange,
    handleSubmit,
    handleBack,
    handleAddAnother,
    handleNextStep1,
    handleNextStep2,
    handlePendingToggle,
    handleTypeChange,
    toggleTag,
    handleCreateTag,
    handleDeleteTag,
    handleTogglePaletteColor,
  };
}
