import * as Clipboard from 'expo-clipboard';
import type { Root, RootContent } from 'hast';
import { createLowlight, common } from 'lowlight';
import { Check, Copy } from 'lucide-react-native';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
} from 'react-native';
import TextMalet from '@/components/TextMalet/TextMalet';
import { notify } from '@/components/cuaderno/format';

const MONO = Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
});

/** Instancia única: registra las gramáticas comunes de highlight.js. */
const lowlight = createLowlight(common);

const CACHE_MAX = 60;
const highlightCache = new Map<string, Root | null>();

const normalizeLanguage = (info?: string | null): string =>
    (info ?? '').trim().split(/\s+/)[0].toLowerCase();

const LANGUAGE_LABELS: Record<string, string> = {
    js: 'JavaScript',
    javascript: 'JavaScript',
    jsx: 'JSX',
    ts: 'TypeScript',
    typescript: 'TypeScript',
    tsx: 'TSX',
    json: 'JSON',
    bash: 'Bash',
    sh: 'Shell',
    shell: 'Shell',
    zsh: 'Shell',
    py: 'Python',
    python: 'Python',
    css: 'CSS',
    html: 'HTML',
    xml: 'HTML',
    sql: 'SQL',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    markdown: 'Markdown',
    diff: 'Diff',
    java: 'Java',
    kotlin: 'Kotlin',
    swift: 'Swift',
    go: 'Go',
    rust: 'Rust',
    c: 'C',
    cpp: 'C++',
    'c++': 'C++',
    cs: 'C#',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    dockerfile: 'Dockerfile',
    plaintext: 'Texto',
    text: 'Texto',
};

/** Theme claro tipo GitHub/Notion. */
const TOKEN_COLORS: Record<string, TextStyle> = {
    'hljs-keyword': { color: '#cf222e' },
    'hljs-type': { color: '#cf222e' },
    'hljs-built_in': { color: '#0550ae' },
    'hljs-literal': { color: '#0550ae' },
    'hljs-doctag': { color: '#cf222e' },
    'hljs-string': { color: '#0a3069' },
    'hljs-regexp': { color: '#0a3069' },
    'hljs-number': { color: '#0550ae' },
    'hljs-symbol': { color: '#0550ae' },
    'hljs-comment': { color: '#6e7781', fontStyle: 'italic' },
    'hljs-quote': { color: '#6e7781', fontStyle: 'italic' },
    'hljs-meta': { color: '#6e7781' },
    'hljs-title': { color: '#8250df' },
    'hljs-function': { color: '#8250df' },
    'hljs-section': { color: '#8250df' },
    'hljs-class': { color: '#8250df' },
    'hljs-variable': { color: '#953800' },
    'hljs-template-variable': { color: '#953800' },
    'hljs-attr': { color: '#953800' },
    'hljs-attribute': { color: '#953800' },
    'hljs-property': { color: '#0550ae' },
    'hljs-name': { color: '#116329' },
    'hljs-tag': { color: '#116329' },
    'hljs-selector-tag': { color: '#116329' },
    'hljs-selector-id': { color: '#0550ae' },
    'hljs-selector-class': { color: '#953800' },
    'hljs-selector-attr': { color: '#0550ae' },
    'hljs-selector-pseudo': { color: '#8250df' },
    'hljs-operator': { color: '#24292f' },
    'hljs-punctuation': { color: '#24292f' },
    'hljs-addition': { color: '#116329' },
    'hljs-deletion': { color: '#82071e' },
    'hljs-subst': { color: '#24292f' },
    'hljs-params': { color: '#24292f' },
};

const tokenStyle = (classNames: string[]): TextStyle | undefined => {
    for (const name of classNames) {
        const style = TOKEN_COLORS[name];
        if (style) return style;
    }
    return undefined;
};

