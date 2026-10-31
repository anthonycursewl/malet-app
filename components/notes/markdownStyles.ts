import { Platform, StyleSheet } from 'react-native';

const MONO = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
});

/**
 * Estilo de lectura tipo Notion: tipografía amplia, poco ruido visual y
 * superficies suaves para código/tablas. Las claves coinciden con
 * `react-native-markdown-display`.
 */
export const markdownStyles = StyleSheet.create({
    body: {
        color: '#37352f',
        fontSize: 15,
        lineHeight: 24,
    },
    heading1: {
        color: '#1f1f1f',
        fontSize: 26,
        lineHeight: 33,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginTop: 18,
        marginBottom: 8,
    },
    heading2: {
        color: '#1f1f1f',
        fontSize: 21,
        lineHeight: 28,
        fontWeight: '700',
        letterSpacing: -0.3,
        marginTop: 16,
        marginBottom: 6,
    },
    heading3: {
        color: '#1f1f1f',
        fontSize: 18,
        lineHeight: 25,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 5,
    },
    heading4: {
        color: '#1f1f1f',
        fontSize: 16,
        lineHeight: 23,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
    },
    heading5: {
        color: '#37352f',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '700',
        marginTop: 10,
        marginBottom: 4,
    },
    heading6: {
        color: '#6b6b6b',
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginTop: 10,
        marginBottom: 4,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 10,
    },
    strong: {
        fontWeight: '700',
        color: '#1f1f1f',
    },
    em: {
        fontStyle: 'italic',
    },
    link: {
        color: '#0b6e99',
        textDecorationLine: 'underline',
    },
    blockquote: {
        backgroundColor: 'transparent',
        borderLeftWidth: 3,
        borderLeftColor: '#e9e9e7',
        paddingLeft: 12,
        marginVertical: 8,
    },
    bullet_list: {
        marginVertical: 2,
    },
    ordered_list: {
        marginVertical: 2,
    },
    list_item: {
        marginBottom: 4,
    },
    bullet_list_icon: {
        color: '#37352f',
        marginLeft: 0,
        marginRight: 6,
    },
    ordered_list_icon: {
        color: '#37352f',
        marginLeft: 0,
        marginRight: 6,
    },
    code_inline: {
        borderWidth: 0,
        backgroundColor: '#f1f1ef',
        color: '#eb5757',
        fontSize: 13,
        fontFamily: MONO,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
    },
    fence: {
        backgroundColor: '#f7f6f3',
        borderWidth: 1,
        borderColor: '#e9e9e7',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        color: '#1f1f1f',
        fontSize: 13,
        lineHeight: 20,
        fontFamily: MONO,
    },
    code_block: {
        backgroundColor: '#f7f6f3',
        borderWidth: 1,
        borderColor: '#e9e9e7',
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        color: '#1f1f1f',
        fontSize: 13,
        lineHeight: 20,
        fontFamily: MONO,
    },
    hr: {
        backgroundColor: '#e9e9e7',
        height: 1,
        marginVertical: 18,
    },
    table: {
        borderWidth: 1,
        borderColor: '#e9e9e7',
        borderRadius: 6,
        marginVertical: 8,
        overflow: 'hidden',
    },
    thead: {
        backgroundColor: '#f7f6f3',
    },
    tbody: {},
    tr: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e9e9e7',
    },
    th: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    td: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    image: {
        width: '100%',
        borderRadius: 8,
        marginVertical: 8,
    },
    text: {},
    textgroup: {},
    hardbreak: {},
    softbreak: {},
});
