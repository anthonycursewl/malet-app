import Button from "@/components/Button/Button";
import ModalOptions from "@/components/shared/ModalOptions";
import TextMalet from "@/components/TextMalet/TextMalet";
import { TransactionTag } from "@/shared/entities/TagItem";
import { useTagStore } from "@/shared/stores/useTagStore";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLOR_PALETTE = [
  '#ff6b6b', '#51cf66', '#4c6ef5', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#ef4444',
  '#a855f7', '#22c55e', '#3b82f6', '#eab308', '#f43f5e',
];

const MAX_PALETTE_SIZE = 4;

export default function TagsPage() {
  const router = useRouter();
  const { tags, loading, loadTags, addTag, updateTag, deleteTag } = useTagStore();

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TransactionTag | null>(null);

  // Create form
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#4c6ef5');
  const [newTagPalette, setNewTagPalette] = useState<string[]>([]);

  // Edit form
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('#4c6ef5');
  const [editTagPalette, setEditTagPalette] = useState<string[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

  const togglePaletteColor = (color: string, palette: string[], setPalette: (p: string[]) => void) => {
    if (palette.includes(color)) {
      setPalette(palette.filter(c => c !== color));
    } else if (palette.length < MAX_PALETTE_SIZE) {
      setPalette([...palette, color]);
    }
  };

  const handleCreate = useCallback(async () => {
    let name = newTagName.trim().toLowerCase();
    if (!name) return;
    if (!name.startsWith('#')) name = '#' + name;

    try {
      await addTag({
        name,
        color: newTagColor,
        palette: newTagPalette.length > 0 ? newTagPalette : undefined,
      });
      setNewTagName('');
      setNewTagColor('#4c6ef5');
      setNewTagPalette([]);
      setIsCreateModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear la etiqueta');
    }
  }, [newTagName, newTagColor, newTagPalette, addTag]);

  const handleEdit = useCallback(async () => {
    if (!editingTag) return;
    let name = editTagName.trim().toLowerCase();
    if (!name) return;
    if (!name.startsWith('#')) name = '#' + name;

    await updateTag(editingTag.id, {
      name,
      color: editTagColor,
      palette: editTagPalette,
    });
    setIsEditModalVisible(false);
    setEditingTag(null);
  }, [editingTag, editTagName, editTagColor, editTagPalette, updateTag]);

  const handleDelete = useCallback((tag: TransactionTag) => {
    Alert.alert(
      'Eliminar Etiqueta',
      `¿Seguro que quieres eliminar "${tag.name}"? Se removerá de todas las transacciones asociadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => { await deleteTag(tag.id); },
        },
      ]
    );
  }, [deleteTag]);

  const openEdit = useCallback((tag: TransactionTag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || '#4c6ef5');
    setEditTagPalette(tag.palette || []);
    setIsEditModalVisible(true);
  }, []);

  const renderPaletteDots = (palette?: string[]) => {
    if (!palette || palette.length === 0) return null;
    return (
      <View style={styles.paletteDots}>
        {palette.map((c, i) => (
          <View key={i} style={[styles.paletteDotSmall, { backgroundColor: c }]} />
        ))}
      </View>
    );
  };

  const renderTag = useCallback(({ item }: { item: TransactionTag }) => {
    const displayName = item.name.startsWith('#') ? item.name.toLowerCase() : '#' + item.name.toLowerCase();
    return (
      <View style={styles.tagRow}>
        <View style={styles.tagInfo}>
          <View style={[styles.tagColorDot, { backgroundColor: item.color || '#999' }]} />
          <View style={{ flex: 1 }}>
            <TextMalet style={styles.tagName}>{displayName}</TextMalet>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <TextMalet style={styles.tagSlug}>{item.slug}</TextMalet>
              {renderPaletteDots(item.palette)}
            </View>
          </View>
        </View>
        <View style={styles.tagActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <MaterialIcons name="edit" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [openEdit, handleDelete]);

  const renderColorPicker = (
    selected: string,
    onSelect: (c: string) => void,
    palette: string[],
    onTogglePalette: (c: string) => void,
  ) => (
    <View>
      <TextMalet style={styles.modalSubLabel}>Color principal</TextMalet>
      <View style={styles.colorGrid}>
        {COLOR_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onSelect(c)}
            style={[
              styles.colorOption,
              { backgroundColor: c },
              selected === c && styles.colorOptionSelected,
            ]}
          >
            {selected === c && <MaterialIcons name="check" size={16} color="#fff" />}
          </TouchableOpacity>
        ))}
      </View>

      <TextMalet style={[styles.modalSubLabel, { marginTop: 16 }]}>
        Paleta ({palette.length}/{MAX_PALETTE_SIZE})
      </TextMalet>
      <TextMalet style={styles.paletteHint}>
        Selecciona hasta {MAX_PALETTE_SIZE} colores adicionales para tu etiqueta
      </TextMalet>
      <View style={styles.colorGrid}>
        {COLOR_PALETTE.map((c) => {
          const isInPalette = palette.includes(c);
          return (
            <TouchableOpacity
              key={`p-${c}`}
              onPress={() => onTogglePalette(c)}
              style={[
                styles.colorOption,
                { backgroundColor: c, opacity: (!isInPalette && palette.length >= MAX_PALETTE_SIZE) ? 0.3 : 1 },
                isInPalette && styles.colorOptionPalette,
              ]}
            >
              {isInPalette && (
                <View style={styles.paletteIndex}>
                  <TextMalet style={styles.paletteIndexText}>{palette.indexOf(c) + 1}</TextMalet>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTagFormModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    tagName: string,
    setTagName: (v: string) => void,
    tagColor: string,
    setTagColor: (v: string) => void,
    tagPalette: string[],
    setTagPalette: (v: string[]) => void,
    onSubmit: () => void,
    submitLabel: string,
  ) => (
    <ModalOptions visible={visible} onClose={onClose} heightRatio={0.85}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16 }}>
        <View style={styles.modalContent}>
          <TextMalet style={styles.modalTitle}>{title}</TextMalet>

          <View style={styles.modalField}>
            <TextMalet style={styles.modalLabel}>NOMBRE</TextMalet>
            <TextInput
              autoCapitalize="none"
              autoFocus
              placeholder="#nueva_etiqueta"
              value={tagName}
              onChangeText={(v) => setTagName(v.toLowerCase())}
              style={styles.modalInput}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.modalField}>
            <TextMalet style={styles.modalLabel}>COLORES</TextMalet>
            {renderColorPicker(
              tagColor,
              setTagColor,
              tagPalette,
              (c) => togglePaletteColor(c, tagPalette, setTagPalette),
            )}
          </View>

          {/* Preview */}
          <View style={styles.previewRow}>
            <TextMalet style={styles.modalLabel}>PREVIEW</TextMalet>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.previewChip, { backgroundColor: tagColor + '20', borderColor: tagColor }]}>
                <TextMalet style={{ color: tagColor, fontWeight: '600', fontSize: 13 }}>
                  {tagName.startsWith('#') ? tagName : '#' + (tagName || 'ejemplo')}
                </TextMalet>
              </View>
              {tagPalette.length > 0 && (
                <View style={styles.paletteDots}>
                  {tagPalette.map((c, i) => (
                    <View key={i} style={[styles.paletteDotSmall, { backgroundColor: c }]} />
                  ))}
                </View>
              )}
            </View>
          </View>

          <Button text={submitLabel} onPress={onSubmit} loading={loading} />
        </View>
      </ScrollView>
    </ModalOptions>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TextMalet style={styles.headerTitle}>Etiquetas</TextMalet>
          <TouchableOpacity onPress={() => setIsCreateModalVisible(true)} style={styles.addBtn}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TextMalet style={styles.subtitle}>
          Organiza tus transacciones con etiquetas y paletas de color
        </TextMalet>

        {/* Count row */}
        <View style={styles.countRow}>
          <TextMalet style={styles.countText}>{tags.length} etiqueta{tags.length !== 1 ? 's' : ''}</TextMalet>
          <TouchableOpacity onPress={() => loadTags()} disabled={loading}>
            <MaterialIcons name="refresh" size={20} color={loading ? '#ccc' : '#64748b'} />
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading && tags.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : tags.length === 0 ? (
          <View style={styles.centered}>
            <MaterialIcons name="label-off" size={64} color="#e2e8f0" />
            <TextMalet style={styles.emptyTitle}>Sin etiquetas</TextMalet>
            <TextMalet style={styles.emptyText}>
              Crea tu primera etiqueta para organizar tus transacciones
            </TextMalet>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setIsCreateModalVisible(true)}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <TextMalet style={styles.emptyBtnText}>Crear Etiqueta</TextMalet>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tags}
            renderItem={renderTag}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Create Modal */}
        {renderTagFormModal(
          isCreateModalVisible,
          () => setIsCreateModalVisible(false),
          'Crear Etiqueta',
          newTagName, setNewTagName,
          newTagColor, setNewTagColor,
          newTagPalette, setNewTagPalette,
          handleCreate,
          'Crear Etiqueta',
        )}

        {/* Edit Modal */}
        {renderTagFormModal(
          isEditModalVisible,
          () => { setIsEditModalVisible(false); setEditingTag(null); },
          'Editar Etiqueta',
          editTagName, setEditTagName,
          editTagColor, setEditTagColor,
          editTagPalette, setEditTagPalette,
          handleEdit,
          'Guardar Cambios',
        )}

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  tagColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  tagSlug: {
    fontSize: 12,
    color: '#94a3b8',
  },
  paletteDots: {
    flexDirection: 'row',
    gap: 3,
  },
  paletteDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Modal
  modalContent: {
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  modalField: {
    gap: 8,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  colorOptionPalette: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  paletteHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  paletteIndex: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteIndexText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  previewRow: {
    gap: 8,
  },
  previewChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
});
