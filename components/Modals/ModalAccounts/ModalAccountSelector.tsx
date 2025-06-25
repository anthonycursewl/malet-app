import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import IconAt from "@/svgs/dashboard/IconAt";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  selectedAccountId?: string;
  onSelectAccount: (account: Account) => void;
}

export default function AccountSelectorModal({
  visible,
  onClose,
  accounts,
  selectedAccountId,
  onSelectAccount,
}: Props) {
  const [isModalVisible, setIsModalVisible] = useState(visible);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 300,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  const renderAccountItem = ({ item }: { item: Account }) => {
    const isSelected = item.id === selectedAccountId;

    return (
      <TouchableOpacity
        style={[styles.accountItem, isSelected && styles.selectedAccountItem]}
        onPress={() => {
          onSelectAccount(item);
          onClose();
        }}
      >
        <TextMalet style={[
          styles.accountName, 
          isSelected ? styles.selectedAccountName : undefined
        ]}>
          {item.name}
        </TextMalet>
        {isSelected && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={isModalVisible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.modalContent,
                { 
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={{ alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'row', gap: 8,
                marginBottom: 25
               }}>
                <IconAt style={{ width: 20, height: 20 }}/>
                <TextMalet style={styles.modalTitle}>Seleccionar Cuenta</TextMalet>
              </View>

              <FlatList
                data={accounts}
                renderItem={renderAccountItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              />

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <TextMalet style={styles.closeButtonText}>Cerrar</TextMalet>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1f2937',
  },
  accountItem: {
    paddingVertical: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedAccountItem: {
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  accountName: {
    fontSize: 16,
    color: '#374151',
  },
  selectedAccountName: {
    color: '#4f46e5',
    fontWeight: 'bold',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  checkMark: {
    fontSize: 18,
    color: '#4f46e5',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});