import { TransactionItem } from "@/shared/entities/TransactionItem";
import { colors, spacing } from "@/shared/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { StyleSheet, TextStyle, TouchableOpacity, View } from "react-native";
import TextMalet from "../TextMalet/TextMalet";

interface LastTransactionsProps {
  item: TransactionItem;
}

const TransactionIcon = memo(({ type }: { type: 'expense' | 'saving' | 'pending_payment' }) => {
  let iconName: keyof typeof MaterialIcons.glyphMap;
  let iconColor: string;

  if (type === 'expense') {
    iconName = 'arrow-upward';
    iconColor = colors.error.main;
  } else if (type === 'saving') {
    iconName = 'arrow-downward';
    iconColor = colors.success.main;
  } else {
    iconName = 'schedule';
    iconColor = '#F5C842'; // Attention/Warning color for pending
  }

  return (
    <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
      <MaterialIcons
        name={iconName}
        size={18}
        color={iconColor}
      />
    </View>
  );
});

const LastTransactions = memo(({ item }: LastTransactionsProps) => {
  const router = useRouter();
  const isExpense = item.type === 'expense';
  const isPending = item.type === 'pending_payment';

  let amountColor = colors.success.main;
  if (isExpense) amountColor = colors.error.main;
  if (isPending) amountColor = '#F5C842';

  const returnAmount = useCallback((amount: string) => {
    if (isPending) return `Pendiente $${amount}`;
    return isExpense ? `-$${amount}` : `+$${amount}`;
  }, [isExpense, isPending]);

  const returnName = useCallback((name: string, cutSize: number = 24) => {
    return name.length > cutSize ? name.slice(0, cutSize) + '...' : name;
  }, []);

  const handlePress = useCallback(() => {
    router.push(`/transactions/page?transaction_id=${item.id}`);
  }, [item.id, router]);

  const formattedDate = useMemo(() => {
    return new Date(item.issued_at).toLocaleDateString();
  }, [item.issued_at]);

  const transactionName = useMemo(() => returnName(item.name), [item.name, returnName]);
  const amountText = useMemo(() => returnAmount(item.amount), [item.amount, returnAmount]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <TransactionIcon type={item.type} />

        <View style={styles.details}>
          <TextMalet
            style={styles.transactionName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {transactionName}
          </TextMalet>

          <View style={styles.metaContainer}>
            <TextMalet style={styles.dateText}>
              {formattedDate}
            </TextMalet>
          </View>
        </View>

        <TextMalet style={[styles.amount, { color: amountColor }]}>
          {amountText}
        </TextMalet>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.amount === nextProps.item.amount &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.issued_at === nextProps.item.issued_at
  );
});

export default LastTransactions;

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.medium / 2,
    paddingHorizontal: spacing.medium / 2,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 254, 254, 1)',
    marginBottom: spacing.medium / 2,
    borderWidth: 1,
    borderColor: 'rgba(207, 207, 207, 1)',
    borderStyle: 'dashed',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  details: {
    flex: 1,
    marginRight: spacing.small,
    minWidth: 0,
  },
  transactionName: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500' as const,
    color: colors.text.primary,
    flexShrink: 1,
  } as TextStyle,
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  } as TextStyle,
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.secondary,
    marginHorizontal: 6,
    opacity: 0.6,
  },
  amount: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  } as TextStyle,
});