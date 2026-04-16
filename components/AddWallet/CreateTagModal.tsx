import Button from '@/components/Button/Button';
import ModalOptions from '@/components/shared/ModalOptions';
import TextMalet from '@/components/TextMalet/TextMalet';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { tagModalStyles as styles, tagStyles } from './add.styles';
import { InputField } from './InputField';
import { TAG_COLOR_PALETTE, THEME } from './theme';

interface CreateTagModalProps {
  visible: boolean;
  onClose: () => void;
  newTagName: string;
  onChangeTagName: (val: string) => void;
  newTagColor: string;
  onChangeTagColor: (color: string) => void;
  newTagPalette: string[];
  onTogglePaletteColor: (color: string) => void;
  onCreateTag: () => void;
  tagLoading: boolean;
}

export const CreateTagModal = ({
  visible,
  onClose,
  newTagName,
  onChangeTagName,
  newTagColor,
  onChangeTagColor,
  newTagPalette,
  onTogglePaletteColor,
  onCreateTag,
  tagLoading,
}: CreateTagModalProps) => {
  const router = useRouter();


  const formatTagName = useCallback((name: string | null) => {
    if (!name) return 'ejemplo';
    if (name.startsWith('#')) {
      return name.slice(1);
    }
    return name;
  }, [newTagName]);

  return (
    <ModalOptions visible={visible} onClose={onClose} heightRatio={0.8}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TextMalet style={styles.title}>Nueva etiqueta</TextMalet>

        {/* Name */}
        <View style={styles.section}>
          <InputField
            label="Nombre"
            placeholder="Ej. Supermercado"
            value={newTagName}
            onChangeText={(v) => onChangeTagName(v)}
          />
        </View>

        {/* Main color */}
        <View style={styles.sectionCompact}>
          <TextMalet style={styles.sectionLabel}>COLOR PRINCIPAL</TextMalet>
          <View style={styles.colorRow}>
            {TAG_COLOR_PALETTE.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => onChangeTagColor(c)}
                style={[
                  tagStyles.colorSwatch,
                  {
                    backgroundColor: c,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    borderWidth: newTagColor === c ? 3 : 0,
                    borderColor: THEME.text,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                {newTagColor === c && <MaterialIcons name="check" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Palette */}
        <View style={styles.section}>
          <TextMalet style={styles.sectionLabelCompact}>PALETA ({newTagPalette.length}/4)</TextMalet>
          <TextMalet style={styles.sectionHint}>Hasta 4 colores adicionales</TextMalet>
          <View style={styles.colorRow}>
            {TAG_COLOR_PALETTE.map((c) => {
              const isInPalette = newTagPalette.includes(c);
              return (
                <TouchableOpacity
                  key={`p-${c}`}
                  onPress={() => onTogglePaletteColor(c)}
                  style={[
                    tagStyles.colorSwatch,
                    {
                      backgroundColor: c,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      opacity: !isInPalette && newTagPalette.length >= 4 ? 0.3 : 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                    isInPalette && {
                      borderWidth: 2,
                      borderColor: '#fff',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 4,
                    },
                  ]}
                >
                  {isInPalette && (
                    <View style={styles.paletteNumber}>
                      <TextMalet style={styles.paletteNumberText}>
                        {newTagPalette.indexOf(c) + 1}
                      </TextMalet>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <TextMalet style={styles.sectionLabel}>PREVIEW</TextMalet>
          <View style={styles.previewRow}>

            <View style={[styles.previewChip, { borderColor: '#e7e7e7ff' }]}>
              <TextMalet style={[styles.previewText, { color: newTagColor }]}>
                {newTagName.startsWith('#') ? '' : '#'}
                <TextMalet style={{ color: '#6b6b6bff' }}>{formatTagName(newTagName)}</TextMalet>
              </TextMalet>
            </View>

            {newTagPalette.length > 0 && (
              <View style={styles.paletteDots}>
                {newTagPalette.map((c, i) => (
                  <View key={i} style={[styles.paletteDot, { backgroundColor: c }]} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Create */}
        <View style={styles.submitSection}>
          <Button text="Crear y Seleccionar" onPress={onCreateTag} loading={tagLoading} />
        </View>

        <TouchableOpacity
          onPress={() => { onClose(); router.push('/tags/page'); }}
          style={styles.manageLink}
        >
          <TextMalet style={styles.manageLinkText}>Administrar etiquetas →</TextMalet>
        </TouchableOpacity>
      </ScrollView>
    </ModalOptions>
  );
};
