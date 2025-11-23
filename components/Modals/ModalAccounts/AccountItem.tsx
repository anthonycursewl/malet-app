import TextMalet from "@/components/TextMalet/TextMalet";
import { Account } from "@/shared/entities/Account";
import { colors, spacing } from "@/shared/theme";
import { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface AccountItemProps {
  account: Account;
  onPress: (account: Account) => void;
  isLast?: boolean;
}

export const AccountItem = memo(({ account, onPress, isLast }: AccountItemProps) => {
  const { name, balance } = account;
  
  return (
    <TouchableOpacity
      style={[styles.container, isLast && styles.noBorder]}
      onPress={() => onPress(account)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <TextMalet style={styles.iconText}>{name.charAt(0).toUpperCase()}</TextMalet>
        </View>

        <View style={styles.textContainer}>
          <TextMalet style={styles.name}>
            {name}
          </TextMalet>
          <TextMalet style={styles.balance}>
            ${balance.toFixed(2)}
          </TextMalet>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.common.malet,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  iconText: {
    color: colors.common.malet,
    fontWeight: 'bold',
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 2,
    fontWeight: '500',
  },
  balance: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});

export default AccountItem;
