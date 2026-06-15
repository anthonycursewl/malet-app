import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { Toast, useToastStore } from '@/shared/stores/useToastStore';

const COLORS = {
  bg: '#2a2a2a',
  text: '#ffffff',
  icon: '#ffffff',
  actionText: '#8affb8',
};

const TYPE_ICONS: Record<string, string> = {
  success: '\u2713',
  error: '\u2715',
  info: '\u2139',
  loading: '',
};

const parseRichText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <TextMalet key={i} style={{ fontWeight: '700', color: COLORS.text }}>{part.slice(2, -2)}</TextMalet>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <TextMalet key={i} style={{ color: COLORS.text, fontWeight: '600' }}>{part.slice(1, -1)}</TextMalet>;
    }
    return <TextMalet key={i} style={{ color: COLORS.text }}>{part}</TextMalet>;
  });
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const isExiting = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  useEffect(() => {
    if (toast.duration > 0 && !toast.actionLabel) {
      const timer = setTimeout(() => handleDismiss(), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.actionLabel]);

  const handleDismiss = () => {
    if (isExiting.current) return;
    isExiting.current = true;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(toast.id));
  };

  const handleAction = () => {
    toast.onAction?.();
  };

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <View style={styles.toast}>
        {toast.type === 'loading' ? (
          <ActivityIndicator size={14} color={COLORS.icon} />
        ) : (
          <View style={styles.iconWrap}>
            <TextMalet style={styles.icon}>{TYPE_ICONS[toast.type]}</TextMalet>
          </View>
        )}
        <TextMalet style={styles.message}>
          {parseRichText(toast.message)}
        </TextMalet>
        {toast.actionLabel && (
          <TouchableOpacity onPress={handleAction} style={styles.actionButton} activeOpacity={0.7}>
            <TextMalet style={styles.actionLabel}>{toast.actionLabel}</TextMalet>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton} activeOpacity={0.7}>
          <TextMalet style={styles.dismissLabel}>✕</TextMalet>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastProvider = () => {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.container}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={remove} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.bg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 13,
    color: COLORS.icon,
    lineHeight: 16,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
    flexShrink: 1,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.actionText,
  },
  dismissButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  dismissLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
