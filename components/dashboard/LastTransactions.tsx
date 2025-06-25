import { TransactionItem } from "@/shared/entities/TransactionItem";
import IconWallet from "@/svgs/auth/IconWallet";
import { View } from "react-native";
import TextMalet from "../TextMalet/TextMalet";

export default function LastTransactions({ item }: { item: TransactionItem }) {
    const returnAmount = ({ item, amount }: { item: 'expense' | 'saving', amount: string }) => {
            if (item === 'expense') {
                return `-$${amount}`
            } else {
                return `+$${amount}`
            }
    }

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: 10,
            paddingVertical: 13,
            paddingHorizontal: 15,
            borderBottomWidth: 1,
            borderBottomColor: 'rgb(201, 200, 200)',
        }}>
            <View style={{ alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconWallet width={20} height={20} />
                    <TextMalet style={{ fontSize: 15 }}>
                        {item.name}
                    </TextMalet>
                </View>

                <TextMalet style={{ fontSize: 12, color: 'gray' }}>
                    {new Date(item.issued_at).toLocaleDateString()}
                </TextMalet>
            </View>

            <TextMalet style={{
                fontSize: 15,
                textAlign: 'right',
                color: item.type === 'expense' ? 'rgb(241, 71, 71)' : 'rgb(50, 201, 108)',
            }}>
                {returnAmount({ item: item.type, amount: item.amount })}
            </TextMalet>
        </View>
    )

}