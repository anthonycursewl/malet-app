import { StyleProp, View, ViewStyle } from "react-native";

export const ContainerDash = ({ children, style }: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) => {
    return (
        <View style={[
            {
                borderRadius: 12,
                backgroundColor: 'rgb(234, 234, 234)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 10,
            },
            style
        ]}>
            {children}
        </View>
    )
}