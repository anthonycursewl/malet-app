import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Italic,
    Link,
    List,
    ListChecks,
    Minus,
    Quote,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export type MarkdownAction =
    | 'h1'
    | 'h2'
    | 'bold'
    | 'italic'
    | 'bullet'
    | 'check'
    | 'quote'
    | 'codeblock'
    | 'link'
    | 'divider';

const ACTIONS: {
    action: MarkdownAction;
    Icon: typeof Bold;
    label: string;
}[] = [
    { action: 'h1', Icon: Heading1, label: 'Título 1' },
    { action: 'h2', Icon: Heading2, label: 'Título 2' },
    { action: 'bold', Icon: Bold, label: 'Negrita' },
    { action: 'italic', Icon: Italic, label: 'Cursiva' },
    { action: 'bullet', Icon: List, label: 'Lista' },
    { action: 'check', Icon: ListChecks, label: 'Checklist' },
    { action: 'quote', Icon: Quote, label: 'Cita' },
    { action: 'codeblock', Icon: Code, label: 'Código' },
    { action: 'link', Icon: Link, label: 'Enlace' },
    { action: 'divider', Icon: Minus, label: 'Divisor' },
];

/** Barra de formato Markdown que inserta sintaxis en el cursor/selección. */
export default function MarkdownToolbar({
    onAction,
}: {
    onAction: (action: MarkdownAction) => void;
}) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.row}
        >
            {ACTIONS.map(({ action, Icon, label }) => (
                <TouchableOpacity
                    key={action}
                    style={styles.button}
                    onPress={() => onAction(action)}
                    activeOpacity={0.7}
                    accessibilityLabel={label}
                >
                    <Icon size={16} color="#37352f" />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        gap: 6,
        paddingVertical: 4,
    },
    button: {
        width: 36,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#f7f6f3',
        borderWidth: 1,
        borderColor: '#e9e9e7',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
