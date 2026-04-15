import Button from '@/components/Button/Button';
import ModalAccounts from '@/components/Modals/ModalAccounts/ModalAccounts';
import TextMalet from '@/components/TextMalet/TextMalet';
import { getCurrencyIcon } from "@/shared/services/currency/currencyService";
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Animated, FlatList, Image, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AmountInput,
  AnimatedHeader,
  CreateTagModal,
  InputField,
  PendingToggle,
  SuccessScreen,
  SwipeButton,
  TypeSelector,
  amountStyles,
  fieldStyles,
  footerStyles,
  layoutStyles,
  tagStyles,
  useAddWalletForm,
} from '@/components/AddWallet';
import { usePreferencesStore } from '@/shared/stores/usePreferencesStore';
import SoundManager from '@/utils/soundManager';

export default function AddWallet() {
  const {
    step, formData, errors, isPending, loading, tagLoading, isModalVisible, isTagModalVisible,
    tagStoreTags, selectedAccount, newTagName, newTagColor, newTagPalette,
    showSuccess, successData,
    gradientColors, headerTitle, stepAnimations,
    setIsModalVisible, setIsTagModalVisible, setNewTagName, setNewTagColor, handleInputChange, handleSubmit, handleBack, handleAddAnother,
    handleNextStep1, handleNextStep2, handlePendingToggle, handleTypeChange, toggleTag, handleCreateTag, handleDeleteTag, handleTogglePaletteColor,
  } = useAddWalletForm();

  useEffect(() => {
    usePreferencesStore.getState().load().catch(() => { });
    SoundManager.preloadSounds({
      click: '',
      delete: '',
      confirm: '',
    }).catch(() => { });
    return () => { SoundManager.unloadAllSounds().catch(() => { }); };
  }, []);

  const {
    step1Opacity, step1TranslateY,
    step2Opacity, step2TranslateY,
    step3Opacity, step3TranslateY,
  } = stepAnimations;

  return (
    <View style={layoutStyles.container}>
      <StatusBar translucent backgroundColor="transparent" />

      <LinearGradient
        colors={gradientColors}
        style={layoutStyles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={layoutStyles.safeArea} edges={['top', 'left', 'right']}>
        {showSuccess && successData ? (
          <SuccessScreen data={successData} onAddAnother={handleAddAnother} />
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={layoutStyles.flexOne}>

            <AnimatedHeader onBack={handleBack} title={headerTitle} />

            <View style={[layoutStyles.scrollContent, { marginTop: step === 1 ? 40 : 10 }]}>

              {/* ── Step 1: Monto ─────────────────────────── */}
              <Animated.View style={{ opacity: step1Opacity, transform: [{ translateY: step1TranslateY }], display: step === 1 ? 'flex' : 'none', paddingHorizontal: 20 }}>
                <AmountInput amount={formData.amount} onChangeAmount={(v) => handleInputChange('amount', v)} error={errors.amount} />
                <View style={{ marginTop: 24 }}>
                  <TypeSelector type={formData.type} onTypeChange={handleTypeChange} />
                </View>
              </Animated.View>
              {step === 1 && (
                <View style={[footerStyles.centerChip, { marginTop: 30 }]}>
                  <Button text="Siguiente" onPress={handleNextStep1} loading={false} style={footerStyles.chipButton} labelStyle={footerStyles.chipLabel} />
                </View>
              )}

              {/* ── Step 2: Cuenta ────────────────────────── */}
              <Animated.View style={{ opacity: step2Opacity, transform: [{ translateY: step2TranslateY }], display: step === 2 ? 'flex' : 'none' }}>
                <View style={fieldStyles.formGroup}>
                  <InputField
                    label="Cuenta"
                    placeholder="Seleccionar..."
                    value={selectedAccount ? `${selectedAccount.name} • ****${selectedAccount.id.slice(-4)}` : ''}
                    onPress={() => setIsModalVisible(true)}
                    error={errors.account_id}
                    icon={selectedAccount ? (
                      <Image
                        source={{ uri: getCurrencyIcon(selectedAccount.currency) }}
                        style={{ width: 18, height: 18, borderRadius: 4 }}
                      />
                    ) : null}
                  />
                </View>
              </Animated.View>
              {step === 2 && (
                <View style={[footerStyles.centerChip, { marginTop: 30 }]}>
                  <Button text="Siguiente" onPress={handleNextStep2} loading={false} style={footerStyles.chipButton} labelStyle={footerStyles.chipLabel} />
                </View>
              )}

              {/* ── Step 3: Detalles ──────────────────────── */}
              <Animated.View style={{ opacity: step3Opacity, transform: [{ translateY: step3TranslateY }], display: step === 3 ? 'flex' : 'none' }}>
                <View style={fieldStyles.formGroup}>
                  <InputField
                    label="Descripción"
                    placeholder="Ej. Supermercado"
                    value={formData.name}
                    onChangeText={(v) => handleInputChange('name', v)}
                    error={errors.name}
                  />
                  <PendingToggle isPending={isPending} onToggle={handlePendingToggle} />
                </View>

                {/* Tags */}
                <View style={{ marginTop: 10 }}>
                  <TextMalet style={[amountStyles.labelSmall, { marginLeft: 24, marginBottom: 8 }]}>ETIQUETAS</TextMalet>
                  <View style={tagStyles.tagsRow}>
                    <FlatList
                      data={tagStoreTags}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingLeft: 24, paddingRight: 8 }}
                      style={{ flex: 1 }}
                      ListEmptyComponent={<TextMalet style={{ color: '#94a3b8', fontSize: 13, paddingVertical: 4 }}>Sin etiquetas aún</TextMalet>}
                      renderItem={({ item: t }) => {
                        const displayName = t.name.startsWith('#') ? t.name.toLowerCase() : '#' + t.name.toLowerCase();
                        return (
                          <TouchableOpacity
                            onPress={() => toggleTag(t.id)}
                            onLongPress={() => handleDeleteTag(t.id)}
                            style={[tagStyles.tagChip, (formData.tag_ids ?? []).includes(t.id) && { backgroundColor: (t.color || '#999') + '20', borderColor: t.color || '#999' }, { marginRight: 0 }]}
                          >
                            <TextMalet style={{ color: t.color || '#999' }}>{displayName.charAt(0).toUpperCase()}</TextMalet>
                            <TextMalet style={tagStyles.tagChipText}>{displayName.charAt(1) + displayName.slice(2)}</TextMalet>
                          </TouchableOpacity>
                        );
                      }}
                      keyExtractor={(item) => item.id}
                    />
                    <TouchableOpacity
                      onPress={() => setIsTagModalVisible(true)}
                      style={[tagStyles.tagChip, { borderWidth: 1, borderColor: '#e9e9e9', paddingHorizontal: 10, marginRight: 15, marginLeft: 8 }]}
                    >
                      <MaterialIcons name="add" size={18} color="#818181" />
                    </TouchableOpacity>
                  </View>
                  {errors.tag_ids && (
                    <TextMalet style={[fieldStyles.errorText, { marginLeft: 24, marginTop: 4 }]}>
                      {errors.tag_ids}
                    </TextMalet>
                  )}
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 40, marginBottom: 40 }}>
                  <SwipeButton onSwipeComplete={handleSubmit} loading={loading} />
                </View>
              </Animated.View>
            </View>

            {/* ── Modals ──────────────────────────────────── */}
            <CreateTagModal
              visible={isTagModalVisible}
              onClose={() => setIsTagModalVisible(false)}
              newTagName={newTagName}
              onChangeTagName={setNewTagName}
              newTagColor={newTagColor}
              onChangeTagColor={setNewTagColor}
              newTagPalette={newTagPalette}
              onTogglePaletteColor={handleTogglePaletteColor}
              onCreateTag={handleCreateTag}
              tagLoading={tagLoading}
            />

            <ModalAccounts visible={isModalVisible} onClose={() => setIsModalVisible(false)} />

          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}
