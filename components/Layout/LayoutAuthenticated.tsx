import { SafeAreaView } from "react-native-safe-area-context";

/** Padding horizontal del layout: lo usan las cabeceras a sangre para compensarlo. */
export const LAYOUT_HORIZONTAL_PADDING = 14;

/** Padding superior del layout: las cabeceras a sangre lo compensan junto al inset. */
export const LAYOUT_TOP_PADDING = 2;

export default function LayoutAuthenticated({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: '#fff',
                paddingHorizontal: LAYOUT_HORIZONTAL_PADDING,
                paddingTop: LAYOUT_TOP_PADDING,
            }}
        >
            {children}
        </SafeAreaView>
    );
}
