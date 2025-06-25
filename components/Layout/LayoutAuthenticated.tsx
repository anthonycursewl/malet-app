import { SafeAreaView } from "react-native-safe-area-context";

export default function LayoutAuthenticated({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12
         }}>
            {children}
        </SafeAreaView>
    );
}