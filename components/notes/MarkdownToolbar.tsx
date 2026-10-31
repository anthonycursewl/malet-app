import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Italic,
    Link,
    Link2,
    List,
    ListChecks,
    Minus,
    Quote,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
    | 'wikilink'
    | 'divider';

interface ToolAction {
    action: MarkdownAction;
    Icon: typeof Bold;
    label: string;
}

/** Grupos separados por una línea fina, como la barra de Notion. */
const GROUPS: ToolAction[][] = [
    [
        { action: 'h1', Icon: Heading1, label: 'Título 1' },
        { action: 'h2', Icon: Heading2, label: 'Título 2' },
    ],
    [
        { action: 'bold', Icon: Bold, label: 'Negrita' },
        { action: 'italic', Icon: Italic, label: 'Cursiva' },
    ],
    [
        { action: 'bullet', Icon: List, label: 'Lista' },
        { action: 'check', Icon: ListChecks, label: 'Checklist' },
        { action: 'quote', Icon: Quote, label: 'Cita' },
    ],
    [
        { action: 'codeblock', Icon: Code, label: 'Código' },
        { action: 'link', Icon: Link, label: 'Enlace web' },
        { action: 'wikilink', Icon: Link2, label: 'Enlazar nota' },
        { action: 'divider', Icon: Minus, label: 'Divisor' },
    ],
];

/**
 * Barra minimalista de formato: iconos sin cajas, agrupados y fija en la parte
 * inferior (se mantiene sobre el teclado).
 */
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
            {GROUPS.map((group, groupIndex) => (
                <View key={group[0].action} style={styles.group}>
                    {group.map(({ action, Icon, label }) => (
                        <TouchableOpacity
                            key={action}
                            style={styles.button}
                            onPress={() => onAction(action)}
                            activeOpacity={0.5}
                            accessibilityLabel={label}
                        >
                            <Icon size={17} color="#5f5e5b" strokeWidth={1.8} />
                        </TouchableOpacity>
                    ))}
                    {groupIndex < GROUPS.length - 1 && <View style={styles.separator} />}
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingRight: 2,
    },
    group: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    button: {
        width: 32,
        height: 32,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        width: 1,
        height: 15,
        backgroundColor: '#e9e9e7',
        marginHorizontal: 4,
    },
});