const getHighlighted = (code: string, language: string): Root | null => {
    const key = `${language}:${code}`;
    if (highlightCache.has(key)) {
        const cached = highlightCache.get(key) ?? null;
        // LRU: refresca la posición de la entrada usada.
        highlightCache.delete(key);
        highlightCache.set(key, cached);
        return cached;
    }

    let result: Root | null = null;
    if (language && lowlight.registered(language)) {
        try {
            result = lowlight.highlight(language, code);
        } catch {
            result = null;
        }
    }

    if (highlightCache.size >= CACHE_MAX) {
        const oldest = highlightCache.keys().next().value;
        if (oldest) highlightCache.delete(oldest);
    }
    highlightCache.set(key, result);
    return result;
};

const renderNode = (node: RootContent, key: string): React.ReactNode => {
    if (node.type === 'text') return node.value;
    if (node.type !== 'element') return null;

    const classNames = Array.isArray(node.properties?.className)
        ? (node.properties.className as string[])
        : [];

    return (
        <Text key={key} style={tokenStyle(classNames)}>
            {node.children.map((child, index) =>
                renderNode(child, `${key}-${index}`)
            )}
        </Text>
    );
};

interface CodeBlockProps {
    code: string;
    language?: string | null;
}

/** Bloque de código con highlight claro, números de línea y copiar. */
const CodeBlock = memo(function CodeBlock({ code, language }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        },
        []
    );

    const cleanCode = code.replace(/\n$/, '');
    const lang = normalizeLanguage(language);
    const highlighted = useMemo(
        () => getHighlighted(cleanCode, lang),
        [cleanCode, lang]
    );

    const lineCount = cleanCode.length === 0 ? 1 : cleanCode.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    const gutterWidth = Math.max(28, String(lineCount).length * 8 + 16);
    const label = LANGUAGE_LABELS[lang] ?? (lang ? lang.toUpperCase() : 'Código');

    const copy = async () => {
        try {
            await Clipboard.setStringAsync(cleanCode);
            setCopied(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setCopied(false), 1400);
        } catch {
            notify('error', 'No se pudo copiar el código.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TextMalet style={styles.language}>{label}</TextMalet>
                <TouchableOpacity
                    style={styles.copyButton}
                    onPress={copy}
                    activeOpacity={0.6}
                    accessibilityLabel="Copiar código"
                >
                    {copied ? (
                        <Check size={12} color="#16a34a" />
                    ) : (
                        <Copy size={12} color="#6b6b6b" />
                    )}
                    <TextMalet
                        style={[styles.copyText, copied && styles.copyTextDone]}
                    >
                        {copied ? 'Copiado' : 'Copiar'}
                    </TextMalet>
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                <View style={[styles.gutter, { width: gutterWidth }]}>
                    <Text style={styles.lineNumbers}>{lineNumbers}</Text>
                </View>
                <ScrollView
                    horizontal
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    style={styles.codeScroll}
                    contentContainerStyle={styles.codeContent}
                >
                    <Text style={styles.codeText}>
                        {highlighted
                            ? highlighted.children.map((child, index) =>
                                  renderNode(child, String(index))
                              )
                            : cleanCode}
                    </Text>
                </ScrollView>
            </View>
        </View>
    );
});

export default CodeBlock;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f7f6f3',
        borderWidth: 1,
        borderColor: '#e9e9e7',
        borderRadius: 8,
        marginVertical: 10,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#f1f1ef',
        borderBottomWidth: 1,
        borderBottomColor: '#e9e9e7',
    },
    language: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6b6b6b',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyText: {
        fontSize: 10.5,
        fontWeight: '600',
        color: '#6b6b6b',
    },
    copyTextDone: {
        color: '#16a34a',
    },
    body: {
        flexDirection: 'row',
    },
    gutter: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 8,
        borderRightWidth: 1,
        borderRightColor: '#e9e9e7',
        backgroundColor: '#f7f6f3',
    },
    lineNumbers: {
        fontFamily: MONO,
        fontSize: 12.5,
        lineHeight: 20,
        color: '#b0b0b0',
        textAlign: 'right',
    },
    codeScroll: {
        flex: 1,
    },
    codeContent: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 10,
    },
    codeText: {
        fontFamily: MONO,
        fontSize: 12.5,
        lineHeight: 20,
        color: '#24292f',
        flexShrink: 0,
    },
});
