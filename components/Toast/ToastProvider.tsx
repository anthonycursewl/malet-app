import TextMalet from '@/components/TextMalet/TextMalet';
import IconToastError from '@/svgs/toast/IconToastError';
import IconToastInfo from '@/svgs/toast/IconToastInfo';
import IconVerified from '@/svgs/common/IconVerified';
import { Toast, ToastType, useToastStore } from '@/shared/stores/useToastStore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Toast premium: tarjeta blanca con sombra suave, texto oscuro e iconos
 * custom por estado (check / equis / i) en su color semántico.
 */
const COLORS = {
  bg: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  text: '#111111',
  muted: 'rgba(0,0,0,0.35)',
  actionBg: '#f4f4f5',
  actionText: '#111111',
};

const ICON_COLORS: Record<ToastType, string> = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#111111',
  loading: '#111111',
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

/** Icono custom según el estado del toast. */
const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === 'loading') {
    return <ActivityIndicator size={15} color={ICON_COLORS.loading} />;
  }

  if (type === 'success') {
    return <IconVerified width={20} height={20} fill={ICON_COLORS.success} />;
  }

  if (type === 'error') {
    return <IconToastError width={20} height={20} fill={ICON_COLORS.error} />;
  }

  return <IconToastInfo width={20} height={20} fill={ICON_COLORS.info} />;
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-8));
  const [hidden, setHidden] = useState(false);

  // Entrada suave (fade + leve bajada).
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, toast.id]);

  // Auto-cierre (los toasts con acción esperan a que el usuario decida).
  useEffect(() => {
    if (!(toast.duration > 0) || toast.actionLabel) return;

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => onDismiss(toast.id));
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, toast.actionLabel, toast.id, opacity, onDismiss]);

  const handleDismiss = () => {
    if (hidden) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setHidden(true);
      onDismiss(toast.id);
    });
  };

  const handleAction = () => {
    toast.onAction?.();
  };

  if (hidden) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.iconWrap}>
        <ToastIcon type={toast.type} />
      </View>

      <TextMalet style={styles.message}>{parseRichText(toast.message)}</TextMalet>

      {toast.actionLabel && (
        <TouchableOpacity onPress={handleAction} style={styles.actionButton} activeOpacity={0.7}>
          <TextMalet style={styles.actionLabel}>{toast.actionLabel}</TextMalet>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton} activeOpacity={0.7}>
        <TextMalet style={styles.dismissLabel}>✕</TextMalet>
      </TouchableOpacity>
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
    zIndex: 9999,
    paddingTop: 8,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    backgroundColor: COLORS.bg,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Sombra suave: da profundidad sin el contraste del fondo negro.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.text,
    flexShrink: 1,
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.actionBg,
  },
  actionLabel: {
    fontSize: 12.5,
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
    color: COLORS.muted,
  },
});
