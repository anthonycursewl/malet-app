import { getCurrencyIcon } from "@/shared/services/currency/currencyService";
import { TransactionItem } from "@/shared/entities/TransactionItem";
import { colors, spacing } from "@/shared/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, TextStyle, TouchableOpacity, View } from "react-native";
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
    if (isPending) return `$${amount}`;
    return isExpense ? `-$${amount}` : `+$${amount}`;
  }, [isExpense, isPending]);

  const returnName = useCallback((name: string, cutSize: number = 24) => {
    return name.length > cutSize ? name.slice(0, cutSize) + '...' : name;
  }, []);

  const handlePress = useCallback(() => {
    router.push(`/transactions/page?transaction_id=${item.id}`);
  }, [item.id, router]);


  const currencyImg = useMemo(() => {
    return getCurrencyIcon(item.currency_code);
  }, [item.currency_code]);

  const formattedDate = useMemo(() => {
    return new Date(item.issued_at).toLocaleDateString();
  }, [item.issued_at]);

  const transactionName = useMemo(() => returnName(item.name), [item.name, returnName]);
  const amountText = useMemo(() => returnAmount(item.amount), [item.amount, returnAmount]);

  const renderTags = useMemo(() => {
    const tags = item.tags || [];
    if (tags.length === 0) return null;

    const maxVisibleTags = 1;
    const hasMore = tags.length > maxVisibleTags;
    const visibleTags = tags.slice(0, maxVisibleTags);
    const moreCount = tags.length - maxVisibleTags;

    return (
      <View style={styles.tagsContainer}>
        {visibleTags.map(tag => {
          const color = tag.color || '#999';
          return (
            <View key={tag.id} style={[styles.tagChip, { borderColor: '#ebebebff' }]}>
              <TextMalet style={[styles.tagText, { color }]}>
                {tag.name.charAt(0).toUpperCase()}
              </TextMalet>
              <TextMalet style={[styles.tagText, { color: '#494949ff' }]}>
                {tag.name.slice(1)}
              </TextMalet>
            </View>
          );
        })}

        {hasMore && (
          <View style={styles.moreCounter}>
            <TextMalet style={styles.moreCountText}>+{moreCount}</TextMalet>
          </View>
        )}
      </View >
    );
  }, [item.tags]);

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

            <View style={styles.currencyIconWrapper}>
              <Image
                source={{ uri: currencyImg }}
                style={styles.currencyIcon}
              />
            </View>

            {renderTags}
          </View>
        </View>

        <View style={styles.amountContainerWrapper}>
          <TextMalet style={[styles.amount, { color: amountColor }]}>
            {amountText}
          </TextMalet>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.amount === nextProps.item.amount &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.issued_at === nextProps.item.issued_at &&
    JSON.stringify(prevProps.item.tags) === JSON.stringify(nextProps.item.tags)
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
  amountContainerWrapper: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 70,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  currencyIconWrapper: {
    marginLeft: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e6e6e6ff',
    padding: 1
  },
  currencyIcon: {
    width: 15,
    height: 15,
  },
  moreCounter: {
    borderWidth: 1,
    borderColor: '#ebebebff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
  },
  moreCountText: {
    fontSize: 10,
    color: '#838383ff',
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  tagInitial: {
    fontWeight: '700',
  },
});