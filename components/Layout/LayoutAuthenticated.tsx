import { SafeAreaView } from "react-native";

export default function LayoutAuthenticated({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, 
            paddingTop: 42 }}>
            {children}
        </SafeAreaView>
    );
}