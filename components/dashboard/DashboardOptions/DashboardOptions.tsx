import IconWarning from "@/svgs/common/IconWarning"
import IconAI from "@/svgs/dashboard/IconAI"
import IconAt from "@/svgs/dashboard/IconAt"
import IconBudget from "@/svgs/dashboard/IconBudget"
import IconGarzon from "@/svgs/dashboard/IconGarzon"
import IconNotes from "@/svgs/dashboard/IconNotes"
import IconWalletGarzon from "@/svgs/dashboard/IconWalletGarzon"
import { router } from "expo-router"
import { TouchableOpacity, View } from "react-native"
import { ContainerDash } from "../ContainerDash"

export const DashboardOptions = ({ styles }: { styles: any }) => {

    const current_options = [
        {
            icon: <IconAt width={18} height={18} />,
            onPress: () => router.push('/profile')
        },
        {
            icon: <IconAI width={18} height={18} fill="#313131ff" />,
            onPress: () => router.push('/ai' as any)
        },
        {
            icon: <IconNotes width={18} height={18} fill="#313131ff" />,
            onPress: () => router.push('/chat/' as any)
        },
        {
            icon: <IconBudget width={18} height={18} fill="#313131ff" />,
            onPress: () => router.push('/calculator' as any)
        },
        {
            icon: <IconGarzon width={18} height={18} fill="#313131ff" />,
            onPress: () => router.push('/garzon' as any)
        },
        {
            icon: <IconWalletGarzon width={18} height={18} fill="#313131ff" />,
            onPress: () => router.push('/garzon/wallet' as any)
        },
        {
            icon: <IconWarning width={18} height={18} fill="#313131ff" />,
            onPress: () => { }
        }
    ]


    return (
        <View style={styles.iconsContainer}>
            {current_options.map((option, index) => (
                <TouchableOpacity key={index} onPress={option.onPress}>
                    <ContainerDash style={index === 0 ? {} : { marginLeft: 8 }}>
                        {option.icon}
                    </ContainerDash>
                </TouchableOpacity>
            ))}
        </View>
    )
}