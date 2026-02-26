import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_HEIGHT_RATIO = 0.6;

interface ModalOptionsProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  gesturesEnabled?: boolean;
  isOnTop?: boolean;
  /** A value between 0 and 1 representing the fraction of the screen height, or a fixed pixel number (> 1). Default: 0.6 */
  heightRatio?: number;
}

export default function ModalOptions({
  visible,
  onClose,
  children,
  gesturesEnabled = true,
  isOnTop = false,
  heightRatio = DEFAULT_HEIGHT_RATIO,
}: ModalOptionsProps) {
  // Compute the resolved height once based on the prop.
  // If the value is <= 1 we treat it as a ratio, otherwise as fixed pixels.
  const modalHeight = useMemo(
    () => (heightRatio <= 1 ? SCREEN_HEIGHT * heightRatio : heightRatio),
    [heightRatio],
  );

  const [isModalRendered, setIsModalRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(modalHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Keep a ref so the PanResponder always reads the latest height without re-creating.
  const modalHeightRef = useRef(modalHeight);
  modalHeightRef.current = modalHeight;

  useEffect(() => {
    if (visible) {
      // Reset translateY to the current height before animating in
      translateY.setValue(modalHeightRef.current);
      setIsModalRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 5,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: modalHeightRef.current,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsModalRendered(false);
      });
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gesturesEnabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gesturesEnabled && gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 110) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
        }
      },
    })
  ).current;

  // Stable dynamic style – only recalculated when modalHeight changes
  const modalStyle = useMemo(
    () => ({
      ...styles.modal,
      height: modalHeight,
    }),
    [modalHeight],
  );

  if (!isModalRendered) {
    return null;
  }

  const animatedStyles = {
    modal: {
      transform: [{ translateY }],
    } as Animated.WithAnimatedObject<ViewStyle>,
    backdrop: {
      opacity,
    } as Animated.WithAnimatedObject<ViewStyle>,
  };

  const emptyHandlers = {};
  const panHandlers = gesturesEnabled ? panResponder.panHandlers : emptyHandlers;

  return (
    <Modal
      transparent
      statusBarTranslucent
      visible={isModalRendered}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, animatedStyles.backdrop, !isOnTop && { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[modalStyle, animatedStyles.modal]}
        >
          <View style={styles.header} {...panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: 40,
    height: 3,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});