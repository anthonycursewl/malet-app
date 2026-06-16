import TextMalet from '@/components/TextMalet/TextMalet';
import { SharedAccount } from '@/shared/entities/SharedAccount';
import { ChevronRight, UserCheck } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';
import { styles } from './AccountCard.styles';

interface AccountCardProps {
    item: SharedAccount;
    onPress: (account: SharedAccount) => void;
}

export const AccountCard = ({ item, onPress }: AccountCardProps) => {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <UserCheck size={18} color="#131313" />
                </View>
                <View style={styles.textBlock}>
                    <TextMalet style={styles.cardTitle} numberOfLines={1}>{item.name}</TextMalet>
                    {item.account_id ? (
                        <TextMalet style={styles.cardSubtitle} numberOfLines={1}>{item.account_id}</TextMalet>
                    ) : null}
                </View>
                <ChevronRight size={16} color="#4a4a6a" />
            </View>
        </TouchableOpacity>
    );
};
