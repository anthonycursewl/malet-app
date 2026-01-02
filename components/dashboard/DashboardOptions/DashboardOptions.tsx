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
    return (
        <View style={styles.iconsContainer}>

            <TouchableOpacity onPress={() => router.push('/profile')}>
                <ContainerDash>
                    <IconAt width={18} height={18} />
                </ContainerDash>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/ai' as any)}>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <IconAI width={18} height={18} fill="#313131ff" />
                </ContainerDash>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/chat/' as any)}>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <IconNotes width={18} height={18} fill="#313131ff" />
                </ContainerDash>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/calculator' as any)}>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <IconBudget width={18} height={18} fill="#313131ff" />
                </ContainerDash>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/garzon' as any)}>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <IconGarzon width={18} height={18} fill="#313131ff" />
                </ContainerDash>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/garzon/wallet' as any)}>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <IconWalletGarzon width={18} height={18} fill="#313131ff" />
                </ContainerDash>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { }}>
                <ContainerDash style={{ marginLeft: 8 }}>
                    <IconWarning width={18} height={18} fill="#313131ff" />
                </ContainerDash>
            </TouchableOpacity>
        </View>
    )
}